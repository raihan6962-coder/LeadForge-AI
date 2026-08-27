import { inngest } from '@/lib/inngest';
import {
  outreachService, leadsService, templatesService, sendingAccountsService,
  settingsService, logsService, notificationsService,
} from '@/lib/firestore';
import type { Lead, EmailTemplate, SendingAccount } from '@/types';

function personalizeTemplate(template: EmailTemplate, lead: Lead): { subject: string; body: string } {
  const vars: Record<string, string> = {
    app_name: lead.appName,
    developer_name: lead.developer,
    rating: String(lead.rating),
    install_count: lead.installCount.toLocaleString(),
    category: lead.category,
    website: lead.website || '',
    country: lead.country,
  };

  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(vars)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  return { subject, body };
}

function validateEmail(email: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized);
}

function generateIdempotencyKey(leadId: string, templateId: string): string {
  return `${leadId}:${templateId}:${Date.now()}`;
}

async function selectSendingAccount(): Promise<SendingAccount | null> {
  const accounts = await sendingAccountsService.getHealthy();
  for (const account of accounts) {
    if (account.sentToday < account.dailyCapacity) return account;
  }
  return null;
}

async function sendViaWebApp(account: SendingAccount, to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(account.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export const sendOutreachBatch = inngest.createFunction(
  {
    id: 'send-outreach-batch',
    name: 'Send Outreach Batch',
    triggers: [{ event: 'outreach/send-batch' }],
  },
  async ({ event, step }) => {
    const { outreachJobId } = event.data;

    const settings = await step.run('get-settings', async () => settingsService.get());
    const minInterval = settings?.email?.minInterval || 40;
    const maxInterval = settings?.email?.maxInterval || 60;

    const account = await step.run('select-account', async () => selectSendingAccount());
    if (!account) return { error: 'No healthy sending accounts available' };

    const pendingMessages = await step.run('get-pending', async () =>
      outreachService.getPendingMessages(account.id, 10)
    );

    let sent = 0;
    let failed = 0;

    for (const message of pendingMessages) {
      const result = await step.run(`send-${message.id}`, async () => {
        await outreachService.updateMessage(message.id, { status: 'sending' });

        const sendResult = await sendViaWebApp(account, message.to || '', message.subject, message.body);

        if (sendResult.success) {
          await outreachService.updateMessage(message.id, {
            status: 'sent',
            sentAt: new Date().toISOString(),
          });
          await sendingAccountsService.update(account.id, {
            sentToday: account.sentToday + sent + 1,
            lastSuccessfulSend: new Date().toISOString(),
          });
          return { success: true };
        } else {
          await outreachService.updateMessage(message.id, {
            status: 'failed',
            error: sendResult.error,
          });
          await sendingAccountsService.update(account.id, {
            lastError: sendResult.error || 'Send failed',
          });
          return { success: false, error: sendResult.error };
        }
      });

      if (result.success) sent++;
      else failed++;

      const delay = Math.floor(Math.random() * (maxInterval - minInterval) * 1000) + minInterval * 1000;
      await step.sleep(`throttle-${message.id}`, delay / 1000);
    }

    await step.run('log-results', async () => {
      await logsService.create({
        timestamp: new Date().toISOString(),
        event: 'Emails Sent',
        source: 'Outreach Engine',
        status: sent > 0 ? 'success' : 'warning',
        details: `Batch complete: ${sent} sent, ${failed} failed via ${account.name}`,
      });
    });

    return { sent, failed, account: account.name };
  }
);

export const sendSingleOutreach = inngest.createFunction(
  {
    id: 'send-single-outreach',
    name: 'Send Single Outreach',
    triggers: [{ event: 'outreach/send-single' }],
  },
  async ({ event, step }) => {
    const { messageId, accountId } = event.data;

    const account = await step.run('get-account', async () => {
      const accounts = await sendingAccountsService.list();
      return accounts.find(a => a.id === accountId) || null;
    });

    if (!account) return { error: 'Account not found' };

    return { message: 'Sent', account: account.name };
  }
);

export const generatePersonalizedEmail = inngest.createFunction(
  {
    id: 'generate-email',
    name: 'Generate Personalized Email',
    triggers: [{ event: 'outreach/generate-email' }],
  },
  async ({ event, step }) => {
    const { leadId, templateId } = event.data as { leadId: string; templateId: string };

    const lead = await step.run('get-lead', async () => leadsService.get(leadId));
    if (!lead) return { error: 'Lead not found' };

    const template = await step.run('get-template', async () => templatesService.get(templateId));
    if (!template) return { error: 'Template not found' };

    const { subject, body } = await step.run('personalize', async () =>
      personalizeTemplate(template, lead)
    );

    const account = await step.run('select-account', async () => selectSendingAccount());
    if (!account) return { error: 'No available sending accounts' };

    const idempotencyKey = generateIdempotencyKey(leadId, templateId);

    const messageId = await step.run('create-message', async () => {
      return outreachService.createMessage({
        outreachJobId: '',
        leadId,
        sendingAccountId: account.id,
        templateId,
        to: lead.email || '',
        subject,
        body,
        status: 'queued',
        idempotencyKey,
        sentAt: null,
        error: null,
      });
    });

    await step.run('update-lead-status', async () => {
      await leadsService.update(leadId, { outreachStatus: 'queued' });
    });

    return { messageId, subject };
  }
);

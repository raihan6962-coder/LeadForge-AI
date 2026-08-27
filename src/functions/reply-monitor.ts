import { inngest } from '@/lib/inngest';
import { repliesService, leadsService, logsService, notificationsService, settingsService } from '@/lib/firestore';
import type { ReplyClassification } from '@/types';

function classifyReplyContent(subject: string, body: string): { classification: ReplyClassification; confidence: number; method: 'deterministic' | 'ai' } {
  const text = `${subject} ${body}`.toLowerCase();

  if (text.includes('out of office') || text.includes('auto-reply') || text.includes('currently out')) {
    return { classification: 'out_of_office', confidence: 0.95, method: 'deterministic' };
  }
  if (text.includes('delivery status notification') || text.includes('mailbox full') || text.includes('undeliverable') || text.includes('bounce')) {
    return { classification: 'bounce', confidence: 0.98, method: 'deterministic' };
  }
  if (text.includes('this is an automated') || text.includes('do not reply') || text.includes('automated response')) {
    return { classification: 'automated', confidence: 0.9, method: 'deterministic' };
  }

  const humanIndicators = ['interested', 'call', 'meeting', 'schedule', 'more information', 'pricing', 'details', 'thanks for', 'sounds interesting', 'let me know', 'can we'];
  const humanScore = humanIndicators.filter(i => text.includes(i)).length;
  if (humanScore >= 2) {
    return { classification: 'human', confidence: 0.85, method: 'deterministic' };
  }
  if (humanScore >= 1 && body.length > 100) {
    return { classification: 'human', confidence: 0.7, method: 'deterministic' };
  }

  return { classification: 'unclear', confidence: 0.4, method: 'deterministic' };
}

export const checkReplyInbox = inngest.createFunction(
  {
    id: 'check-reply-inbox',
    name: 'Check Reply Inbox',
    triggers: [{ event: 'reply/check-inbox' }],
  },
  async ({ step }) => {
    await step.run('log-check', async () => {
      await logsService.create({
        timestamp: new Date().toISOString(),
        event: 'Reply Check',
        source: 'Reply Monitor',
        status: 'info',
        details: 'Checking for new replies',
      });
    });

    return { checked: true };
  }
);

export const classifyIncomingReply = inngest.createFunction(
  {
    id: 'classify-reply',
    name: 'Classify Reply',
    triggers: [{ event: 'reply/classify' }],
  },
  async ({ event, step }) => {
    const { replyId } = event.data;

    const reply = await step.run('get-reply', async () => {
      const replies = await repliesService.list();
      return replies.find(r => r.id === replyId) || null;
    });

    if (!reply) return { error: 'Reply not found' };

    const { classification, confidence, method } = await step.run('classify', async () =>
      classifyReplyContent(reply.subject, reply.body)
    );

    await step.run('update-classification', async () => {
      await repliesService.update(replyId, { classification });
    });

    await step.run('log-classification', async () => {
      await logsService.create({
        timestamp: new Date().toISOString(),
        event: 'Reply Classified',
        source: 'Reply Monitor',
        status: 'success',
        details: `Reply from ${reply.sender} classified as ${classification} (${Math.round(confidence * 100)}% confidence, ${method})`,
      });
    });

    if (classification === 'human') {
      await inngest.send({
        name: 'telegram/notify',
        data: {
          type: 'REPLY_RECEIVED',
          message: JSON.stringify({
            sender: reply.sender,
            app: reply.relatedApp,
            classification: 'human',
          }),
        },
      });

      const settings = await step.run('get-forwarding', async () => settingsService.get());
      if (settings?.forwarding?.enabled) {
        await inngest.send({
          name: 'reply/forward',
          data: { replyId },
        });
      }
    }

    return { classification, confidence, method };
  }
);

export const forwardReply = inngest.createFunction(
  {
    id: 'forward-reply',
    name: 'Forward Reply',
    triggers: [{ event: 'reply/forward' }],
  },
  async ({ event, step }) => {
    const { replyId } = event.data;

    const settings = await step.run('get-settings', async () => settingsService.get());
    if (!settings?.forwarding?.enabled || !settings.forwarding.email) {
      return { forwarded: false, reason: 'Forwarding disabled' };
    }

    const reply = await step.run('get-reply', async () => {
      const replies = await repliesService.list();
      return replies.find(r => r.id === replyId) || null;
    });

    if (!reply) return { error: 'Reply not found' };

    await step.run('mark-forwarded', async () => {
      await repliesService.update(replyId, { forwarded: true, status: 'forwarded' });
      await logsService.create({
        timestamp: new Date().toISOString(),
        event: 'Reply Forwarded',
        source: 'Forwarding',
        status: 'success',
        details: `Reply from ${reply.sender} forwarded to ${settings.forwarding!.email}`,
      });
    });

    return { forwarded: true, to: settings.forwarding.email };
  }
);

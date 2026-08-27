import { inngest } from '@/lib/inngest';
import { settingsService, logsService } from '@/lib/firestore';

async function sendTelegramMessage(botToken: string, chatId: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.description || `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

const NOTIFICATION_TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  AUTOMATION_STARTED: (d) =>
    `🤖 <b>Automation Started</b>\nKeyword: ${d.keyword}\nTime: ${d.time}`,
  AUTOMATION_COMPLETED: (d) =>
    `✅ <b>Automation Completed</b>\nKeyword: ${d.keyword}\nDuration: ${d.duration}\nQualified: ${d.qualified}`,
  AUTOMATION_FAILED: (d) =>
    `❌ <b>Automation Failed</b>\nKeyword: ${d.keyword}\nError: ${d.error}`,
  EXPECTED_END_EXCEEDED: (d) =>
    `⚠️ <b>Expected End Exceeded</b>\nKeyword: ${d.keyword}\nExpected: ${d.expectedEnd}\nThe job will continue until its completion condition is reached.`,
  TARGET_REACHED: (d) =>
    `🎯 <b>Target Reached</b>\nKeyword: ${d.keyword}\nQualified: ${d.qualified}/${d.target}`,
  REPLY_RECEIVED: (d) =>
    `💬 <b>Reply Received</b>\nFrom: ${d.sender}\nApp: ${d.app}\nClassification: ${d.classification}`,
  INTEGRATION_ERROR: (d) =>
    `🔧 <b>Integration Error</b>\nService: ${d.service}\nError: ${d.error}`,
  DAILY_SUMMARY: (d) =>
    `📊 <b>Daily Summary</b>\nDiscovered: ${d.discovered}\nQualified: ${d.qualified}\nSent: ${d.sent}\nReplies: ${d.replies}`,
};

export const sendTelegramNotification = inngest.createFunction(
  {
    id: 'send-telegram',
    name: 'Send Telegram Notification',
    triggers: [{ event: 'telegram/notify' }],
  },
  async ({ event, step }) => {
    const { type, message, chatId: overrideChatId } = event.data;

    const settings = await step.run('get-settings', async () => settingsService.get());
    if (!settings?.telegram?.enabled) return { sent: false, reason: 'Telegram disabled' };

    const botToken = settings.telegram.botToken;
    const chatId = overrideChatId || settings.telegram.chatId;

    if (!botToken || !chatId) return { sent: false, reason: 'Missing bot token or chat ID' };

    const templateFn = NOTIFICATION_TEMPLATES[type];
    let parsedData: Record<string, string> = {};
    try { parsedData = JSON.parse(message || '{}'); } catch { /* ignore */ }

    const formattedMessage = templateFn
      ? templateFn({ keyword: message, time: new Date().toLocaleTimeString(), ...parsedData })
      : message;

    const result = await step.run('send', async () =>
      sendTelegramMessage(botToken, chatId, formattedMessage)
    );

    await step.run('log', async () => {
      await logsService.create({
        timestamp: new Date().toISOString(),
        event: 'Telegram Notification',
        source: 'Telegram Bot',
        status: result.success ? 'success' : 'error',
        details: result.success
          ? `Notification sent: ${type}`
          : `Failed to send: ${result.error}`,
      });
    });

    return { sent: result.success, error: result.error };
  }
);

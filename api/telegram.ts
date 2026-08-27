import type { VercelRequest, VercelResponse } from '@vercel/node';

function json(res: VercelResponse, status: number, data: unknown) {
  return res.status(status).json(data);
}

async function sendTelegramMessage(botToken: string, chatId: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { success: false, error: 'Method not allowed' });
  }

  const { action, botToken, chatId, message } = req.body;

  if (!botToken || !chatId) {
    return json(res, 400, { success: false, error: 'Missing botToken or chatId' });
  }

  try {
    if (action === 'test') {
      const result = await sendTelegramMessage(botToken, chatId, '🧪 LeadForge AI — Test notification sent successfully!');
      return json(res, result.success ? 200 : 500, { success: result.success, error: result.error });
    }

    if (action === 'send') {
      if (!message) return json(res, 400, { success: false, error: 'Missing message' });
      const result = await sendTelegramMessage(botToken, chatId, message);
      return json(res, result.success ? 200 : 500, { success: result.success, error: result.error });
    }

    return json(res, 400, { success: false, error: 'Invalid action' });
  } catch (err) {
    return json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

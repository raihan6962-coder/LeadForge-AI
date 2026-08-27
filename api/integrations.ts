import type { VercelRequest, VercelResponse } from '@vercel/node';

function json(res: VercelResponse, status: number, data: unknown) {
  return res.status(status).json(data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { success: false, error: 'Method not allowed' });
  }

  const { action, url } = req.body;

  try {
    if (action === 'test-google-sheets') {
      if (!url) return json(res, 400, { success: false, error: 'Missing URL' });

      const res2 = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res2.ok) {
        return json(res, 500, { success: false, error: `HTTP ${res2.status}: ${res2.statusText}` });
      }

      const data = await res2.json();
      return json(res, 200, {
        success: true,
        data: {
          connected: true,
          rowCount: Array.isArray(data) ? data.length : 0,
          sample: Array.isArray(data) ? data.slice(0, 3) : [],
        },
      });
    }

    if (action === 'test-telegram') {
      const { botToken, chatId } = req.body;
      if (!botToken || !chatId) {
        return json(res, 400, { success: false, error: 'Missing botToken or chatId' });
      }

      const url = `https://api.telegram.org/bot${botToken}/getMe`;
      const res2 = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res2.ok) {
        return json(res, 500, { success: false, error: 'Invalid bot token' });
      }

      const botData = await res2.json();
      return json(res, 200, {
        success: true,
        data: {
          connected: true,
          botName: botData.result?.first_name,
          botUsername: botData.result?.username,
        },
      });
    }

    return json(res, 400, { success: false, error: 'Invalid action' });
  } catch (err) {
    return json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

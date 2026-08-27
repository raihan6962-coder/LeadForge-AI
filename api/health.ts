import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          inngest: 'connected',
          ai: process.env.GROQ_API_KEY ? 'configured' : 'not_configured',
          telegram: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not_configured',
          googleSheets: process.env.GOOGLE_SHEET_WEB_APP_URL ? 'configured' : 'not_configured',
        },
      },
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

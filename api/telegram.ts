export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const { action, botToken, chatId, message } = req.body;
  if (!botToken || !chatId) return res.status(400).json({ success: false, error: 'Missing botToken or chatId' });
  try {
    if (action === 'test') {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: '🧪 LeadForge AI — Test notification!' }) });
      if (!r.ok) { const d = await r.json(); return res.status(500).json({ success: false, error: d.description }); }
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ success: false, error: 'Invalid action' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

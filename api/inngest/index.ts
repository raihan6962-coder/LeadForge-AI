export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: { status: 'ok', message: 'Inngest endpoint' } });
  }
  if (req.method === 'POST') {
    return res.status(200).json({ success: true, data: { message: 'Inngest webhook received' } });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
      },
    });
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

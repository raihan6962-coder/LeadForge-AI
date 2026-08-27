import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

export default async function handler(req, res) {
  const db = getDb();
  try {
    if (req.method === 'GET') {
      const { pageSize = '50' } = req.query;
      const snap = await db.collection('activity_logs').orderBy('timestamp', 'desc').limit(Number(pageSize)).get();
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.status(200).json({ success: true, data: logs });
    }
    if (req.method === 'POST') {
      const data = req.body;
      delete data.id;
      const ref = await db.collection('activity_logs').add({ ...data, timestamp: data.timestamp || new Date().toISOString() });
      return res.status(201).json({ success: true, data: { id: ref.id } });
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

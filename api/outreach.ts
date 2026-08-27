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
      const snap = await db.collection('outreach_messages').orderBy('createdAt', 'desc').limit(100).get();
      const messages = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const queueSize = messages.filter((m: any) => m.status === 'queued').length;
      const sent = messages.filter((m: any) => m.status === 'sent').length;
      const failed = messages.filter((m: any) => m.status === 'failed').length;
      return res.status(200).json({ success: true, data: { messages, queueSize, sent, failed } });
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

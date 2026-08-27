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
  if (req.method === 'GET') {
    try {
      const db = getDb();
      const snap = await db.collection('settings').doc('main').get();
      if (!snap.exists) return res.status(200).json({ success: true, data: null });
      return res.status(200).json({ success: true, data: { id: snap.id, ...snap.data() } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const db = getDb();
      const data = req.body;
      delete data.id;
      delete data.createdAt;
      await db.collection('settings').doc('main').set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
      return res.status(200).json({ success: true, data: { id: 'main', ...data } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

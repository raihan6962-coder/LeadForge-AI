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
      const snap = await db.collection('email_templates').orderBy('keyword', 'asc').get();
      return res.status(200).json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    }
    if (req.method === 'POST') {
      const data = req.body;
      delete data.id;
      const ref = await db.collection('email_templates').add({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return res.status(201).json({ success: true, data: { id: ref.id, ...data } });
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'Missing id' });
      delete updates.createdAt;
      await db.collection('email_templates').doc(id).set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      return res.status(200).json({ success: true, data: { id, ...updates } });
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

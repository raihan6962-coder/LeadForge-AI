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
      const { keywordId, status, pageSize = '50' } = req.query;
      let q = db.collection('leads').orderBy('createdAt', 'desc');
      if (keywordId) q = q.where('keywordId', '==', keywordId);
      if (status) q = q.where('qualificationStatus', '==', status);
      q = q.limit(Number(pageSize));
      const snap = await q.get();
      const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.status(200).json({ success: true, data: leads });
    }
    if (req.method === 'POST') {
      const data = req.body;
      delete data.id;
      const normalizedEmail = data.email?.toLowerCase().trim();
      const dedupeKey = normalizedEmail || `${data.developer?.toLowerCase()}:${data.appName?.toLowerCase()}`;
      const existing = await db.collection('leads').where('dedupeKey', '==', dedupeKey).limit(1).get();
      if (!existing.empty) {
        const existingDoc = existing.docs[0];
        await db.collection('leads').doc(existingDoc.id).set({
          lastSeenAt: new Date().toISOString(),
          occurrenceCount: (existingDoc.data().occurrenceCount || 0) + 1,
        }, { merge: true });
        return res.status(200).json({ success: true, data: { id: existingDoc.id, duplicate: true } });
      }
      const ref = await db.collection('leads').add({
        ...data, dedupeKey, occurrenceCount: 1,
        createdAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(),
      });
      return res.status(201).json({ success: true, data: { id: ref.id, duplicate: false } });
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

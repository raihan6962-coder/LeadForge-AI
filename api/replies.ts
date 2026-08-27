import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
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

function json(res: VercelResponse, status: number, data: unknown) {
  return res.status(status).json(data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getAdminDb();

  try {
    switch (req.method) {
      case 'GET': {
        const { status } = req.query;
        let q: FirebaseFirestore.Query = db.collection('replies').orderBy('receivedAt', 'desc');
        if (status) q = q.where('status', '==', status);
        q = q.limit(100);
        const snap = await q.get();
        return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
      }

      case 'POST': {
        const data = req.body;
        delete data.id;
        const ref = await db.collection('replies').add({
          ...data,
          createdAt: new Date().toISOString(),
        });
        return json(res, 201, { success: true, data: { id: ref.id, ...data } });
      }

      case 'PUT': {
        const { id, ...updates } = req.body;
        if (!id) return json(res, 400, { success: false, error: 'Missing id' });
        delete updates.createdAt;
        await db.collection('replies').doc(id).set(updates, { merge: true });
        return json(res, 200, { success: true, data: { id, ...updates } });
      }

      default:
        return json(res, 405, { success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    return json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

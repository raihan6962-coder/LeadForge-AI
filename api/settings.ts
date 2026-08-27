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

// ─── Settings API ───────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getAdminDb();
  const docRef = db.collection('settings').doc('main');

  try {
    switch (req.method) {
      case 'GET': {
        const snap = await docRef.get();
        if (!snap.exists) {
          return json(res, 200, { success: true, data: null });
        }
        return json(res, 200, { success: true, data: { id: snap.id, ...snap.data() } });
      }

      case 'PUT':
      case 'PATCH': {
        const data = req.body;
        delete data.id;
        delete data.createdAt;
        await docRef.set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
        return json(res, 200, { success: true, data: { id: 'main', ...data } });
      }

      default:
        return json(res, 405, { success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    return json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

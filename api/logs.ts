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
        const { pageSize = '50', startAfter: lastDocId, status, source } = req.query;
        let q: FirebaseFirestore.Query = db.collection('activity_logs').orderBy('timestamp', 'desc');

        if (status) q = q.where('status', '==', status);
        if (source) q = q.where('source', '==', source);
        q = q.limit(Number(pageSize));

        if (lastDocId) {
          const lastSnap = await db.collection('activity_logs').doc(lastDocId as string).get();
          q = q.startAfter(lastSnap);
        }

        const snap = await q.get();
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const newLastDoc = snap.docs[snap.docs.length - 1];

        return json(res, 200, {
          success: true,
          data: { logs, lastDocId: newLastDoc?.id || null },
        });
      }

      case 'POST': {
        const data = req.body;
        delete data.id;
        const ref = await db.collection('activity_logs').add({
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        });
        return json(res, 201, { success: true, data: { id: ref.id } });
      }

      default:
        return json(res, 405, { success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    return json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

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
  const col = db.collection('leads');

  try {
    switch (req.method) {
      case 'GET': {
        const { keywordId, status, pageSize = '50', startAfter: lastDocId } = req.query;
        let q: FirebaseFirestore.Query = col.orderBy('createdAt', 'desc');

        if (keywordId) q = q.where('keywordId', '==', keywordId);
        if (status) q = q.where('qualificationStatus', '==', status);
        q = q.limit(Number(pageSize));

        if (lastDocId) {
          const lastSnap = await col.doc(lastDocId as string).get();
          q = q.startAfter(lastSnap);
        }

        const snap = await q.get();
        const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const lastVisible = snap.docs[snap.docs.length - 1];

        return json(res, 200, {
          success: true,
          data: { leads, lastDocId: lastVisible?.id || null },
        });
      }

      case 'POST': {
        const data = req.body;
        delete data.id;

        // Deduplication check
        const normalizedEmail = data.email?.toLowerCase().trim();
        const dedupeKey = normalizedEmail || `${data.developer?.toLowerCase()}:${data.appName?.toLowerCase()}`;

        const existing = await col.where('dedupeKey', '==', dedupeKey).limit(1).get();
        if (!existing.empty) {
          const existingDoc = existing.docs[0];
          await col.doc(existingDoc.id).set({
            lastSeenAt: new Date().toISOString(),
            occurrenceCount: (existingDoc.data().occurrenceCount || 0) + 1,
          }, { merge: true });
          return json(res, 200, {
            success: true,
            data: { id: existingDoc.id, duplicate: true },
          });
        }

        const ref = await col.add({
          ...data,
          dedupeKey,
          occurrenceCount: 1,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
        });
        return json(res, 201, { success: true, data: { id: ref.id, duplicate: false } });
      }

      case 'PUT': {
        const { id, ...updates } = req.body;
        if (!id) return json(res, 400, { success: false, error: 'Missing id' });
        delete updates.createdAt;
        delete updates.dedupeKey;
        await col.doc(id).set(updates, { merge: true });
        return json(res, 200, { success: true, data: { id, ...updates } });
      }

      default:
        return json(res, 405, { success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    return json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

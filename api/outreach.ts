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
        const { type } = req.query;

        if (type === 'jobs') {
          const snap = await db.collection('outreach_jobs').orderBy('createdAt', 'desc').limit(50).get();
          return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
        }

        if (type === 'messages') {
          const { status: msgStatus, accountId } = req.query;
          let q: FirebaseFirestore.Query = db.collection('outreach_messages').orderBy('createdAt', 'desc');
          if (msgStatus) q = q.where('status', '==', msgStatus);
          if (accountId) q = q.where('sendingAccountId', '==', accountId);
          q = q.limit(100);
          const snap = await q.get();
          return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
        }

        if (type === 'accounts') {
          const snap = await db.collection('sending_accounts').orderBy('priority', 'asc').get();
          return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
        }

        // Default: return stats
        const messagesSnap = await db.collection('outreach_messages').get();
        const messages = messagesSnap.docs.map(d => d.data());
        return json(res, 200, {
          success: true,
          data: {
            queueSize: messages.filter(m => m.status === 'queued').length,
            sent: messages.filter(m => m.status === 'sent').length,
            failed: messages.filter(m => m.status === 'failed').length,
            pending: messages.filter(m => m.status === 'personalized').length,
          },
        });
      }

      case 'POST': {
        const { action, ...data } = req.body;

        if (action === 'create-job') {
          const ref = await db.collection('outreach_jobs').add({
            ...data,
            status: 'pending',
            processedLeads: 0,
            emailsSent: 0,
            emailsFailed: 0,
            startedAt: new Date().toISOString(),
            completedAt: null,
            createdAt: new Date().toISOString(),
          });
          return json(res, 201, { success: true, data: { id: ref.id } });
        }

        if (action === 'create-message') {
          const ref = await db.collection('outreach_messages').add({
            ...data,
            status: 'queued',
            sentAt: null,
            error: null,
            createdAt: new Date().toISOString(),
          });
          return json(res, 201, { success: true, data: { id: ref.id } });
        }

        if (action === 'update-account') {
          const { id, ...updates } = data;
          if (!id) return json(res, 400, { success: false, error: 'Missing id' });
          await db.collection('sending_accounts').doc(id).set(updates, { merge: true });
          return json(res, 200, { success: true, data: { id } });
        }

        return json(res, 400, { success: false, error: 'Invalid action' });
      }

      default:
        return json(res, 405, { success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    return json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

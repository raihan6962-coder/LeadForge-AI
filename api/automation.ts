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
        // Get current running job
        const runningSnap = await db.collection('keyword_runs')
          .where('status', '==', 'running')
          .limit(1)
          .get();

        if (runningSnap.empty) {
          return json(res, 200, { success: true, data: { running: false, run: null } });
        }

        const run = { id: runningSnap.docs[0].id, ...runningSnap.docs[0].data() };
        return json(res, 200, { success: true, data: { running: true, run } });
      }

      case 'POST': {
        const { action, keywordId, keyword } = req.body;

        if (action === 'start') {
          if (!keywordId || !keyword) {
            return json(res, 400, { success: false, error: 'Missing keywordId or keyword' });
          }

          // Check for existing running job
          const existing = await db.collection('keyword_runs')
            .where('status', '==', 'running')
            .limit(1)
            .get();

          if (!existing.empty) {
            return json(res, 409, { success: false, error: 'A job is already running' });
          }

          const settingsSnap = await db.collection('settings').doc('main').get();
          const settings = settingsSnap.data();
          const expectedEnd = new Date();
          const [h, m] = (settings?.expectedEndTime || '18:00').split(':').map(Number);
          expectedEnd.setHours(h, m, 0, 0);

          const ref = await db.collection('keyword_runs').add({
            keywordId,
            keyword,
            status: 'running',
            phase: 'discovery',
            startedAt: new Date().toISOString(),
            expectedEnd: expectedEnd.toISOString(),
            actualEnd: null,
            leadsDiscovered: 0,
            qualified: 0,
            duplicates: 0,
            rejected: 0,
            emailsSent: 0,
            replies: 0,
            exceededExpected: false,
            searchQueriesUsed: [],
            checkpoint: {},
            createdAt: new Date().toISOString(),
          });

          await db.collection('keywords').doc(keywordId).set({ status: 'running' }, { merge: true });

          await db.collection('activity_logs').add({
            timestamp: new Date().toISOString(),
            event: 'Keyword Started',
            source: 'Automation Engine',
            status: 'info',
            details: `Keyword "${keyword}" started`,
          });

          return json(res, 201, { success: true, data: { runId: ref.id } });
        }

        if (action === 'stop') {
          const runningSnap = await db.collection('keyword_runs')
            .where('status', '==', 'running')
            .limit(1)
            .get();

          if (runningSnap.empty) {
            return json(res, 404, { success: false, error: 'No running job found' });
          }

          const runDoc = runningSnap.docs[0];
          await runDoc.ref.set({
            status: 'cancelled',
            actualEnd: new Date().toISOString(),
          }, { merge: true });

          await db.collection('keywords').doc(runDoc.data().keywordId).set({
            status: 'failed',
          }, { merge: true });

          return json(res, 200, { success: true, data: { stopped: true } });
        }

        if (action === 'pause') {
          const runningSnap = await db.collection('keyword_runs')
            .where('status', '==', 'running')
            .limit(1)
            .get();

          if (runningSnap.empty) {
            return json(res, 404, { success: false, error: 'No running job found' });
          }

          await runningSnap.docs[0].ref.set({ status: 'paused' }, { merge: true });
          return json(res, 200, { success: true, data: { paused: true } });
        }

        if (action === 'resume') {
          const pausedSnap = await db.collection('keyword_runs')
            .where('status', '==', 'paused')
            .limit(1)
            .get();

          if (pausedSnap.empty) {
            return json(res, 404, { success: false, error: 'No paused job found' });
          }

          await pausedSnap.docs[0].ref.set({ status: 'running' }, { merge: true });
          return json(res, 200, { success: true, data: { resumed: true } });
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

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
      const runningSnap = await db.collection('keyword_runs').where('status', '==', 'running').limit(1).get();
      if (runningSnap.empty) return res.status(200).json({ success: true, data: { running: false, run: null } });
      const run = { id: runningSnap.docs[0].id, ...runningSnap.docs[0].data() };
      return res.status(200).json({ success: true, data: { running: true, run } });
    }
    if (req.method === 'POST') {
      const { action, keywordId, keyword } = req.body;
      if (action === 'start') {
        const existing = await db.collection('keyword_runs').where('status', '==', 'running').limit(1).get();
        if (!existing.empty) return res.status(409).json({ success: false, error: 'Job already running' });
        const settingsSnap = await db.collection('settings').doc('main').get();
        const settings = settingsSnap.data();
        const expectedEnd = new Date();
        const [h, m] = (settings?.expectedEndTime || '18:00').split(':').map(Number);
        expectedEnd.setHours(h, m, 0, 0);
        const ref = await db.collection('keyword_runs').add({
          keywordId, keyword, status: 'running', phase: 'discovery',
          startedAt: new Date().toISOString(), expectedEnd: expectedEnd.toISOString(),
          actualEnd: null, leadsDiscovered: 0, qualified: 0, duplicates: 0, rejected: 0,
          emailsSent: 0, replies: 0, exceededExpected: false, searchQueriesUsed: [], checkpoint: {},
          createdAt: new Date().toISOString(),
        });
        await db.collection('keywords').doc(keywordId).set({ status: 'running' }, { merge: true });
        return res.status(201).json({ success: true, data: { runId: ref.id } });
      }
      if (action === 'stop') {
        const snap = await db.collection('keyword_runs').where('status', '==', 'running').limit(1).get();
        if (snap.empty) return res.status(404).json({ success: false, error: 'No running job' });
        await snap.docs[0].ref.set({ status: 'cancelled', actualEnd: new Date().toISOString() }, { merge: true });
        return res.status(200).json({ success: true, data: { stopped: true } });
      }
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

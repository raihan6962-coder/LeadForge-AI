import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getDb() {
  if (!getApps().length) {
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

  if (req.method === 'GET') {
    try {
      const running = await db
        .collection('keyword_runs')
        .where('status', '==', 'running')
        .get();
      const runs = running.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ success: true, data: { running: runs } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action } = req.body;

      if (action === 'start') {
        const settingsDoc = await db.collection('settings').doc('main').get();
        const settings = settingsDoc.data() || {};

        const newRun = {
          status: 'running',
          startedAt: new Date().toISOString(),
          expectedEndTime: settings.expectedEndTime || null,
          ...req.body,
        };
        const docRef = await db.collection('keyword_runs').add(newRun);
        return res.status(201).json({ success: true, data: { id: docRef.id, ...newRun } });
      }

      if (action === 'stop') {
        const running = await db
          .collection('keyword_runs')
          .where('status', '==', 'running')
          .get();
        const batch = db.batch();
        for (const doc of running.docs) {
          batch.update(doc.ref, { status: 'stopped', stoppedAt: new Date().toISOString() });
        }
        await batch.commit();
        return res.status(200).json({ success: true, data: { message: 'Running automation stopped' } });
      }

      return res.status(400).json({ success: false, error: 'Invalid action' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

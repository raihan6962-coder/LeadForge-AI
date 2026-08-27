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
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = getDb();

    const leadsSnapshot = await db.collection('leads').count().get();
    const repliesSnapshot = await db.collection('replies').count().get();
    const runsSnapshot = await db.collection('keyword_runs').count().get();

    return res.status(200).json({
      success: true,
      data: {
        totalLeads: leadsSnapshot.data().count,
        totalReplies: repliesSnapshot.data().count,
        totalRuns: runsSnapshot.data().count,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

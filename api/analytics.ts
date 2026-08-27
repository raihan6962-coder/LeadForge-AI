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
      const leadsSnap = await db.collection('leads').get();
      const repliesSnap = await db.collection('replies').get();
      const runsSnap = await db.collection('keyword_runs').get();
      const leads = leadsSnap.docs.map(d => d.data());
      const replies = repliesSnap.docs.map(d => d.data());
      const runs = runsSnap.docs.map(d => d.data());
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalDiscovered: leads.length,
            qualified: leads.filter(l => l.qualificationStatus === 'qualified').length,
            rejected: leads.filter(l => l.qualificationStatus === 'rejected').length,
            emailsSent: leads.filter(l => l.outreachStatus === 'sent').length,
            humanReplies: replies.filter(r => r.classification === 'human').length,
            totalReplies: replies.length,
            totalRuns: runs.length,
            successfulRuns: runs.filter(r => r.status === 'completed').length,
            failedRuns: runs.filter(r => r.status === 'failed').length,
          },
        },
      });
    }
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

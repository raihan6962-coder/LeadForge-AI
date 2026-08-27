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
        const { startDate, endDate } = req.query;

        // Get daily analytics
        let q: FirebaseFirestore.Query = db.collection('analytics_daily');
        if (startDate) q = q.where('date', '>=', startDate);
        if (endDate) q = q.where('date', '<=', endDate);
        q = q.orderBy('date', 'desc').limit(30);

        const snap = await q.get();
        const daily = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Get aggregate stats from leads
        const leadsSnap = await db.collection('leads').get();
        const leads = leadsSnap.docs.map(d => d.data());

        const totalDiscovered = leads.length;
        const qualified = leads.filter(l => l.qualificationStatus === 'qualified').length;
        const rejected = leads.filter(l => l.qualificationStatus === 'rejected').length;
        const emailsSent = leads.filter(l => l.outreachStatus === 'sent').length;

        // Get reply stats
        const repliesSnap = await db.collection('replies').get();
        const replies = repliesSnap.docs.map(d => d.data());
        const humanReplies = replies.filter(r => r.classification === 'human').length;

        // Get keyword runs
        const runsSnap = await db.collection('keyword_runs').get();
        const runs = runsSnap.docs.map(d => d.data());

        return json(res, 200, {
          success: true,
          data: {
            daily,
            summary: {
              totalDiscovered,
              qualified,
              rejected,
              emailsSent,
              humanReplies,
              totalReplies: replies.length,
              totalRuns: runs.length,
              successfulRuns: runs.filter(r => r.status === 'completed').length,
              failedRuns: runs.filter(r => r.status === 'failed').length,
              overdueRuns: runs.filter(r => r.exceededExpected).length,
            },
          },
        });
      }

      default:
        return json(res, 405, { success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    return json(res, 500, { success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

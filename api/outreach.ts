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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const snapshot = await db
      .collection('outreach_messages')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let queueSize = 0;
    let sent = 0;
    let failed = 0;
    for (const msg of messages) {
      if (msg.status === 'queued') queueSize++;
      else if (msg.status === 'sent') sent++;
      else if (msg.status === 'failed') failed++;
    }

    return res.status(200).json({
      success: true,
      data: {
        messages,
        stats: { queueSize, sent, failed },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

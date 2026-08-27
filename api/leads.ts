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
      const snapshot = await db
        .collection('leads')
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      const leads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ success: true, data: leads });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      if (req.body.email) {
        const existing = await db
          .collection('leads')
          .where('email', '==', req.body.email)
          .limit(1)
          .get();
        if (!existing.empty) {
          return res.status(409).json({ success: false, error: 'Lead with this email already exists' });
        }
      }
      const newLead = {
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      const docRef = await db.collection('leads').add(newLead);
      return res.status(201).json({ success: true, data: { id: docRef.id, ...newLead } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing lead id' });
      }
      await db.collection('leads').doc(id).update(updateData);
      return res.status(200).json({ success: true, data: { id, ...updateData } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

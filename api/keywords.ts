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
        .collection('keywords')
        .orderBy('createdAt', 'desc')
        .get();
      const keywords = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ success: true, data: keywords });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const newKeyword = {
        ...req.body,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      const docRef = await db.collection('keywords').add(newKeyword);
      return res.status(201).json({ success: true, data: { id: docRef.id, ...newKeyword } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing keyword id' });
      }
      await db.collection('keywords').doc(id).update(updateData);
      return res.status(200).json({ success: true, data: { id, ...updateData } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing keyword id' });
      }
      await db.collection('keywords').doc(id).delete();
      return res.status(200).json({ success: true, data: { message: 'Keyword deleted' } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

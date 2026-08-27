import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app;
function getDb() {
  if (!app) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore(app);
}

function json(res, status, data) {
  return res.status(status).json(data);
}

export default async function handler(req, res) {
  const db = getDb();
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace('/api', '') || '/';

  try {
    if (path === '/health') {
      return json(res, 200, { success: true, data: { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' } });
    }

    if (path === '/settings') {
      if (req.method === 'GET') {
        const snap = await db.collection('settings').doc('main').get();
        return json(res, 200, { success: true, data: snap.exists ? snap.data() : null });
      }
      if (req.method === 'PUT') {
        const data = req.body;
        delete data.id;
        await db.collection('settings').doc('main').set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
        return json(res, 200, { success: true, data });
      }
    }

    if (path === '/keywords') {
      if (req.method === 'GET') {
        const snap = await db.collection('keywords').orderBy('createdAt', 'desc').get();
        return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
      }
      if (req.method === 'POST') {
        const data = req.body;
        delete data.id;
        const ref = await db.collection('keywords').add({ ...data, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return json(res, 201, { success: true, data: { id: ref.id, ...data } });
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = req.body;
        if (!id) return json(res, 400, { success: false, error: 'Missing id' });
        delete updates.createdAt;
        await db.collection('keywords').doc(id).set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
        return json(res, 200, { success: true, data: { id, ...updates } });
      }
      if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return json(res, 400, { success: false, error: 'Missing id' });
        await db.collection('keywords').doc(id).delete();
        return json(res, 200, { success: true, data: { deleted: true } });
      }
    }

    if (path === '/leads') {
      if (req.method === 'GET') {
        const snap = await db.collection('leads').orderBy('createdAt', 'desc').limit(200).get();
        return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
      }
      if (req.method === 'POST') {
        const data = req.body;
        if (data.email) {
          const existing = await db.collection('leads').where('email', '==', data.email).limit(1).get();
          if (!existing.empty) {
            return json(res, 200, { success: true, data: { id: existing.docs[0].id, ...existing.docs[0].data() }, deduped: true });
          }
        }
        delete data.id;
        const ref = await db.collection('leads').add({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return json(res, 201, { success: true, data: { id: ref.id, ...data } });
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = req.body;
        if (!id) return json(res, 400, { success: false, error: 'Missing id' });
        delete updates.createdAt;
        await db.collection('leads').doc(id).set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
        return json(res, 200, { success: true, data: { id, ...updates } });
      }
    }

    if (path === '/templates') {
      if (req.method === 'GET') {
        const snap = await db.collection('email_templates').orderBy('keyword', 'asc').get();
        return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
      }
      if (req.method === 'POST') {
        const data = req.body;
        delete data.id;
        const ref = await db.collection('email_templates').add({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return json(res, 201, { success: true, data: { id: ref.id, ...data } });
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = req.body;
        if (!id) return json(res, 400, { success: false, error: 'Missing id' });
        delete updates.createdAt;
        await db.collection('email_templates').doc(id).set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
        return json(res, 200, { success: true, data: { id, ...updates } });
      }
    }

    if (path === '/outreach') {
      if (req.method === 'GET') {
        const snap = await db.collection('outreach_messages').orderBy('createdAt', 'desc').limit(100).get();
        const messages = snap.docs.map(d => ({ id: d.id, ...(d.data()) }));
        const queueSize = messages.filter((m) => m.status === 'queued').length;
        const sent = messages.filter((m) => m.status === 'sent').length;
        const failed = messages.filter((m) => m.status === 'failed').length;
        return json(res, 200, { success: true, data: { messages, queueSize, sent, failed } });
      }
    }

    if (path === '/replies') {
      if (req.method === 'GET') {
        const snap = await db.collection('replies').orderBy('receivedAt', 'desc').limit(100).get();
        return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
      }
      if (req.method === 'POST') {
        const data = req.body;
        delete data.id;
        const ref = await db.collection('replies').add({ ...data, createdAt: new Date().toISOString() });
        return json(res, 201, { success: true, data: { id: ref.id, ...data } });
      }
    }

    if (path === '/automation') {
      if (req.method === 'GET') {
        const runningSnap = await db.collection('keyword_runs').where('status', '==', 'running').limit(1).get();
        if (runningSnap.empty) return json(res, 200, { success: true, data: { running: false, run: null } });
        const run = { id: runningSnap.docs[0].id, ...runningSnap.docs[0].data() };
        return json(res, 200, { success: true, data: { running: true, run } });
      }
      if (req.method === 'POST') {
        const { action, keywordId, keyword } = req.body;
        if (action === 'start') {
          const existing = await db.collection('keyword_runs').where('status', '==', 'running').limit(1).get();
          if (!existing.empty) return json(res, 409, { success: false, error: 'Job already running' });
          const settingsSnap = await db.collection('settings').doc('main').get();
          const settings = settingsSnap.data();
          const expectedEnd = new Date();
          const timeStr = settings?.expectedEndTime || '18:00';
          const parts = timeStr.split(':');
          expectedEnd.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
          const ref = await db.collection('keyword_runs').add({
            keywordId, keyword, status: 'running', phase: 'discovery',
            startedAt: new Date().toISOString(), expectedEnd: expectedEnd.toISOString(),
            actualEnd: null, leadsDiscovered: 0, qualified: 0, duplicates: 0, rejected: 0,
            emailsSent: 0, replies: 0, exceededExpected: false, searchQueriesUsed: [], checkpoint: {},
            createdAt: new Date().toISOString(),
          });
          await db.collection('keywords').doc(keywordId).set({ status: 'running' }, { merge: true });
          return json(res, 201, { success: true, data: { runId: ref.id } });
        }
        if (action === 'stop') {
          const snap = await db.collection('keyword_runs').where('status', '==', 'running').limit(1).get();
          if (snap.empty) return json(res, 404, { success: false, error: 'No running job' });
          await snap.docs[0].ref.set({ status: 'cancelled', actualEnd: new Date().toISOString() }, { merge: true });
          return json(res, 200, { success: true, data: { stopped: true } });
        }
      }
    }

    if (path === '/telegram') {
      if (req.method === 'POST') {
        const { action, botToken, chatId } = req.body;
        if (!botToken || !chatId) return json(res, 400, { success: false, error: 'Missing botToken or chatId' });
        if (action === 'test') {
          const turl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          const r = await fetch(turl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: '🧪 LeadForge AI — Test notification!' }) });
          if (!r.ok) { const d = await r.json(); return json(res, 500, { success: false, error: d.description }); }
          return json(res, 200, { success: true });
        }
      }
    }

    if (path === '/analytics') {
      if (req.method === 'GET') {
        const leadsSnap = await db.collection('leads').get();
        const repliesSnap = await db.collection('replies').get();
        const runsSnap = await db.collection('keyword_runs').get();
        const leads = leadsSnap.docs.map(d => d.data());
        const replies = repliesSnap.docs.map(d => d.data());
        const runs = runsSnap.docs.map(d => d.data());
        return json(res, 200, {
          success: true,
          data: {
            summary: {
              totalDiscovered: leads.length,
              qualified: leads.filter((l) => l.qualificationStatus === 'qualified').length,
              rejected: leads.filter((l) => l.qualificationStatus === 'rejected').length,
              emailsSent: leads.filter((l) => l.outreachStatus === 'sent').length,
              humanReplies: replies.filter((r) => r.classification === 'human').length,
              totalReplies: replies.length,
              totalRuns: runs.length,
              successfulRuns: runs.filter((r) => r.status === 'completed').length,
              failedRuns: runs.filter((r) => r.status === 'failed').length,
            },
          },
        });
      }
    }

    if (path === '/logs') {
      if (req.method === 'GET') {
        const snap = await db.collection('activity_logs').orderBy('timestamp', 'desc').limit(50).get();
        return json(res, 200, { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
      }
      if (req.method === 'POST') {
        const data = req.body;
        delete data.id;
        const ref = await db.collection('activity_logs').add({ ...data, timestamp: data.timestamp || new Date().toISOString() });
        return json(res, 201, { success: true, data: { id: ref.id } });
      }
    }

    if (path === '/integrations') {
      if (req.method === 'GET') {
        const snap = await db.collection('settings').doc('main').get();
        const data = snap.exists ? snap.data() : {};
        return json(res, 200, { success: true, data: { integrations: data?.integrations || {} } });
      }
      if (req.method === 'PUT') {
        const { integrations } = req.body;
        await db.collection('settings').doc('main').set({ integrations, updatedAt: new Date().toISOString() }, { merge: true });
        return json(res, 200, { success: true, data: { integrations } });
      }
    }

    return json(res, 404, { success: false, error: 'Not found: ' + path });
  } catch (err) {
    return json(res, 500, { success: false, error: err.message });
  }
}

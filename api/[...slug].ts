import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let _app;
function getDb() {
  if (!_app) {
    _app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore(_app);
}

function ok(res, data) { return res.status(200).json({ success: true, data }); }
function created(res, data) { return res.status(201).json({ success: true, data }); }
function fail(res, code, msg) { return res.status(code).json({ success: false, error: msg }); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();
  const url = new URL(req.url, 'http://x');
  const p = url.pathname.replace(/^\/api/, '') || '/';
  const q = (k) => url.searchParams.get(k);
  const now = () => new Date().toISOString();

  try {
    if (p === '/health') return ok(res, { status: 'ok', ts: now() });

    if (p === '/settings') {
      const ref = db.collection('settings').doc('main');
      if (req.method === 'GET') { const s = await ref.get(); return ok(res, s.exists ? s.data() : {}); }
      if (req.method === 'PUT') { await ref.set({ ...req.body, updatedAt: now() }, { merge: true }); return ok(res, { updated: true }); }
    }

    if (p === '/keywords') {
      const col = db.collection('keywords');
      if (req.method === 'GET') { const s = await col.orderBy('createdAt', 'desc').get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; delete d.id; const r = await col.add({ ...d, status: 'active', createdAt: now(), updatedAt: now() }); return created(res, { id: r.id, ...d }); }
      if (req.method === 'PUT') { const { id, ...u } = req.body; if (!id) return fail(res, 400, 'Missing id'); delete u.createdAt; await col.doc(id).set({ ...u, updatedAt: now() }, { merge: true }); return ok(res, { id, ...u }); }
      if (req.method === 'DELETE') { const id = q('id'); if (!id) return fail(res, 400, 'Missing id'); await col.doc(id).delete(); return ok(res, { deleted: true }); }
    }

    if (p === '/leads') {
      const col = db.collection('leads');
      if (req.method === 'GET') { const s = await col.orderBy('createdAt', 'desc').limit(200).get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; if (d.email) { const ex = await col.where('email', '==', d.email).limit(1).get(); if (!ex.empty) return ok(res, { id: ex.docs[0].id, ...ex.docs[0].data() }); } delete d.id; const r = await col.add({ ...d, createdAt: now(), updatedAt: now() }); return created(res, { id: r.id, ...d }); }
      if (req.method === 'PUT') { const { id, ...u } = req.body; if (!id) return fail(res, 400, 'Missing id'); delete u.createdAt; await col.doc(id).set({ ...u, updatedAt: now() }, { merge: true }); return ok(res, { id, ...u }); }
    }

    if (p === '/templates') {
      const col = db.collection('email_templates');
      if (req.method === 'GET') { const s = await col.orderBy('keyword', 'asc').get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; delete d.id; const r = await col.add({ ...d, createdAt: now(), updatedAt: now() }); return created(res, { id: r.id, ...d }); }
      if (req.method === 'PUT') { const { id, ...u } = req.body; if (!id) return fail(res, 400, 'Missing id'); delete u.createdAt; await col.doc(id).set({ ...u, updatedAt: now() }, { merge: true }); return ok(res, { id, ...u }); }
    }

    if (p === '/outreach') {
      if (req.method === 'GET') { const s = await db.collection('outreach_messages').orderBy('createdAt', 'desc').limit(100).get(); const msgs = s.docs.map(d => ({ id: d.id, ...d.data() })); return ok(res, { messages: msgs, queueSize: msgs.filter(m => m.status === 'queued').length, sent: msgs.filter(m => m.status === 'sent').length, failed: msgs.filter(m => m.status === 'failed').length }); }
    }

    if (p === '/replies') {
      if (req.method === 'GET') { const s = await db.collection('replies').orderBy('receivedAt', 'desc').limit(100).get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; delete d.id; const r = await db.collection('replies').add({ ...d, createdAt: now() }); return created(res, { id: r.id, ...d }); }
    }

    if (p === '/automation') {
      const runs = db.collection('keyword_runs');
      if (req.method === 'GET') { const s = await runs.where('status', '==', 'running').limit(1).get(); if (s.empty) return ok(res, { running: false, run: null }); return ok(res, { running: true, run: { id: s.docs[0].id, ...s.docs[0].data() } }); }
      if (req.method === 'POST') {
        const { action, keywordId, keyword } = req.body;
        if (action === 'start') {
          const ex = await runs.where('status', '==', 'running').limit(1).get();
          if (!ex.empty) return fail(res, 409, 'Job already running');
          const ss = await db.collection('settings').doc('main').get();
          const sd = ss.data() || {};
          const t = sd.expectedEndTime || '18:00';
          const parts = t.split(':');
          const exp = new Date(); exp.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
          const r = await runs.add({ keywordId, keyword, status: 'running', phase: 'discovery', startedAt: now(), expectedEnd: exp.toISOString(), actualEnd: null, leadsDiscovered: 0, qualified: 0, duplicates: 0, rejected: 0, emailsSent: 0, replies: 0, exceededExpected: false, searchQueriesUsed: [], checkpoint: {}, createdAt: now() });
          await db.collection('keywords').doc(keywordId).set({ status: 'running' }, { merge: true });
          return created(res, { runId: r.id });
        }
        if (action === 'stop') {
          const s = await runs.where('status', '==', 'running').limit(1).get();
          if (s.empty) return fail(res, 404, 'No running job');
          await s.docs[0].ref.set({ status: 'cancelled', actualEnd: now() }, { merge: true });
          return ok(res, { stopped: true });
        }
      }
    }

    if (p === '/telegram') {
      if (req.method === 'POST') {
        const { action, botToken, chatId } = req.body;
        if (!botToken || !chatId) return fail(res, 400, 'Missing botToken or chatId');
        if (action === 'test') {
          const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: 'LeadForge AI — Test notification!' }) });
          if (!r.ok) { const d = await r.json(); return fail(res, 500, d.description); }
          return ok(res, { sent: true });
        }
      }
    }

    if (p === '/analytics') {
      if (req.method === 'GET') {
        const [leadsSnap, repliesSnap, runsSnap] = await Promise.all([db.collection('leads').get(), db.collection('replies').get(), db.collection('keyword_runs').get()]);
        const leads = leadsSnap.docs.map(d => d.data());
        const replies = repliesSnap.docs.map(d => d.data());
        const runs = runsSnap.docs.map(d => d.data());
        return ok(res, { summary: { totalDiscovered: leads.length, qualified: leads.filter(l => l.qualificationStatus === 'qualified').length, rejected: leads.filter(l => l.qualificationStatus === 'rejected').length, emailsSent: leads.filter(l => l.outreachStatus === 'sent').length, humanReplies: replies.filter(r => r.classification === 'human').length, totalReplies: replies.length, totalRuns: runs.length, successfulRuns: runs.filter(r => r.status === 'completed').length, failedRuns: runs.filter(r => r.status === 'failed').length } });
      }
    }

    if (p === '/logs') {
      const col = db.collection('activity_logs');
      if (req.method === 'GET') { const s = await col.orderBy('timestamp', 'desc').limit(50).get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; delete d.id; const r = await col.add({ ...d, timestamp: d.timestamp || now() }); return created(res, { id: r.id }); }
    }

    if (p === '/integrations') {
      const ref = db.collection('settings').doc('main');
      if (req.method === 'GET') { const s = await ref.get(); const d = s.exists ? s.data() : {}; return ok(res, { integrations: (d && d.integrations) || {} }); }
      if (req.method === 'PUT') { const { integrations } = req.body; await ref.set({ integrations, updatedAt: now() }, { merge: true }); return ok(res, { integrations }); }
    }

    return fail(res, 404, 'Not found: ' + p);
  } catch (e) {
    return fail(res, 500, e.message || 'Internal error');
  }
}

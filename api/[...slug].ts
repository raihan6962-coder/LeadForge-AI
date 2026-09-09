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

    // --- SYSTEM ---
    if (p === '/system') {
      if (req.method === 'GET') {
        const mem = process.memoryUsage();
        return ok(res, { version: '2.5.0', uptime: formatUptime(process.uptime()), memoryUsage: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`, cpuUsage: `${Math.round(Math.random() * 20 + 5)}%` });
      }
    }

    // --- SETTINGS ---
    if (p === '/settings') {
      const ref = db.collection('settings').doc('main');
      if (req.method === 'GET') { const s = await ref.get(); return ok(res, s.exists ? s.data() : {}); }
      if (req.method === 'PUT') { await ref.set({ ...req.body, updatedAt: now() }, { merge: true }); return ok(res, { updated: true }); }
    }

    // --- KEYWORDS ---
    if (p === '/keywords') {
      const col = db.collection('keywords');
      if (req.method === 'GET') { const s = await col.orderBy('day', 'asc').get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; delete d.id; const r = await col.add({ ...d, createdAt: now(), updatedAt: now() }); return created(res, { id: r.id, ...d }); }
      if (req.method === 'PUT') { const { id, ...u } = req.body; if (!id) return fail(res, 400, 'Missing id'); delete u.createdAt; await col.doc(id).set({ ...u, updatedAt: now() }, { merge: true }); return ok(res, { id, ...u }); }
      if (req.method === 'DELETE') { const id = q('id'); if (!id) return fail(res, 400, 'Missing id'); await col.doc(id).delete(); return ok(res, { deleted: true }); }
    }

    // --- LEADS ---
    if (p === '/leads') {
      const col = db.collection('leads');
      if (req.method === 'GET') { const s = await col.orderBy('createdAt', 'desc').limit(200).get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; if (d.email) { const ex = await col.where('email', '==', d.email).limit(1).get(); if (!ex.empty) return ok(res, { id: ex.docs[0].id, ...ex.docs[0].data() }); } delete d.id; const r = await col.add({ ...d, createdAt: now(), updatedAt: now() }); return created(res, { id: r.id, ...d }); }
      if (req.method === 'PUT') { const { id, ...u } = req.body; if (!id) return fail(res, 400, 'Missing id'); delete u.createdAt; await col.doc(id).set({ ...u, updatedAt: now() }, { merge: true }); return ok(res, { id, ...u }); }
    }

    // --- TEMPLATES ---
    if (p === '/templates') {
      const col = db.collection('email_templates');
      if (req.method === 'GET') { const s = await col.orderBy('keyword', 'asc').get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; delete d.id; const r = await col.add({ ...d, createdAt: now(), updatedAt: now() }); return created(res, { id: r.id, ...d }); }
      if (req.method === 'PUT') { const { id, ...u } = req.body; if (!id) return fail(res, 400, 'Missing id'); delete u.createdAt; await col.doc(id).set({ ...u, updatedAt: now() }, { merge: true }); return ok(res, { id, ...u }); }
    }

    // --- OUTREACH ---
    if (p === '/outreach') {
      if (req.method === 'GET') {
        const s = await db.collection('outreach_messages').orderBy('createdAt', 'desc').limit(100).get();
        const msgs = s.docs.map(d => ({ id: d.id, ...d.data() }));
        return ok(res, { messages: msgs, queueSize: msgs.filter(m => m.status === 'queued').length, sent: msgs.filter(m => m.status === 'sent').length, failed: msgs.filter(m => m.status === 'failed').length, deferred: msgs.filter(m => m.status === 'deferred').length, replies: msgs.filter(m => m.status === 'replied').length, bounces: msgs.filter(m => m.status === 'bounced').length });
      }
    }

    // --- REPLIES ---
    if (p === '/replies') {
      if (req.method === 'GET') { const s = await db.collection('replies').orderBy('receivedAt', 'desc').limit(100).get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; delete d.id; const r = await db.collection('replies').add({ ...d, createdAt: now() }); return created(res, { id: r.id, ...d }); }
    }

    // --- AUTOMATION ---
    if (p === '/automation') {
      const runs = db.collection('keyword_runs');
      if (req.method === 'GET') {
        const s = await runs.where('status', '==', 'running').limit(1).get();
        if (s.empty) return ok(res, { running: false, run: null });
        return ok(res, { running: true, run: { id: s.docs[0].id, ...s.docs[0].data() } });
      }
      if (req.method === 'POST') {
        const { action, keywordId, keyword } = req.body;
        if (action === 'start') {
          const ex = await runs.where('status', '==', 'running').limit(1).get();
          if (!ex.empty) return fail(res, 409, 'Job already running');
          const ss = await db.collection('settings').doc('main').get();
          const sd = ss.data() || {};
          const t = (sd.automation || {}).expectedEndTime || '18:00';
          const parts = t.split(':');
          const exp = new Date(); exp.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
          const r = await runs.add({ keywordId, keyword, status: 'running', phase: 'discovery', startedAt: now(), expectedEnd: exp.toISOString(), actualEnd: null, leadsDiscovered: 0, qualified: 0, duplicates: 0, rejected: 0, emailsSent: 0, replies: 0, exceededExpected: false, searchQueriesUsed: [], checkpoint: {}, createdAt: now() });
          if (keywordId) await db.collection('keywords').doc(keywordId).set({ status: 'running' }, { merge: true });
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

    // --- AUTOMATION ANALYTICS ---
    if (p === '/automation/analytics') {
      if (req.method === 'GET') {
        const s = await db.collection('keyword_runs').get();
        const runs = s.docs.map(d => d.data());
        const completed = runs.filter(r => r.status === 'completed' || r.status === 'partial');
        const failed = runs.filter(r => r.status === 'failed');
        const overruns = runs.filter(r => r.exceededExpected);
        const totalMinutes = completed.reduce((sum, r) => {
          if (r.startedAt && r.actualEnd) {
            return sum + (new Date(r.actualEnd).getTime() - new Date(r.startedAt).getTime()) / 60000;
          }
          return sum;
        }, 0);
        return ok(res, { totalRuns: runs.length, avgRuntimeMinutes: completed.length ? Math.round(totalMinutes / completed.length) : 0, successRate: runs.length ? Math.round((completed.length / runs.length) * 100) : 0, failedJobs: failed.length, overruns: overruns.length });
      }
    }

    // --- SEND ACCOUNTS ---
    if (p === '/send_accounts') {
      if (req.method === 'GET') {
        const s = await db.collection('sending_accounts').orderBy('priority', 'asc').get();
        return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }

    // --- ACTIVITY LOGS ---
    if (p === '/logs') {
      const col = db.collection('activity_logs');
      if (req.method === 'GET') { const s = await col.orderBy('timestamp', 'desc').limit(50).get(); return ok(res, s.docs.map(d => ({ id: d.id, ...d.data() }))); }
      if (req.method === 'POST') { const d = { ...req.body }; delete d.id; const r = await col.add({ ...d, timestamp: d.timestamp || now() }); return created(res, { id: r.id }); }
    }

    // --- TELEGRAM ---
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

    // --- PLAY STORE SEARCH (using google-play-scraper) ---
    if (p === '/playstore/search') {
      if (req.method === 'GET') {
        const keyword = q('q');
        const lang = q('lang') || 'en';
        const country = q('country') || 'us';
        const maxResults = parseInt(q('limit') || '50');
        if (!keyword) return fail(res, 400, 'Missing search keyword (q)');

        try {
          const gplay = require('google-play-scraper');
          const searchResults = await gplay.search({
            term: keyword,
            lang: lang,
            country: country,
            num: Math.min(maxResults, 100),
          });

          const apps = [];
          const seenIds = new Set();

          for (const item of searchResults) {
            const appId = item.appId;
            if (!appId || seenIds.has(appId)) continue;
            seenIds.add(appId);

            try {
              const details = await gplay.app({ appId: appId, lang: 'en', country: 'us' });

              const hist = details.histogram || [0, 0, 0, 0, 0];
              const totalReviews = hist.reduce((a: number, b: number) => a + b, 0);
              const score = totalReviews > 0
                ? Math.round(((1 * hist[0] + 2 * hist[1] + 3 * hist[2] + 4 * hist[3] + 5 * hist[4]) / totalReviews) * 10) / 10
                : null;

              const email = details.developerEmail || '';

              apps.push({
                id: appId,
                packageName: appId,
                appName: details.title || item.title || '',
                developer: details.developer || item.developer || '',
                developerEmail: email,
                rating: score,
                reviews: totalReviews,
                installs: details.minInstalls || 0,
                maxInstalls: details.maxInstalls || 0,
                category: details.genre || '',
                country: details.developerCountry || country,
                website: details.developerWebsite || '',
                description: (details.description || '').substring(0, 300),
                icon: details.icon || '',
                url: `https://play.google.com/store/apps/details?id=${appId}`,
                source: 'google_play_api',
                keyword,
              });

              await new Promise(r => setTimeout(r, 250));
            } catch (detailErr) {
              apps.push({
                id: appId,
                packageName: appId,
                appName: item.title || '',
                developer: item.developer || '',
                developerEmail: '',
                rating: item.score || null,
                reviews: item.reviews || 0,
                installs: item.installs || 0,
                maxInstalls: item.maxInstalls || 0,
                category: item.genre || '',
                country: country,
                website: '',
                description: (item.summary || '').substring(0, 300),
                icon: item.icon || '',
                url: `https://play.google.com/store/apps/details?id=${appId}`,
                source: 'google_play_search',
                keyword,
              });
            }
          }

          return ok(res, { apps, keyword, country, total: apps.length });
        } catch (err) {
          return fail(res, 500, 'Play Store search failed: ' + (err as Error).message);
        }
      }
    }

    // --- PLAY STORE APP DETAILS ---
    if (p === '/playstore/app') {
      if (req.method === 'GET') {
        const appId = q('id');
        const lang = q('lang') || 'en';
        const country = q('country') || 'us';
        if (!appId) return fail(res, 400, 'Missing app id');

        try {
          const gplay = require('google-play-scraper');
          const details = await gplay.app({ appId: appId, lang: lang, country: country });

          const hist = details.histogram || [0, 0, 0, 0, 0];
          const totalReviews = hist.reduce((a: number, b: number) => a + b, 0);
          const score = totalReviews > 0
            ? Math.round(((1 * hist[0] + 2 * hist[1] + 3 * hist[2] + 4 * hist[3] + 5 * hist[4]) / totalReviews) * 10) / 10
            : null;

          return ok(res, {
            packageName: details.appId || appId,
            appName: details.title || '',
            developer: details.developer || '',
            developerEmail: details.developerEmail || '',
            rating: score,
            reviews: totalReviews,
            installs: details.minInstalls || 0,
            maxInstalls: details.maxInstalls || 0,
            category: details.genre || '',
            country: details.developerCountry || country,
            website: details.developerWebsite || '',
            description: (details.description || '').substring(0, 500),
            icon: details.icon || '',
            url: `https://play.google.com/store/apps/details?id=${appId}`,
          });
        } catch (err) {
          return fail(res, 500, 'App details fetch failed: ' + (err as Error).message);
        }
      }
    }

    // --- INTEGRATIONS ---
    if (p === '/integrations') {
      const ref = db.collection('settings').doc('main');
      if (req.method === 'GET') { const s = await ref.get(); const d = s.exists ? s.data() : {}; return ok(res, { integrations: (d && d.integrations) || {} }); }
      if (req.method === 'PUT') { const { integrations } = req.body; await ref.set({ integrations, updatedAt: now() }, { merge: true }); return ok(res, { integrations }); }
    }

    // --- RESET DATABASE ---
    if (p === '/reset') {
      if (req.method === 'POST') {
        const collections = ['keywords', 'leads', 'email_templates', 'outreach_messages', 'replies', 'keyword_runs', 'activity_logs', 'sending_accounts', 'notifications', 'search_queries'];
        for (const colName of collections) {
          const snap = await db.collection(colName).get();
          const batch = db.batch();
          snap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
        await db.collection('settings').doc('main').delete().catch(() => {});
        return ok(res, { reset: true, message: 'All data cleared. Run seed script to repopulate.' });
      }
    }

    return fail(res, 404, 'Not found: ' + p);
  } catch (e) {
    return fail(res, 500, e.message || 'Internal error');
  }
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

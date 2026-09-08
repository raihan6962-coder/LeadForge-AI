import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, query, orderBy, limit as fsLimit, where } from 'firebase/firestore';

function toArr(snap: any) { return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })); }

export async function fetchSettings() {
  const snap = await getDoc(doc(db, 'settings', 'main'));
  return snap.exists() ? snap.data() : {};
}

export async function fetchKeywords() {
  const snap = await getDocs(query(collection(db, 'keywords'), orderBy('day', 'asc')));
  return toArr(snap);
}

export async function fetchLeads() {
  const snap = await getDocs(query(collection(db, 'leads'), orderBy('createdAt', 'desc'), fsLimit(200)));
  return toArr(snap);
}

export async function fetchTemplates() {
  const snap = await getDocs(query(collection(db, 'email_templates'), orderBy('keyword', 'asc')));
  return toArr(snap);
}

export async function fetchOutreach() {
  const snap = await getDocs(query(collection(db, 'outreach_messages'), orderBy('createdAt', 'desc'), fsLimit(100)));
  const msgs = toArr(snap);
  return {
    messages: msgs,
    queueSize: msgs.filter((m: any) => m.status === 'queued').length,
    sent: msgs.filter((m: any) => m.status === 'sent').length,
    failed: msgs.filter((m: any) => m.status === 'failed').length,
    deferred: msgs.filter((m: any) => m.status === 'deferred').length,
    replies: msgs.filter((m: any) => m.status === 'replied').length,
    bounces: msgs.filter((m: any) => m.status === 'bounced').length,
  };
}

export async function fetchReplies() {
  const snap = await getDocs(query(collection(db, 'replies'), orderBy('receivedAt', 'desc'), fsLimit(100)));
  return toArr(snap);
}

export async function fetchKeywordRuns() {
  const snap = await getDocs(query(collection(db, 'keyword_runs'), orderBy('startedAt', 'desc'), fsLimit(50)));
  return toArr(snap);
}

export async function fetchAutomation() {
  const snap = await getDocs(query(collection(db, 'keyword_runs'), where('status', '==', 'running'), fsLimit(1)));
  if (snap.empty) return { running: false, run: null };
  const doc = snap.docs[0];
  return { running: true, run: { id: doc.id, ...doc.data() } };
}

export async function fetchLogs() {
  const snap = await getDocs(query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), fsLimit(50)));
  return toArr(snap);
}

export async function fetchSendAccounts() {
  const snap = await getDocs(query(collection(db, 'sending_accounts'), orderBy('priority', 'asc')));
  return toArr(snap);
}

export async function fetchAnalytics() {
  const [leadsSnap, repliesSnap, runsSnap] = await Promise.all([
    getDocs(collection(db, 'leads')),
    getDocs(collection(db, 'replies')),
    getDocs(collection(db, 'keyword_runs')),
  ]);
  const leads = toArr(leadsSnap);
  const replies = toArr(repliesSnap);
  const runs = toArr(runsSnap);
  return {
    totalDiscovered: leads.length,
    qualified: leads.filter((l: any) => l.qualificationStatus === 'qualified').length,
    rejected: leads.filter((l: any) => l.qualificationStatus === 'rejected').length,
    duplicates: leads.filter((l: any) => l.qualificationStatus === 'duplicate').length,
    qualificationRate: leads.length ? Math.round((leads.filter((l: any) => l.qualificationStatus === 'qualified').length / leads.length) * 100) : 0,
    emailsQueued: leads.filter((l: any) => l.outreachStatus === 'queued').length,
    emailsSent: leads.filter((l: any) => l.outreachStatus === 'sent').length,
    failed: leads.filter((l: any) => l.outreachStatus === 'failed').length,
    deferred: leads.filter((l: any) => l.outreachStatus === 'deferred').length,
    replyRate: leads.length ? Math.round((replies.length / leads.length) * 100) : 0,
    leadDiscoveryChart: [] as any[],
    qualifiedLeadsChart: [] as any[],
    emailsSentChart: [] as any[],
    repliesChart: [] as any[],
    qualificationDonut: [
      { label: 'Qualified', value: leads.filter((l: any) => l.qualificationStatus === 'qualified').length, color: '#10b981' },
      { label: 'Rejected', value: leads.filter((l: any) => l.qualificationStatus === 'rejected').length, color: '#ef4444' },
    ],
    replyClassification: [
      { label: 'Human', value: replies.filter((r: any) => r.classification === 'human').length, color: '#10b981' },
      { label: 'Automated', value: replies.filter((r: any) => r.classification === 'automated').length, color: '#06b6d4' },
      { label: 'Bounce', value: replies.filter((r: any) => r.classification === 'bounce').length, color: '#ef4444' },
      { label: 'Other', value: replies.filter((r: any) => !['human', 'automated', 'bounce'].includes(r.classification)).length, color: '#6b7280' },
    ],
    keywordAnalytics: [] as any[],
    senderAnalytics: [] as any[],
    heatmap: [] as any[],
    summary: {
      totalDiscovered: leads.length,
      qualified: leads.filter((l: any) => l.qualificationStatus === 'qualified').length,
      rejected: leads.filter((l: any) => l.qualificationStatus === 'rejected').length,
      emailsSent: leads.filter((l: any) => l.outreachStatus === 'sent').length,
      humanReplies: replies.filter((r: any) => r.classification === 'human').length,
      totalReplies: replies.length,
      totalRuns: runs.length,
      successfulRuns: runs.filter((r: any) => r.status === 'completed').length,
      failedRuns: runs.filter((r: any) => r.status === 'failed').length,
    },
  };
}

export async function fetchAutomationAnalytics() {
  const snap = await getDocs(collection(db, 'keyword_runs'));
  const runs = toArr(snap);
  const completed = runs.filter((r: any) => r.status === 'completed' || r.status === 'partial');
  const failed = runs.filter((r: any) => r.status === 'failed');
  const overruns = runs.filter((r: any) => r.exceededExpected);
  const totalMinutes = completed.reduce((sum: number, r: any) => {
    if (r.startedAt && r.actualEnd) return sum + (new Date(r.actualEnd).getTime() - new Date(r.startedAt).getTime()) / 60000;
    return sum;
  }, 0);
  return {
    totalRuns: runs.length,
    avgRuntimeMinutes: completed.length ? Math.round(totalMinutes / completed.length) : 0,
    successRate: runs.length ? Math.round((completed.length / runs.length) * 100) : 0,
    failedJobs: failed.length,
    overruns: overruns.length,
  };
}

export async function fetchIntegrations() {
  const data = await fetchSettings();
  return { integrations: (data as any).integrations || {} };
}

export async function fetchSystem() {
  const mem = typeof performance !== 'undefined' ? Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0) : 0;
  return { version: '2.5.0', uptime: '—', memoryUsage: mem ? `${mem} MB` : '—', cpuUsage: '—' };
}

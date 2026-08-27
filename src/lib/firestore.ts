import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fbLimit, startAfter,
  onSnapshot, writeBatch, serverTimestamp,
  Timestamp, type DocumentData, type Query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Keyword, Lead, EmailTemplate, Reply,
  ActivityLog, AppNotification, Settings, KeywordRun,
  OutreachMessage, SendingAccount,
  AnalyticsDaily, IntegrationLog, MonthlyCycle,
} from '@/types';

function fromDoc<T>(snap: DocumentData & { exists(): boolean; id: string; data(): DocumentData }): T | null {
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, ...data } as T;
}

function fromDocs<T>(docs: (DocumentData & { id: string; data(): DocumentData })[]): T[] {
  return docs.map(d => ({ id: d.id, ...d.data() } as T));
}

// ─── Settings ───────────────────────────────────────────────────────
export const settingsService = {
  async get(): Promise<Settings | null> {
    const snap = await getDoc(doc(db, 'settings', 'main'));
    return fromDoc<Settings>(snap as Parameters<typeof fromDoc>[0]);
  },
  async updata(data: Partial<Settings>): Promise<void> {
    await updateDoc(doc(db, 'settings', 'main'), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
  async create(data: Settings): Promise<void> {
    await setDoc(doc(db, 'settings', 'main'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
};

// ─── Keywords ───────────────────────────────────────────────────────
export const keywordsService = {
  async list(): Promise<Keyword[]> {
    const q = query(collection(db, 'keywords'), orderBy('day', 'asc'));
    const snap = await getDocs(q);
    return fromDocs<Keyword>(snap.docs);
  },
  async get(id: string): Promise<Keyword | null> {
    const snap = await getDoc(doc(db, 'keywords', id));
    return fromDoc<Keyword>(snap as Parameters<typeof fromDoc>[0]);
  },
  async create(kw: Omit<Keyword, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'keywords'));
    await setDoc(ref, { ...kw, createdAt: serverTimestamp() });
    return ref.id;
  },
  async update(id: string, data: Partial<Keyword>): Promise<void> {
    await updateDoc(doc(db, 'keywords', id), { ...data, updatedAt: serverTimestamp() });
  },
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'keywords', id));
  },
  async getActive(): Promise<Keyword | null> {
    const q = query(collection(db, 'keywords'), where('status', '==', 'running'), fbLimit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : fromDocs<Keyword>(snap.docs)[0];
  },
  async getScheduled(): Promise<Keyword[]> {
    const q = query(collection(db, 'keywords'), where('status', '==', 'scheduled'), orderBy('day', 'asc'), fbLimit(1));
    const snap = await getDocs(q);
    return fromDocs<Keyword>(snap.docs);
  },
};

// ─── Keyword Runs ───────────────────────────────────────────────────
export const keywordRunsService = {
  async create(run: Omit<KeywordRun, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'keyword_runs'));
    await setDoc(ref, { ...run, createdAt: serverTimestamp() });
    return ref.id;
  },
  async update(id: string, data: Partial<KeywordRun>): Promise<void> {
    await updateDoc(doc(db, 'keyword_runs', id), data);
  },
  async getRunning(): Promise<KeywordRun | null> {
    const q = query(collection(db, 'keyword_runs'), where('status', '==', 'running'), fbLimit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : fromDocs<KeywordRun>(snap.docs)[0];
  },
  async list(limitCount = 20): Promise<KeywordRun[]> {
    const q = query(collection(db, 'keyword_runs'), orderBy('createdAt', 'desc'), fbLimit(limitCount));
    const snap = await getDocs(q);
    return fromDocs<KeywordRun>(snap.docs);
  },
};

// ─── Leads ──────────────────────────────────────────────────────────
export const leadsService = {
  async list(opts: { keywordId?: string; status?: string; pageSize?: number; lastDocId?: string } = {}): Promise<{ leads: Lead[]; lastDocId: string | null }> {
    const constraints: ReturnType<typeof where>[] = [];
    if (opts.keywordId) constraints.push(where('keywordId', '==', opts.keywordId));
    if (opts.status) constraints.push(where('qualificationStatus', '==', opts.status));

    const q = query(
      collection(db, 'leads'),
      ...constraints,
      orderBy('createdAt', 'desc'),
      fbLimit(opts.pageSize || 50)
    );
    const snap = await getDocs(q);
    const leads = fromDocs<Lead>(snap.docs);
    const lastDoc = snap.docs[snap.docs.length - 1];
    return { leads, lastDocId: lastDoc?.id || null };
  },
  async get(id: string): Promise<Lead | null> {
    const snap = await getDoc(doc(db, 'leads', id));
    return fromDoc<Lead>(snap as Parameters<typeof fromDoc>[0]);
  },
  async upsert(data: Lead): Promise<string> {
    const normalizedEmail = data.email?.toLowerCase().trim();
    const dedupeKey = normalizedEmail || `${data.developer?.toLowerCase()}:${data.appName?.toLowerCase()}`;

    const existing = await getDocs(
      query(collection(db, 'leads'), where('dedupeKey', '==', dedupeKey), fbLimit(1))
    );

    if (!existing.empty) {
      const existingId = existing.docs[0].id;
      await updateDoc(doc(db, 'leads', existingId), {
        lastSeenAt: serverTimestamp(),
        occurrenceCount: (existing.docs[0].data().occurrenceCount || 0) + 1,
      });
      return existingId;
    }

    const ref = doc(collection(db, 'leads'));
    await setDoc(ref, {
      ...data,
      dedupeKey,
      occurrenceCount: 1,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    });
    return ref.id;
  },
  async update(id: string, data: Partial<Lead>): Promise<void> {
    await updateDoc(doc(db, 'leads', id), data);
  },
  async countByKeyword(keywordId: string): Promise<{ total: number; qualified: number; rejected: number; duplicates: number }> {
    const q = query(collection(db, 'leads'), where('keywordId', '==', keywordId));
    const all = await getDocs(q);
    let qualified = 0, rejected = 0, duplicates = 0;
    all.docs.forEach(d => {
      const ld = d.data();
      if (ld.qualificationStatus === 'qualified') qualified++;
      else if (ld.qualificationStatus === 'rejected') rejected++;
      if (ld.occurrenceCount > 1) duplicates++;
    });
    return { total: all.size, qualified, rejected, duplicates };
  },
};

// ─── Email Templates ────────────────────────────────────────────────
export const templatesService = {
  async list(): Promise<EmailTemplate[]> {
    const q = query(collection(db, 'email_templates'), orderBy('keyword', 'asc'));
    const snap = await getDocs(q);
    return fromDocs<EmailTemplate>(snap.docs);
  },
  async get(id: string): Promise<EmailTemplate | null> {
    const snap = await getDoc(doc(db, 'email_templates', id));
    return fromDoc<EmailTemplate>(snap as Parameters<typeof fromDoc>[0]);
  },
  async getByKeyword(keyword: string): Promise<EmailTemplate | null> {
    const q = query(collection(db, 'email_templates'), where('keyword', '==', keyword), fbLimit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : fromDocs<EmailTemplate>(snap.docs)[0];
  },
  async upsert(data: EmailTemplate): Promise<string> {
    const existing = await this.getByKeyword(data.keyword);
    if (existing) {
      await updateDoc(doc(db, 'email_templates', existing.id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return existing.id;
    }
    const ref = doc(collection(db, 'email_templates'));
    await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return ref.id;
  },
};

// ─── Outreach Messages ──────────────────────────────────────────────
export const outreachService = {
  async createMessage(data: Omit<OutreachMessage, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'outreach_messages'));
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    return ref.id;
  },
  async updateMessage(id: string, data: Partial<OutreachMessage>): Promise<void> {
    await updateDoc(doc(db, 'outreach_messages', id), data);
  },
  async getPendingMessages(accountId: string, max: number): Promise<OutreachMessage[]> {
    const q = query(
      collection(db, 'outreach_messages'),
      where('sendingAccountId', '==', accountId),
      where('status', '==', 'queued'),
      orderBy('createdAt', 'asc'),
      fbLimit(max)
    );
    const snap = await getDocs(q);
    return fromDocs<OutreachMessage>(snap.docs);
  },
};

// ─── Sending Accounts ───────────────────────────────────────────────
export const sendingAccountsService = {
  async list(): Promise<SendingAccount[]> {
    const q = query(collection(db, 'sending_accounts'), orderBy('priority', 'asc'));
    const snap = await getDocs(q);
    return fromDocs<SendingAccount>(snap.docs);
  },
  async getHealthy(): Promise<SendingAccount[]> {
    const q = query(collection(db, 'sending_accounts'), where('status', '==', 'healthy'), orderBy('priority', 'asc'));
    const snap = await getDocs(q);
    return fromDocs<SendingAccount>(snap.docs);
  },
  async update(id: string, data: Partial<SendingAccount>): Promise<void> {
    await updateDoc(doc(db, 'sending_accounts', id), data);
  },
};

// ─── Replies ────────────────────────────────────────────────────────
export const repliesService = {
  async list(status?: string): Promise<Reply[]> {
    let q: Query<DocumentData>;
    if (status) {
      q = query(collection(db, 'replies'), where('status', '==', status), orderBy('receivedAt', 'desc'), fbLimit(100));
    } else {
      q = query(collection(db, 'replies'), orderBy('receivedAt', 'desc'), fbLimit(100));
    }
    const snap = await getDocs(q);
    return fromDocs<Reply>(snap.docs);
  },
  async create(data: Omit<Reply, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'replies'));
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    return ref.id;
  },
  async update(id: string, data: Partial<Reply>): Promise<void> {
    await updateDoc(doc(db, 'replies', id), data);
  },
};

// ─── Notifications ──────────────────────────────────────────────────
export const notificationsService = {
  async list(): Promise<AppNotification[]> {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), fbLimit(50));
    const snap = await getDocs(q);
    return fromDocs<AppNotification>(snap.docs);
  },
  async create(data: Omit<AppNotification, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'notifications'));
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    return ref.id;
  },
  async acknowledge(id: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', id), { acknowledged: true });
  },
};

// ─── Activity Logs ──────────────────────────────────────────────────
export const logsService = {
  async list(pageSize = 50, lastDocId?: string): Promise<{ logs: ActivityLog[]; lastDocId: string | null }> {
    let q: Query<DocumentData>;
    if (lastDocId) {
      const lastSnap = await getDoc(doc(db, 'activity_logs', lastDocId));
      q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), startAfter(lastSnap), fbLimit(pageSize));
    } else {
      q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), fbLimit(pageSize));
    }
    const snap = await getDocs(q);
    return { logs: fromDocs<ActivityLog>(snap.docs), lastDocId: snap.docs[snap.docs.length - 1]?.id || null };
  },
  async create(data: Omit<ActivityLog, 'id'>): Promise<void> {
    const ref = doc(collection(db, 'activity_logs'));
    await setDoc(ref, { ...data, timestamp: serverTimestamp() });
  },
};

// ─── Analytics ──────────────────────────────────────────────────────
export const analyticsService = {
  async getDaily(date: string): Promise<AnalyticsDaily | null> {
    const snap = await getDoc(doc(db, 'analytics_daily', date));
    return fromDoc<AnalyticsDaily>(snap as Parameters<typeof fromDoc>[0]);
  },
  async upsertDaily(date: string, data: Partial<AnalyticsDaily>): Promise<void> {
    await setDoc(doc(db, 'analytics_daily', date), data, { merge: true });
  },
};

// ─── Integration Logs ───────────────────────────────────────────────
export const integrationLogsService = {
  async create(data: Omit<IntegrationLog, 'id'>): Promise<void> {
    const ref = doc(collection(db, 'integration_logs'));
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  },
};

// ─── Monthly Cycles ────────────────────────────────────────────────
export const cyclesService = {
  async getCurrent(): Promise<MonthlyCycle | null> {
    const q = query(collection(db, 'monthly_cycles'), where('status', '==', 'active'), fbLimit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : fromDocs<MonthlyCycle>(snap.docs)[0];
  },
  async create(data: Omit<MonthlyCycle, 'id'>): Promise<string> {
    const ref = doc(collection(db, 'monthly_cycles'));
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    return ref.id;
  },
  async update(id: string, data: Partial<MonthlyCycle>): Promise<void> {
    await updateDoc(doc(db, 'monthly_cycles', id), data);
  },
};

// ─── Real-time Subscriptions ────────────────────────────────────────
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void,
  constraints?: ReturnType<typeof where>[]
) {
  let q: Query<DocumentData>;
  if (constraints && constraints.length > 0) {
    q = query(collection(db, collectionName), ...constraints);
  } else {
    q = query(collection(db, collectionName));
  }
  return onSnapshot(q, snap => callback(fromDocs<T>(snap.docs)));
}

// ─── Batch Operations ──────────────────────────────────────────────
export async function batchWrite(operations: { type: 'set' | 'update' | 'delete'; ref: string; data?: unknown }[]): Promise<void> {
  const batch = writeBatch(db);
  operations.forEach(op => {
    const ref = doc(db, op.ref);
    if (op.type === 'set') batch.set(ref, op.data as object);
    else if (op.type === 'update') batch.update(ref, op.data as object);
    else batch.delete(ref);
  });
  await batch.commit();
}

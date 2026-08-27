export type SystemStatus = 'online' | 'idle' | 'running' | 'paused' | 'warning' | 'error' | 'offline';
export type JobStatus = 'pending' | 'running' | 'completed' | 'partial' | 'failed' | 'disabled' | 'scheduled' | 'overdue' | 'cancelled' | 'paused';
export type KeywordStatus = 'draft' | 'scheduled' | 'pending' | 'running' | 'completed' | 'partial' | 'exhausted' | 'failed' | 'disabled';
export type LeadQualificationStatus = 'qualified' | 'rejected' | 'pending';
export type OutreachStatus = 'none' | 'queued' | 'personalized' | 'ready' | 'sending' | 'sent' | 'failed' | 'deferred';
export type ReplyStatus = 'none' | 'human' | 'automated' | 'out_of_office' | 'bounce' | 'unclear';
export type ReplyClassification = 'human' | 'automated' | 'out_of_office' | 'bounce' | 'unclear';
export type EmailValidity = 'valid' | 'invalid' | 'unknown' | 'risky';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'warning' | 'syncing';
export type SenderHealth = 'healthy' | 'warning' | 'error' | 'offline';
export type LogLevel = 'info' | 'success' | 'warning' | 'error';
export type NotificationType = 'success' | 'info' | 'warning' | 'error';
export type AutomationPhase = 'discovery' | 'qualification' | 'deduplication' | 'enrichment' | 'ready' | 'outreach' | 'reply_monitoring';
export type MessageStatus = 'draft' | 'personalized' | 'queued' | 'sending' | 'sent' | 'failed' | 'bounced';
export type CycleStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type DiscoveryProviderType = 'google_play' | 'app_store' | 'custom';

export interface CurrentJob {
  keyword: string;
  phase: AutomationPhase;
  status: JobStatus;
  progress: { current: number; target: number };
  qualified: number;
  duplicates: number;
  rejected: number;
  elapsedSeconds: number;
  expectedCompletion: string;
  startedAt: string;
}

export interface Keyword {
  id: string;
  keyword: string;
  day: number;
  date: string;
  status: KeywordStatus;
  targetLeads: number;
  qualifiedLeads: number;
  emailsSent: number;
  replies: number;
  completion: number;
  templateId: string | null;
  enabled: boolean;
  relatedQueries: string[];
}

export interface Lead {
  id: string;
  appName: string;
  developer: string;
  keyword: string;
  searchQuery: string;
  rating: number;
  installCount: number;
  category: string;
  country: string;
  website: string | null;
  email: string | null;
  emailValidity: EmailValidity;
  leadScore: number;
  qualificationStatus: LeadQualificationStatus;
  outreachStatus: OutreachStatus;
  replyStatus: ReplyStatus;
  createdAt: string;
  lastActivity: string;
  notes: string[];
  tags: string[];
}

export interface SearchExpansion {
  primaryQuery: string;
  relatedQueries: RelatedQuery[];
}

export interface RelatedQuery {
  query: string;
  leadsDiscovered: number;
  qualified: number;
  rejected: number;
  duplicates: number;
  status: 'completed' | 'running' | 'pending' | 'exhausted';
}

export interface AutomationRun {
  id: string;
  keyword: string;
  status: JobStatus;
  startedAt: string;
  expectedEnd: string;
  actualEnd: string | null;
  leadsDiscovered: number;
  qualified: number;
  duplicates: number;
  emailsSent: number;
  replies: number;
  exceededExpected: boolean;
}

export interface EmailTemplate {
  id: string;
  keyword: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  lastUpdated: string;
  status: 'active' | 'disabled' | 'draft';
}

export interface Reply {
  id: string;
  sender: string;
  email: string;
  subject: string;
  relatedApp: string;
  keyword: string;
  originalOutreach: string;
  receivedAt: string;
  classification: ReplyClassification;
  status: 'new' | 'read' | 'archived' | 'forwarded';
  forwarded: boolean;
  body: string;
}

export interface SenderAccount {
  id: string;
  name: string;
  webAppUrl: string;
  status: SenderHealth;
  dailyCapacity: number;
  sentToday: number;
  lastSuccessfulSend: string;
  lastError: string | null;
  priority: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  event: string;
  source: string;
  status: LogLevel;
  details: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  important: boolean;
}

export interface KPIData {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color?: string;
}

export interface DeduplicationStats {
  totalDiscovered: number;
  newLeads: number;
  existingLeads: number;
  duplicatePercentage: number;
  uniqueQualified: number;
}

export interface DuplicateRecord {
  id: string;
  appName: string;
  developer: string;
  email: string;
  matchedBy: 'email' | 'developer_app' | 'domain';
  originalLeadId: string;
  discoveredAt: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  status: IntegrationStatus;
  lastSync: string;
  lastSuccessfulFetch: string;
  rowsImported: number;
  errors: number;
  autoSync: boolean;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  personalizationEnabled: boolean;
}

export interface AIUsage {
  requests: number;
  successful: number;
  failed: number;
  avgLatencyMs: number;
  estimatedCost: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifications: {
    automationStarted: boolean;
    automationCompleted: boolean;
    expectedEndExceeded: boolean;
    automationFailed: boolean;
    leadTargetReached: boolean;
    replyReceived: boolean;
    integrationError: boolean;
    dailySummary: boolean;
  };
}

export interface ForwardingConfig {
  email: string;
  enabled: boolean;
  lastForwarded: string | null;
  errors: number;
}

export interface QualificationCriteria {
  minRating: number;
  maxRating: number;
  minInstalls: number;
  maxInstalls: number;
  minAppAge: number;
  maxAppAge: number;
  allowedCountries: string[];
  allowedCategories: string[];
  requiredContactInfo: boolean;
  requiredWebsite: boolean;
  requiredCompanyInfo: boolean;
  excludedCountries: string[];
  excludedCategories: string[];
  excludedKeywords: string[];
  targetQualifiedCount: number;
  maxDiscoveryAttempts: number;
  searchExpansionDepth: number;
}

export interface OutreachStats {
  queueSize: number;
  sent: number;
  pending: number;
  failed: number;
  deferred: number;
  replies: number;
  bounces: number;
  sendingIntervalMin: number;
  sendingIntervalMax: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface KeywordAnalytics {
  keyword: string;
  leads: number;
  qualified: number;
  qualificationRate: number;
  outreach: number;
  replies: number;
}

export interface SenderAnalytics {
  name: string;
  sent: number;
  failed: number;
  failureRate: number;
  remainingCapacity: number;
}

export interface AutomationAnalytics {
  totalRuns: number;
  avgRuntimeMinutes: number;
  successRate: number;
  failedJobs: number;
  overruns: number;
}

// ─── Database Entity Types ──────────────────────────────────────────

export interface Settings {
  id: string;
  systemName: string;
  adminEmail: string;
  timezone: string;
  dateFormat: string;
  dailyStartTime: string;
  expectedEndTime: string;
  monthlyKeywordCount: number;
  targetQualifiedLeads: number;
  maxDiscoveryAttempts: number;
  searchExpansionDepth: number;
  continueOnExpectedEnd: boolean;
  qualification: QualificationCriteria;
  ai: AIConfig;
  googleSheets: GoogleSheetsConfig;
  telegram: TelegramConfig;
  forwarding: ForwardingConfig;
  email: {
    minInterval: number;
    maxInterval: number;
    maxDailySendsPerAccount: number;
  };
  security: {
    sessionTimeout: number;
    requireReauthForSensitive: boolean;
    logConfigChanges: boolean;
  };
  data: {
    retentionDays: number;
    maxLeads: number;
    autoArchive: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface KeywordRun {
  id: string;
  keywordId: string;
  keyword: string;
  status: JobStatus;
  phase: AutomationPhase;
  startedAt: string;
  expectedEnd: string;
  actualEnd: string | null;
  leadsDiscovered: number;
  qualified: number;
  duplicates: number;
  rejected: number;
  emailsSent: number;
  replies: number;
  exceededExpected: boolean;
  searchQueriesUsed: string[];
  checkpoint: Record<string, unknown>;
  createdAt?: string;
}

export interface SearchQuery {
  id: string;
  keywordId: string;
  query: string;
  type: 'primary' | 'expansion';
  status: string;
  resultsCount: number;
  qualifiedCount: number;
  createdAt?: string;
}

export interface OutreachJob {
  id: string;
  keywordId: string;
  keyword: string;
  status: JobStatus;
  totalLeads: number;
  processedLeads: number;
  emailsSent: number;
  emailsFailed: number;
  startedAt: string;
  completedAt: string | null;
  createdAt?: string;
}

export interface OutreachMessage {
  id: string;
  outreachJobId: string;
  leadId: string;
  sendingAccountId: string;
  templateId: string;
  to: string;
  subject: string;
  body: string;
  status: MessageStatus;
  idempotencyKey: string;
  sentAt: string | null;
  error: string | null;
  createdAt?: string;
}

export interface SendingAccount {
  id: string;
  name: string;
  webAppUrl: string;
  status: SenderHealth;
  dailyCapacity: number;
  sentToday: number;
  lastSuccessfulSend: string;
  lastError: string | null;
  priority: number;
  cooldownUntil: string | null;
  createdAt?: string;
}

export interface TelegramEvent {
  id: string;
  type: string;
  message: string;
  chatId: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  error: string | null;
}

export interface AnalyticsDaily {
  date: string;
  discovered: number;
  qualified: number;
  rejected: number;
  duplicates: number;
  emailsGenerated: number;
  emailsSent: number;
  emailsFailed: number;
  replies: number;
  humanReplies: number;
  automatedReplies: number;
  bounceReplies: number;
  runtime: number;
  overdueRuns: number;
  failedRuns: number;
}

export interface IntegrationLog {
  id: string;
  integration: string;
  event: string;
  status: 'success' | 'error' | 'warning';
  details: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface MonthlyCycle {
  id: string;
  month: string;
  year: number;
  status: CycleStatus;
  totalKeywords: number;
  completedKeywords: number;
  totalLeads: number;
  totalQualified: number;
  totalEmails: number;
  totalReplies: number;
  createdAt?: string;
}

export interface DuplicateRecord2 {
  id: string;
  leadId: string;
  duplicateOfId: string;
  matchType: 'email' | 'developer_app' | 'domain';
  detectedAt: string;
}

export interface SuppressionList {
  id: string;
  email: string;
  reason: string;
  addedAt: string;
  source: string;
}

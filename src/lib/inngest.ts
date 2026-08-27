import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'leadforge-ai',
  name: 'LeadForge AI',
  retries: 3,
});

export interface AutomationEvents {
  'automation/start': {
    data: { keywordId: string; keyword: string };
  };
  'automation/stop': {
    data: { keywordId: string };
  };
  'keyword/schedule-check': {
    data: Record<string, never>;
  };
  'lead/discover': {
    data: { keywordId: string; query: string; searchQueryId: string };
  };
  'lead/qualify': {
    data: { leadId: string };
  };
  'outreach/send-batch': {
    data: { outreachJobId: string };
  };
  'outreach/send-single': {
    data: { messageId: string; accountId: string };
  };
  'reply/check-inbox': {
    data: Record<string, never>;
  };
  'reply/classify': {
    data: { replyId: string };
  };
  'reply/forward': {
    data: { replyId: string };
  };
  'telegram/notify': {
    data: { type: string; message: string; chatId?: string };
  };
  'sheets/sync': {
    data: Record<string, never>;
  };
  'analytics/aggregate': {
    data: { date: string };
  };
  'scheduler/check-overdue': {
    data: Record<string, never>;
  };
}

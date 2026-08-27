import type { SystemStatus, JobStatus, KeywordStatus, OutreachStatus, ReplyStatus, EmailValidity, IntegrationStatus, SenderHealth, LogLevel, ReplyClassification } from '@/types';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  online: { label: 'Online', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
  idle: { label: 'Idle', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-500' },
  running: { label: 'Running', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-500 animate-pulse' },
  paused: { label: 'Paused', color: 'text-warning-400 bg-warning-500/10 border-warning-500/20', dot: 'bg-warning-500' },
  warning: { label: 'Warning', color: 'text-warning-400 bg-warning-500/10 border-warning-500/20', dot: 'bg-warning-500' },
  error: { label: 'Error', color: 'text-error-400 bg-error-500/10 border-error-500/20', dot: 'bg-error-500' },
  offline: { label: 'Offline', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  pending: { label: 'Pending', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-400' },
  scheduled: { label: 'Scheduled', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-400' },
  completed: { label: 'Completed', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
  partial: { label: 'Partial', color: 'text-warning-400 bg-warning-500/10 border-warning-500/20', dot: 'bg-warning-500' },
  exhausted: { label: 'Exhausted', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  failed: { label: 'Failed', color: 'text-error-400 bg-error-500/10 border-error-500/20', dot: 'bg-error-500' },
  disabled: { label: 'Disabled', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  draft: { label: 'Draft', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  qualified: { label: 'Qualified', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
  rejected: { label: 'Rejected', color: 'text-error-400 bg-error-500/10 border-error-500/20', dot: 'bg-error-500' },
  none: { label: 'None', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  queued: { label: 'Queued', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-400' },
  personalized: { label: 'Personalized', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-400' },
  ready: { label: 'Ready', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-400' },
  sending: { label: 'Sending', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-500 animate-pulse' },
  sent: { label: 'Sent', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
  deferred: { label: 'Deferred', color: 'text-warning-400 bg-warning-500/10 border-warning-500/20', dot: 'bg-warning-500' },
  human: { label: 'Human', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-400' },
  automated: { label: 'Automated', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  out_of_office: { label: 'Out of Office', color: 'text-warning-400 bg-warning-500/10 border-warning-500/20', dot: 'bg-warning-500' },
  bounce: { label: 'Bounce', color: 'text-error-400 bg-error-500/10 border-error-500/20', dot: 'bg-error-500' },
  unclear: { label: 'Unclear', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  valid: { label: 'Valid', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
  invalid: { label: 'Invalid', color: 'text-error-400 bg-error-500/10 border-error-500/20', dot: 'bg-error-500' },
  unknown: { label: 'Unknown', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  risky: { label: 'Risky', color: 'text-warning-400 bg-warning-500/10 border-warning-500/20', dot: 'bg-warning-500' },
  connected: { label: 'Connected', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
  disconnected: { label: 'Disconnected', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  syncing: { label: 'Syncing', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-500 animate-pulse' },
  healthy: { label: 'Healthy', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
  info: { label: 'Info', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-400' },
  success_log: { label: 'Success', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
  new: { label: 'New', color: 'text-accent-300 bg-accent-500/10 border-accent-500/20', dot: 'bg-accent-400 animate-pulse' },
  read: { label: 'Read', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  archived: { label: 'Archived', color: 'text-muted bg-white/5 border-white/10', dot: 'bg-muted' },
  forwarded: { label: 'Forwarded', color: 'text-success-400 bg-success-500/10 border-success-500/20', dot: 'bg-success-500' },
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
  customLabel?: string;
}

export function StatusBadge({ status, showDot = true, size = 'sm', customLabel }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.info;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClass}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {customLabel || config.label}
    </span>
  );
}

export type { SystemStatus, JobStatus, KeywordStatus, OutreachStatus, ReplyStatus, EmailValidity, IntegrationStatus, SenderHealth, LogLevel, ReplyClassification };

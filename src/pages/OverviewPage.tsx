import { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, Copy, Mail, Send, MessageSquare, AlertTriangle,
  Target, Clock, Zap, ArrowRight, Activity,
} from 'lucide-react';
import { Card, CardHeader, KPICard, ProgressBar } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LineChart } from '@/components/ui/Charts';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { useApi } from '@/hooks/useApi';
import type { AutomationPhase, KeywordRun } from '@/types';

const phases: { id: AutomationPhase; label: string; icon: string }[] = [
  { id: 'discovery', label: 'Discovery', icon: '🔍' },
  { id: 'qualification', label: 'Qualification', icon: '✓' },
  { id: 'deduplication', label: 'Deduplication', icon: '⊘' },
  { id: 'enrichment', label: 'Enrichment', icon: '+' },
  { id: 'ready', label: 'Ready for Outreach', icon: '→' },
  { id: 'outreach', label: 'Outreach', icon: '✉' },
  { id: 'reply_monitoring', label: 'Reply Monitoring', icon: '↩' },
];

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function OverviewPage() {
  const { navigate } = useNav();
  const { addToast } = useToast();

  const { data: apiRun } = useApi<{ running: boolean; run: KeywordRun | null }>('/api/automation', { running: false, run: null });
  const { data: analytics } = useApi<{ summary: { totalDiscovered: number; qualified: number; rejected: number; emailsSent: number; humanReplies: number; totalReplies: number; totalRuns: number; successfulRuns: number; failedRuns: number } }>('/api/analytics', { summary: { totalDiscovered: 0, qualified: 0, rejected: 0, emailsSent: 0, humanReplies: 0, totalReplies: 0, totalRuns: 0, successfulRuns: 0, failedRuns: 0 } });
  const { data: outreach } = useApi<{ queueSize: number; sent: number; failed: number }>('/api/outreach', { queueSize: 0, sent: 0, failed: 0 });
  const { data: keywordsData } = useApi<any[]>('/api/keywords', []);
  const { data: runsData } = useApi<any[]>('/api/keyword_runs', []);

  const summary = analytics?.summary || { totalDiscovered: 0, qualified: 0, rejected: 0, emailsSent: 0, humanReplies: 0, totalReplies: 0, totalRuns: 0, successfulRuns: 0, failedRuns: 0 };

  const run = apiRun?.run;
  const [elapsed, setElapsed] = useState(run ? Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000) : 0);
  const [progress, setProgress] = useState(run?.leadsDiscovered || 0);

  useEffect(() => {
    if (run) {
      setElapsed(Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000));
      setProgress(run.leadsDiscovered);
    }
  }, [run]);

  useEffect(() => {
    if (!apiRun?.running) return;
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
      setProgress(prev => Math.min(prev + Math.random() * 3, 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [apiRun?.running]);

  const keywords = keywordsData || [];
  const todayKeyword = keywords.find((k: any) => k.status === 'running') || keywords[keywords.length - 1] || { keyword: '', status: 'scheduled', qualifiedLeads: 0, targetLeads: 0, completion: 0 };
  const recentRuns = (runsData || []).slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* System Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-success-500/10 flex items-center justify-center">
              <Activity size={22} className="text-success-400" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full border-2 border-[#0f1620] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-primary">System Online</h2>
              {apiRun?.running && <StatusBadge status="running" />}
            </div>
            <p className="text-xs text-muted mt-0.5">{apiRun?.running ? `Running: ${run?.keyword}` : 'Automation engine idle'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('automation')} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-secondary hover:bg-white/10 hover:text-primary transition-all flex items-center gap-1.5">
            <Zap size={13} /> Control Center
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Leads Discovered" value={summary.totalDiscovered.toLocaleString()} icon={<Users size={16} />} color="accent" />
        <KPICard label="Qualified Leads" value={summary.qualified.toLocaleString()} icon={<CheckCircle2 size={16} />} color="success" />
        <KPICard label="Rejected" value={summary.rejected.toLocaleString()} icon={<Copy size={16} />} color="warning" />
        <KPICard label="Emails Queued" value={outreach?.queueSize || 0} icon={<Mail size={16} />} color="accent" />
        <KPICard label="Emails Sent" value={summary.emailsSent.toLocaleString()} icon={<Send size={16} />} color="success" />
        <KPICard label="Replies" value={summary.totalReplies.toLocaleString()} icon={<MessageSquare size={16} />} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Job Card */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-primary">Current Job</h3>
                    <p className="text-xs text-muted">{apiRun?.running ? 'Running in real-time' : 'No active job'}</p>
                  </div>
                </div>
                {apiRun?.running && <StatusBadge status="running" size="md" />}
              </div>
            </div>

            <div className="p-5 space-y-5">
              {run ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Keyword</p>
                      <p className="text-sm text-primary font-medium">{run.keyword}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Status</p>
                      <p className="text-sm text-accent-300 font-medium capitalize">{run.status}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Elapsed</p>
                      <p className="text-sm text-primary font-mono tabular-nums">{formatElapsed(elapsed)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Leads Found</p>
                      <p className="text-sm text-primary font-medium">{run.leadsDiscovered}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-secondary font-medium">Progress</span>
                      <span className="text-xs text-muted tabular-nums">{progress} / 1000</span>
                    </div>
                    <ProgressBar value={progress} max={1000} color="accent" size="lg" showValue={false} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="card-base p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={13} className="text-success-400" />
                        <span className="text-[10px] text-muted uppercase">Qualified</span>
                      </div>
                      <p className="text-lg font-bold text-success-400 tabular-nums">{run.qualified}</p>
                    </div>
                    <div className="card-base p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Copy size={13} className="text-warning-400" />
                        <span className="text-[10px] text-muted uppercase">Duplicates</span>
                      </div>
                      <p className="text-lg font-bold text-warning-400 tabular-nums">{run.duplicates}</p>
                    </div>
                    <div className="card-base p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={13} className="text-error-400" />
                        <span className="text-[10px] text-muted uppercase">Rejected</span>
                      </div>
                      <p className="text-lg font-bold text-error-400 tabular-nums">{run.rejected || 0}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted">No active automation job</p>
                  <p className="text-xs text-muted mt-1">Start an automation run from the Control Center</p>
                </div>
              )}

              {/* Stage Pipeline */}
              <div>
                <p className="text-xs text-secondary font-medium mb-3">Pipeline Stages</p>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                  {phases.map((phase, i) => {
                    const currentIdx = run ? phases.findIndex(p => p.id === run.status) : -1;
                    const isComplete = i < currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={phase.id} className="flex items-center flex-shrink-0">
                        <div className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg border transition-all ${isComplete ? 'bg-success-500/10 border-success-500/20' : ''} ${isCurrent ? 'bg-accent-500/10 border-accent-500/30 glow-accent' : ''} ${!isComplete && !isCurrent ? 'bg-white/5 border-white/10' : ''}`}>
                          <span className={`text-base ${isComplete ? 'text-success-400' : isCurrent ? 'text-accent-400' : 'text-muted'}`}>{isComplete ? '✓' : isCurrent ? '●' : phase.icon}</span>
                          <span className={`text-[9px] font-medium whitespace-nowrap ${isComplete ? 'text-success-400' : isCurrent ? 'text-accent-300' : 'text-muted'}`}>{phase.label}</span>
                        </div>
                        {i < phases.length - 1 && <ArrowRight size={12} className={`mx-0.5 ${isComplete ? 'text-success-500/40' : 'text-white/10'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Today's Keyword + Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Today's Keyword" subtitle={`Day ${todayKeyword.day || '-'} of 30`} icon={<Target size={18} />} />
            <div className="px-5 pb-5">
              <div className="card-base p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-primary font-semibold">{todayKeyword.keyword || 'No keyword'}</p>
                  <StatusBadge status={todayKeyword.status || 'scheduled'} />
                </div>
                <ProgressBar value={todayKeyword.qualifiedLeads || 0} max={todayKeyword.targetLeads || 1000} color="accent" size="md" label="Qualified Leads" />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] text-muted">Target</p>
                    <p className="text-sm text-primary tabular-nums">{(todayKeyword.targetLeads || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">Completion</p>
                    <p className="text-sm text-accent-300 tabular-nums">{todayKeyword.completion || 0}%</p>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('keywords')} className="w-full text-xs text-accent-400 hover:text-accent-300 font-medium flex items-center justify-center gap-1.5 py-2">
                View Full Schedule <ArrowRight size={13} />
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Failed Operations" icon={<AlertTriangle size={18} />} />
            <div className="px-5 pb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Failed runs</span>
                <span className="text-sm text-error-400 font-medium tabular-nums">{summary.failedRuns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Outreach failed</span>
                <span className="text-sm text-error-400 font-medium tabular-nums">{outreach?.failed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Total runs</span>
                <span className="text-sm text-primary font-medium tabular-nums">{summary.totalRuns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Human replies</span>
                <span className="text-sm text-success-400 font-medium tabular-nums">{summary.humanReplies}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recent Automation Runs" subtitle="Latest jobs" icon={<Clock size={18} />} />
          <div className="px-5 pb-5 space-y-2">
            {recentRuns.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No automation runs yet</p>
            ) : recentRuns.map((run: any) => (
              <div key={run.id} className="flex items-center justify-between p-3 card-base hover:border-white/20 transition-colors cursor-pointer" onClick={() => navigate('automation')}>
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={run.status} showDot={false} />
                  <div className="min-w-0">
                    <p className="text-xs text-primary font-medium truncate">{run.keyword}</p>
                    <p className="text-[10px] text-muted">{run.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-primary tabular-nums">{run.qualified}</p>
                    <p className="text-[10px] text-muted">qualified</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Lead Discovery vs Qualified" icon={<Users size={18} />} />
          <div className="px-5 pb-5">
            <LineChart data={[]} color="#06b6d4" height={180} showArea />
            <p className="text-xs text-muted text-center mt-3">Chart data will appear as automation runs complete</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

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
import {
  currentJob, leadDiscoveryChartData, qualifiedLeadsChartData,
  outreachStats, keywords, automationRuns,
} from '@/data/mockData';
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
  const [elapsed, setElapsed] = useState(currentJob.elapsedSeconds);
  const [progress, setProgress] = useState(currentJob.progress.current);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
      setProgress(prev => Math.min(prev + Math.random() * 3, currentJob.progress.target));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayKeyword = keywords.find(k => k.status === 'running') || keywords[26];
  const recentRuns = automationRuns.slice(0, 4);

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
              <StatusBadge status="running" />
            </div>
            <p className="text-xs text-muted mt-0.5">Automation engine active — Day 27 of monthly cycle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('automation')}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-secondary hover:bg-white/10 hover:text-primary transition-all flex items-center gap-1.5"
          >
            <Zap size={13} /> Control Center
          </button>
          <button
            onClick={() => addToast('info', 'System status', 'All systems operational')}
            className="px-3 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/20 text-xs text-accent-300 hover:bg-accent-500/20 transition-all"
          >
            View Details
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Leads Discovered" value="18,456" icon={<Users size={16} />} change="+12.4%" trend="up" color="accent" />
        <KPICard label="Qualified Leads" value="12,834" icon={<CheckCircle2 size={16} />} change="+8.2%" trend="up" color="success" />
        <KPICard label="Duplicates Rejected" value="4,167" icon={<Copy size={16} />} change="22.6%" trend="neutral" color="warning" />
        <KPICard label="Emails Queued" value={outreachStats.queueSize} icon={<Mail size={16} />} change="Pending" trend="neutral" color="accent" />
        <KPICard label="Emails Sent" value="8,421" icon={<Send size={16} />} change="+15.1%" trend="up" color="success" />
        <KPICard label="Replies Received" value="677" icon={<MessageSquare size={16} />} change="+5.3%" trend="up" color="accent" />
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
                    <p className="text-xs text-muted">Running in real-time</p>
                  </div>
                </div>
                <StatusBadge status="running" size="md" />
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Keyword</p>
                  <p className="text-sm text-primary font-medium">{currentJob.keyword}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm text-accent-300 font-medium capitalize">{currentJob.phase}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Elapsed</p>
                  <p className="text-sm text-primary font-mono tabular-nums">{formatElapsed(Math.floor(elapsed))}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Expected Completion</p>
                  <p className="text-sm text-primary font-medium">{currentJob.expectedCompletion}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-secondary font-medium">Progress</span>
                  <span className="text-xs text-muted tabular-nums">
                    {Math.floor(progress).toLocaleString()} / {currentJob.progress.target.toLocaleString()}
                  </span>
                </div>
                <ProgressBar value={Math.floor(progress)} max={currentJob.progress.target} color="accent" size="lg" showValue={false} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="card-base p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={13} className="text-success-400" />
                    <span className="text-[10px] text-muted uppercase">Qualified</span>
                  </div>
                  <p className="text-lg font-bold text-success-400 tabular-nums">{currentJob.qualified}</p>
                </div>
                <div className="card-base p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Copy size={13} className="text-warning-400" />
                    <span className="text-[10px] text-muted uppercase">Duplicates</span>
                  </div>
                  <p className="text-lg font-bold text-warning-400 tabular-nums">{currentJob.duplicates}</p>
                </div>
                <div className="card-base p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={13} className="text-error-400" />
                    <span className="text-[10px] text-muted uppercase">Rejected</span>
                  </div>
                  <p className="text-lg font-bold text-error-400 tabular-nums">{currentJob.rejected}</p>
                </div>
              </div>

              {/* Stage Pipeline */}
              <div>
                <p className="text-xs text-secondary font-medium mb-3">Pipeline Stages</p>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                  {phases.map((phase, i) => {
                    const currentIdx = phases.findIndex(p => p.id === currentJob.phase);
                    const isComplete = i < currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={phase.id} className="flex items-center flex-shrink-0">
                        <div className={`
                          flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg border transition-all
                          ${isComplete ? 'bg-success-500/10 border-success-500/20' : ''}
                          ${isCurrent ? 'bg-accent-500/10 border-accent-500/30 glow-accent' : ''}
                          ${!isComplete && !isCurrent ? 'bg-white/5 border-white/10' : ''}
                        `}>
                          <span className={`text-base ${isComplete ? 'text-success-400' : isCurrent ? 'text-accent-400' : 'text-muted'}`}>
                            {isComplete ? '✓' : isCurrent ? '●' : phase.icon}
                          </span>
                          <span className={`text-[9px] font-medium whitespace-nowrap ${isComplete ? 'text-success-400' : isCurrent ? 'text-accent-300' : 'text-muted'}`}>
                            {phase.label}
                          </span>
                        </div>
                        {i < phases.length - 1 && (
                          <ArrowRight size={12} className={`mx-0.5 ${isComplete ? 'text-success-500/40' : 'text-white/10'}`} />
                        )}
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
            <CardHeader title="Today's Keyword" subtitle="Day 27 of 30" icon={<Target size={18} />} />
            <div className="px-5 pb-5">
              <div className="card-base p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-primary font-semibold">{todayKeyword.keyword}</p>
                  <StatusBadge status={todayKeyword.status} />
                </div>
                <ProgressBar value={todayKeyword.qualifiedLeads} max={todayKeyword.targetLeads} color="accent" size="md" label="Qualified Leads" />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] text-muted">Target</p>
                    <p className="text-sm text-primary tabular-nums">{todayKeyword.targetLeads.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">Completion</p>
                    <p className="text-sm text-accent-300 tabular-nums">{todayKeyword.completion}%</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('keywords')}
                className="w-full text-xs text-accent-400 hover:text-accent-300 font-medium flex items-center justify-center gap-1.5 py-2"
              >
                View Full Schedule <ArrowRight size={13} />
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Failed Operations" icon={<AlertTriangle size={18} />} />
            <div className="px-5 pb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Email send failures</span>
                <span className="text-sm text-error-400 font-medium tabular-nums">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">AI generation failures</span>
                <span className="text-sm text-error-400 font-medium tabular-nums">32</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Integration errors</span>
                <span className="text-sm text-error-400 font-medium tabular-nums">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary">Bounced emails</span>
                <span className="text-sm text-warning-400 font-medium tabular-nums">8</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Lead Discovery vs Qualified" subtitle="Last 7 days" icon={<Users size={18} />} />
          <div className="px-5 pb-5">
            <LineChart data={leadDiscoveryChartData} color="#06b6d4" height={180} showArea />
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-accent-500" />
                <span className="text-xs text-muted">Discovered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-success-500" />
                <span className="text-xs text-muted">Qualified</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Automation Runs" subtitle="Last 4 jobs" icon={<Clock size={18} />} />
          <div className="px-5 pb-5 space-y-2">
            {recentRuns.map(run => (
              <div key={run.id} className="flex items-center justify-between p-3 card-base hover:border-white/20 transition-colors cursor-pointer" onClick={() => navigate('automation')}>
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={run.status} showDot={false} />
                  <div className="min-w-0">
                    <p className="text-xs text-primary font-medium truncate">{run.keyword}</p>
                    <p className="text-[10px] text-muted">{run.id} · {new Date(run.startedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-primary tabular-nums">{run.qualified}</p>
                    <p className="text-[10px] text-muted">qualified</p>
                  </div>
                  {run.exceededExpected && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-warning-500/10 text-warning-400 border border-warning-500/20">OVERRUN</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

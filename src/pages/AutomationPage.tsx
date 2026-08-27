import { useState, useEffect } from 'react';
import {
  Zap, Pause, Play, Square, RotateCcw, Clock, AlertTriangle,
  Send, CheckCircle2, Copy, MessageSquare, Calendar,
} from 'lucide-react';
import { Card, CardHeader, ProgressBar, KPICard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';

const automationRuns: any[] = [];
const currentJob = { elapsedSeconds: 0, progress: { current: 0, target: 1000 }, phase: 'discovery', expectedCompletion: '' };
const telegramConfig = { enabled: false };

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AutomationPage() {
  const { addToast } = useToast();
  const [isRunning, setIsRunning] = useState(true);
  const [elapsed, setElapsed] = useState(currentJob.elapsedSeconds);
  const [progress, setProgress] = useState(currentJob.progress.current);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [exceededExpected, setExceededExpected] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
      setProgress(prev => Math.min(prev + Math.random() * 2, currentJob.progress.target));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const currentRun = automationRuns[0] || { keyword: '', startedAt: '', expectedEnd: '', actualEnd: null, leadsDiscovered: 0, qualified: 0, duplicates: 0, emailsSent: 0, replies: 0, status: 'running' as const, id: '', exceededExpected: false };
  const now = new Date();
  const expectedEnd = new Date(currentRun.expectedEnd);
  const isOverdue = now > expectedEnd && isRunning;

  const handlePause = () => {
    setIsRunning(false);
    addToast('warning', 'Automation paused', 'The current job has been paused. Resume when ready.');
  };

  const handleResume = () => {
    setIsRunning(true);
    addToast('success', 'Automation resumed', 'The current job is now running again.');
  };

  const handleStop = () => {
    setIsRunning(false);
    addToast('error', 'Automation stopped', 'The current job has been cancelled.');
  };

  const handleRestart = () => {
    setIsRunning(true);
    setElapsed(0);
    setProgress(0);
    addToast('info', 'Job restarted', 'The failed job has been restarted from the beginning.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Master Control */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isRunning ? 'bg-accent-500/10 glow-accent' : 'bg-white/5'}`}>
                <Zap size={22} className={isRunning ? 'text-accent-400' : 'text-muted'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-primary">Master Automation</h2>
                  <StatusBadge status={isRunning ? 'running' : 'paused'} size="md" />
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {isRunning ? 'Automation engine is actively running' : 'Automation engine is paused'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isRunning ? 'secondary' : 'success'}
                size="md"
                icon={isRunning ? <Pause size={15} /> : <Play size={15} />}
                onClick={isRunning ? handlePause : handleResume}
              >
                {isRunning ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={<RotateCcw size={15} />}
                onClick={() => setShowRestartConfirm(true)}
              >
                Restart Failed
              </Button>
              <Button
                variant="danger"
                size="md"
                icon={<Square size={15} />}
                onClick={() => setShowStopConfirm(true)}
              >
                Stop
              </Button>
            </div>
          </div>
        </div>

        {/* Current Run Details */}
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Current Keyword</p>
              <p className="text-sm text-primary font-medium">{currentRun.keyword}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Started At</p>
              <p className="text-sm text-primary">{new Date(currentRun.startedAt).toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Expected End</p>
              <p className="text-sm text-primary">{new Date(currentRun.expectedEnd).toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Actual End</p>
              <p className="text-sm text-muted">{currentRun.actualEnd ? new Date(currentRun.actualEnd).toLocaleTimeString() : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Queue Position</p>
              <p className="text-sm text-primary">1 of 3 pending</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Current Phase</p>
              <p className="text-sm text-accent-300 font-medium capitalize">{currentJob.phase}</p>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-secondary font-medium">Job Progress</span>
              <span className="text-xs text-muted tabular-nums">
                {Math.floor(progress).toLocaleString()} / {currentJob.progress.target.toLocaleString()} leads
              </span>
            </div>
            <ProgressBar value={Math.floor(progress)} max={currentJob.progress.target} color="accent" size="lg" showValue={false} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted">Elapsed: <span className="text-primary font-mono tabular-nums">{formatElapsed(Math.floor(elapsed))}</span></span>
              <span className="text-xs text-muted">Expected completion: <span className="text-primary">{currentJob.expectedCompletion}</span></span>
            </div>
          </div>

          {/* Expected End Time Exceeded Warning */}
          {isOverdue && isRunning && (
            <div className="rounded-xl border border-warning-500/30 bg-warning-500/10 p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-warning-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-warning-400">Expected End Time Exceeded</h4>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-[10px] text-muted uppercase">Expected End</p>
                      <p className="text-sm text-primary">{new Date(currentRun.expectedEnd).toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase">Current Time</p>
                      <p className="text-sm text-primary">{now.toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase">Status</p>
                      <p className="text-sm text-warning-400 font-semibold">STILL RUNNING</p>
                    </div>
                  </div>
                  <p className="text-xs text-secondary mt-3">
                    Automation exceeded its expected completion window. The job will continue until its configured completion condition is reached.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Telegram Alert Status */}
          <div className="flex items-center justify-between mt-4 p-3 card-base">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${telegramConfig.enabled ? 'bg-success-500/10' : 'bg-white/5'}`}>
                <MessageSquare size={15} className={telegramConfig.enabled ? 'text-success-400' : 'text-muted'} />
              </div>
              <div>
                <p className="text-xs text-primary font-medium">Telegram Alerts</p>
                <p className="text-[10px] text-muted">{telegramConfig.enabled ? 'Active — sending notifications' : 'Disabled'}</p>
              </div>
            </div>
            <StatusBadge status={telegramConfig.enabled ? 'connected' : 'disabled'} />
          </div>
        </div>
      </Card>

      {/* Run Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Leads Discovered" value={currentRun.leadsDiscovered} icon={<Zap size={16} />} color="accent" />
        <KPICard label="Qualified" value={currentRun.qualified} icon={<CheckCircle2 size={16} />} color="success" />
        <KPICard label="Duplicates" value={currentRun.duplicates} icon={<Copy size={16} />} color="warning" />
        <KPICard label="Emails Sent" value={currentRun.emailsSent} icon={<Send size={16} />} color="accent" />
      </div>

      {/* Automation Run History */}
      <Card>
        <CardHeader title="Automation Run History" subtitle="Recent automation runs" icon={<Clock size={18} />} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-5 text-left text-[10px] font-semibold text-muted uppercase">Run ID</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Keyword</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Status</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Started</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Expected End</th>
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Actual End</th>
                <th className="py-3 px-3 text-right text-[10px] font-semibold text-muted uppercase">Qualified</th>
                <th className="py-3 px-3 text-right text-[10px] font-semibold text-muted uppercase">Emails</th>
                <th className="py-3 px-3 text-right text-[10px] font-semibold text-muted uppercase">Replies</th>
              </tr>
            </thead>
            <tbody>
              {automationRuns.map(run => (
                <tr key={run.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-5 text-sm text-muted font-mono">{run.id}</td>
                  <td className="py-3 px-3 text-sm text-primary">{run.keyword}</td>
                  <td className="py-3 px-3"><StatusBadge status={run.status} /></td>
                  <td className="py-3 px-3 text-xs text-secondary">{new Date(run.startedAt).toLocaleString()}</td>
                  <td className="py-3 px-3 text-xs text-secondary">{new Date(run.expectedEnd).toLocaleTimeString()}</td>
                  <td className="py-3 px-3 text-xs text-secondary">
                    {run.actualEnd ? new Date(run.actualEnd).toLocaleTimeString() : '—'}
                    {run.exceededExpected && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-warning-500/10 text-warning-400">OVERRUN</span>}
                  </td>
                  <td className="py-3 px-3 text-sm text-success-400 text-right tabular-nums">{run.qualified}</td>
                  <td className="py-3 px-3 text-sm text-secondary text-right tabular-nums">{run.emailsSent}</td>
                  <td className="py-3 px-3 text-sm text-accent-300 text-right tabular-nums">{run.replies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        onConfirm={handleStop}
        title="Stop Automation"
        message="This will cancel the current running job. Leads discovered so far will be saved, but the job cannot be resumed from where it stopped. Are you sure?"
        confirmLabel="Stop Automation"
        danger
      />
      <ConfirmDialog
        open={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        onConfirm={handleRestart}
        title="Restart Failed Job"
        message="This will restart the last failed automation job from the beginning. The queue position will be updated accordingly."
        confirmLabel="Restart Job"
      />
    </div>
  );
}

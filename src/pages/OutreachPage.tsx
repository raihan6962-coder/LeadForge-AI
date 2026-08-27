import { useState } from 'react';
import {
  Mail, Send, Clock, AlertTriangle, CheckCircle2, XCircle,
  Inbox, ArrowRight, Settings, Gauge,
} from 'lucide-react';
import { Card, CardHeader, KPICard, ProgressBar } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';

const outreachStats = { queueSize: 0, sent: 0, pending: 0, failed: 0, deferred: 0, replies: 0, bounces: 0, sendingIntervalMin: 0, sendingIntervalMax: 0 };
const senderAccounts: any[] = [];

const pipelineStages = [
  { label: 'Lead', icon: '◉', count: 18456, color: 'text-accent-400' },
  { label: 'Personalized', icon: '✦', count: 312, color: 'text-accent-300' },
  { label: 'Ready', icon: '✓', count: 234, color: 'text-success-400' },
  { label: 'Sending', icon: '➤', count: 12, color: 'text-warning-400' },
  { label: 'Sent', icon: '✉', count: 8421, color: 'text-success-400' },
  { label: 'Reply / No Reply', icon: '↩', count: 677, color: 'text-accent-300' },
];

export function OutreachPage() {
  const { addToast } = useToast();
  const [intervalMin, setIntervalMin] = useState(outreachStats.sendingIntervalMin);
  const [intervalMax, setIntervalMax] = useState(outreachStats.sendingIntervalMax);

  const totalCapacity = senderAccounts.reduce((sum, s) => sum + s.dailyCapacity, 0);
  const totalSent = senderAccounts.reduce((sum, s) => sum + s.sentToday, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Outreach Center</h2>
          <p className="text-xs text-muted mt-0.5">Email automation queue and sending status</p>
        </div>
        <Button variant="outline" size="sm" icon={<Settings size={14} />} onClick={() => addToast('info', 'Settings', 'Outreach settings opened.')}>
          Configure
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Queue Size" value={outreachStats.queueSize} icon={<Inbox size={16} />} color="accent" />
        <KPICard label="Sent" value={outreachStats.sent.toLocaleString()} icon={<Send size={16} />} color="success" />
        <KPICard label="Pending" value={outreachStats.pending} icon={<Clock size={16} />} color="accent" />
        <KPICard label="Failed" value={outreachStats.failed} icon={<XCircle size={16} />} color="error" />
        <KPICard label="Deferred" value={outreachStats.deferred} icon={<AlertTriangle size={16} />} color="warning" />
        <KPICard label="Replies" value={outreachStats.replies} icon={<Mail size={16} />} color="accent" />
      </div>

      {/* Queue Pipeline */}
      <Card>
        <CardHeader title="Outreach Pipeline" subtitle="Lead → Personalized → Ready → Sending → Sent → Reply" icon={<ArrowRight size={18} />} />
        <div className="px-5 pb-5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
            {pipelineStages.map((stage, i) => (
              <div key={stage.label} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-lg bg-white/5 border border-white/10 min-w-[100px]">
                  <span className={`text-lg ${stage.color}`}>{stage.icon}</span>
                  <span className="text-[10px] text-muted uppercase tracking-wider">{stage.label}</span>
                  <span className="text-sm text-primary font-semibold tabular-nums">{stage.count.toLocaleString()}</span>
                </div>
                {i < pipelineStages.length - 1 && <ArrowRight size={14} className="text-muted mx-0.5" />}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sending Interval */}
        <Card>
          <CardHeader title="Sending Interval" subtitle="Operational throttle" icon={<Gauge size={18} />} />
          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min (seconds)"
                type="number"
                value={intervalMin}
                onChange={e => setIntervalMin(parseInt(e.target.value) || 0)}
              />
              <Input
                label="Max (seconds)"
                type="number"
                value={intervalMax}
                onChange={e => setIntervalMax(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="p-3 rounded-lg bg-accent-500/5 border border-accent-500/15">
              <p className="text-xs text-accent-300 font-medium">Current: {intervalMin}–{intervalMax} seconds</p>
              <p className="text-[10px] text-muted mt-1">
                This is a configurable operational throttle. Actual sending limits are governed by the email provider and the configured endpoint.
              </p>
            </div>
            <Button size="sm" className="w-full" onClick={() => addToast('success', 'Interval updated', `Sending interval set to ${intervalMin}–${intervalMax} seconds.`)}>
              Save Interval
            </Button>
          </div>
        </Card>

        {/* Bounce & Failure */}
        <Card>
          <CardHeader title="Delivery Status" icon={<AlertTriangle size={18} />} />
          <div className="px-5 pb-5 space-y-3">
            <div className="flex items-center justify-between p-3 card-base">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-success-400" />
                <span className="text-xs text-secondary">Delivered</span>
              </div>
              <span className="text-sm text-success-400 font-medium tabular-nums">{(outreachStats.sent - outreachStats.failed).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 card-base">
              <div className="flex items-center gap-2">
                <XCircle size={15} className="text-error-400" />
                <span className="text-xs text-secondary">Failed</span>
              </div>
              <span className="text-sm text-error-400 font-medium tabular-nums">{outreachStats.failed}</span>
            </div>
            <div className="flex items-center justify-between p-3 card-base">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-warning-400" />
                <span className="text-xs text-secondary">Bounced</span>
              </div>
              <span className="text-sm text-warning-400 font-medium tabular-nums">{outreachStats.bounces}</span>
            </div>
            <div className="flex items-center justify-between p-3 card-base">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-accent-400" />
                <span className="text-xs text-secondary">Deferred</span>
              </div>
              <span className="text-sm text-accent-300 font-medium tabular-nums">{outreachStats.deferred}</span>
            </div>
          </div>
        </Card>

        {/* Capacity Overview */}
        <Card>
          <CardHeader title="Sending Capacity" subtitle="Daily aggregate" icon={<Gauge size={18} />} />
          <div className="px-5 pb-5">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-secondary">Total sent today</span>
                <span className="text-xs text-muted tabular-nums">{totalSent} / {totalCapacity}</span>
              </div>
              <ProgressBar value={totalSent} max={totalCapacity} color="accent" size="md" showValue={false} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-base p-3 text-center">
                <p className="text-[10px] text-muted uppercase">Total Capacity</p>
                <p className="text-lg text-primary font-bold tabular-nums">{totalCapacity}</p>
              </div>
              <div className="card-base p-3 text-center">
                <p className="text-[10px] text-muted uppercase">Remaining</p>
                <p className="text-lg text-accent-300 font-bold tabular-nums">{totalCapacity - totalSent}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sender Accounts */}
      <Card>
        <CardHeader title="Sending Account Distribution" subtitle="Multiple sending endpoints with rotation" icon={<Mail size={18} />} />
        <div className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {senderAccounts.map(sender => (
              <div key={sender.id} className="card-base p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted font-mono">#{sender.priority}</span>
                      <p className="text-sm text-primary font-semibold">{sender.name}</p>
                    </div>
                    <p className="text-[10px] text-muted mt-0.5 truncate max-w-[200px]">{sender.webAppUrl}</p>
                  </div>
                  <StatusBadge status={sender.status} />
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted">Daily Capacity</span>
                    <span className="text-[10px] text-secondary tabular-nums">{sender.sentToday} / {sender.dailyCapacity}</span>
                  </div>
                  <ProgressBar
                    value={sender.sentToday}
                    max={sender.dailyCapacity}
                    color={sender.sentToday / sender.dailyCapacity > 0.85 ? 'warning' : 'success'}
                    size="sm"
                    showValue={false}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-muted">Remaining</p>
                    <p className="text-secondary tabular-nums">{sender.dailyCapacity - sender.sentToday}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">Last Send</p>
                    <p className="text-secondary">{new Date(sender.lastSuccessfulSend).toLocaleTimeString()}</p>
                  </div>
                </div>

                {sender.lastError && (
                  <div className="mt-3 p-2 rounded-md bg-error-500/5 border border-error-500/15">
                    <p className="text-[10px] text-error-400">{sender.lastError}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] text-muted leading-relaxed">
              Actual sending limits are governed by the email provider and the configured endpoint. Rotation logic distributes load across healthy senders. The system does not attempt to bypass provider anti-spam controls.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

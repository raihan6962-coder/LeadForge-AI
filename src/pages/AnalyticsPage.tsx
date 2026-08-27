import { useState } from 'react';
import {
  Users, Send, MessageSquare, Target, TrendingUp, Clock,
  BarChart3, Activity, Zap,
} from 'lucide-react';
import { Card, CardHeader, KPICard } from '@/components/ui/Card';
import { LineChart, BarChart, DonutChart, Heatmap } from '@/components/ui/Charts';

const leadDiscoveryChartData: any[] = [];
const qualifiedLeadsChartData: any[] = [];
const emailsSentChartData: any[] = [];
const repliesChartData: any[] = [];
const qualificationDonutData: any[] = [];
const replyClassificationData: any[] = [];
const keywordAnalytics: any[] = [];
const senderAnalytics: any[] = [];
const automationAnalytics = { totalRuns: 0, avgRuntimeMinutes: 0, successRate: 0, failedJobs: 0, overruns: 0 };
const heatmapData: any[] = [];

type DateRange = 'today' | '7d' | '30d' | 'custom';

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const rangeButtons: { id: DateRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Analytics Dashboard</h2>
          <p className="text-xs text-muted mt-0.5">Performance metrics across all automation activities</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {rangeButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => setDateRange(btn.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                dateRange === btn.id ? 'bg-accent-500 text-white' : 'text-secondary hover:text-primary'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Discovery KPIs */}
      <div>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Lead Discovery</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard label="Total Discovered" value="18,456" icon={<Users size={16} />} change="+12.4%" trend="up" color="accent" />
          <KPICard label="Qualified" value="12,834" icon={<CheckCircle size={16} />} change="+8.2%" trend="up" color="success" />
          <KPICard label="Rejected" value="3,212" icon={<XCircle size={16} />} color="error" />
          <KPICard label="Duplicates" value="4,167" icon={<Copy size={16} />} color="warning" />
          <KPICard label="Qualification Rate" value="69.6%" icon={<Target size={16} />} change="+2.1%" trend="up" color="accent" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Lead Discovery Trend" subtitle="Discovered vs Qualified" icon={<TrendingUp size={18} />} />
          <div className="px-5 pb-5">
            <LineChart data={leadDiscoveryChartData} color="#06b6d4" height={200} showArea />
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent-500" /><span className="text-xs text-muted">Discovered</span></div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Qualified Leads Trend" subtitle="Last 7 days" icon={<CheckCircle size={18} />} />
          <div className="px-5 pb-5">
            <LineChart data={qualifiedLeadsChartData} color="#10b981" height={200} showArea />
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success-500" /><span className="text-xs text-muted">Qualified</span></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Qualification Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Qualification Breakdown" icon={<Target size={18} />} />
          <div className="px-5 pb-5 flex items-center justify-center py-4">
            <DonutChart data={qualificationDonutData} centerValue="18,456" centerLabel="Total Leads" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Reply Classification" icon={<MessageSquare size={18} />} />
          <div className="px-5 pb-5 flex items-center justify-center py-4">
            <DonutChart data={replyClassificationData} centerValue="677" centerLabel="Total Replies" />
          </div>
        </Card>
      </div>

      {/* Outreach KPIs */}
      <div>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Outreach Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard label="Emails Queued" value="234" icon={<Clock size={16} />} color="accent" />
          <KPICard label="Emails Sent" value="8,421" icon={<Send size={16} />} change="+15.1%" trend="up" color="success" />
          <KPICard label="Failed" value="23" icon={<XCircle size={16} />} color="error" />
          <KPICard label="Deferred" value="12" icon={<Clock size={16} />} color="warning" />
          <KPICard label="Reply Rate" value="8.0%" icon={<MessageSquare size={16} />} change="+0.5%" trend="up" color="accent" />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Emails Sent" subtitle="Last 7 days" icon={<Send size={18} />} />
          <div className="px-5 pb-5">
            <BarChart data={emailsSentChartData} color="#06b6d4" height={200} showValues />
          </div>
        </Card>

        <Card>
          <CardHeader title="Replies Received" subtitle="Last 7 days" icon={<MessageSquare size={18} />} />
          <div className="px-5 pb-5">
            <LineChart data={repliesChartData} color="#06b6d4" height={200} showArea showDots />
          </div>
        </Card>
      </div>

      {/* Keyword Analytics */}
      <Card>
        <CardHeader title="Keyword Performance" subtitle="Comparison across keywords" icon={<BarChart3 size={18} />} />
        <div className="px-5 pb-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-3 text-left text-[10px] font-semibold text-muted uppercase">Keyword</th>
                <th className="py-3 px-3 text-right text-[10px] font-semibold text-muted uppercase">Leads</th>
                <th className="py-3 px-3 text-right text-[10px] font-semibold text-muted uppercase">Qualified</th>
                <th className="py-3 px-3 text-right text-[10px] font-semibold text-muted uppercase">Qual. Rate</th>
                <th className="py-3 px-3 text-right text-[10px] font-semibold text-muted uppercase">Outreach</th>
                <th className="py-3 px-3 text-right text-[10px] font-semibold text-muted uppercase">Replies</th>
              </tr>
            </thead>
            <tbody>
              {keywordAnalytics.map((kw, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-sm text-primary">{kw.keyword}</td>
                  <td className="py-3 px-3 text-sm text-secondary text-right tabular-nums">{kw.leads}</td>
                  <td className="py-3 px-3 text-sm text-success-400 text-right tabular-nums">{kw.qualified}</td>
                  <td className="py-3 px-3 text-sm text-accent-300 text-right tabular-nums">{kw.qualificationRate}%</td>
                  <td className="py-3 px-3 text-sm text-secondary text-right tabular-nums">{kw.outreach}</td>
                  <td className="py-3 px-3 text-sm text-primary text-right tabular-nums">{kw.replies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sender Analytics */}
      <Card>
        <CardHeader title="Sender Performance" subtitle="Per-account analytics" icon={<Send size={18} />} />
        <div className="px-5 pb-5 space-y-3">
          {senderAnalytics.map((sender, i) => (
            <div key={i} className="card-base p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-primary font-medium">{sender.name}</p>
                <span className={`text-xs tabular-nums ${sender.failureRate > 5 ? 'text-error-400' : sender.failureRate > 2 ? 'text-warning-400' : 'text-success-400'}`}>
                  {sender.failureRate}% failure
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-[10px] text-muted uppercase">Sent</p><p className="text-sm text-primary tabular-nums">{sender.sent}</p></div>
                <div><p className="text-[10px] text-muted uppercase">Failed</p><p className="text-sm text-error-400 tabular-nums">{sender.failed}</p></div>
                <div><p className="text-[10px] text-muted uppercase">Remaining</p><p className="text-sm text-accent-300 tabular-nums">{sender.remainingCapacity}</p></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Automation Analytics */}
      <Card>
        <CardHeader title="Automation Performance" subtitle="Runtime and success metrics" icon={<Activity size={18} />} />
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <KPICard label="Total Runs" value={automationAnalytics.totalRuns} icon={<Zap size={16} />} color="accent" />
            <KPICard label="Avg Runtime" value={`${automationAnalytics.avgRuntimeMinutes}m`} icon={<Clock size={16} />} color="accent" />
            <KPICard label="Success Rate" value={`${automationAnalytics.successRate}%`} icon={<CheckCircle size={16} />} color="success" />
            <KPICard label="Failed Jobs" value={automationAnalytics.failedJobs} icon={<XCircle size={16} />} color="error" />
            <KPICard label="Overruns" value={automationAnalytics.overruns} icon={<Clock size={16} />} color="warning" />
          </div>
        </div>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader title="Activity Heatmap" subtitle="Lead discovery activity by day and hour" icon={<Activity size={18} />} />
        <div className="px-5 pb-5">
          <Heatmap data={heatmapData} />
        </div>
      </Card>
    </div>
  );
}

function CheckCircle({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
}

function XCircle({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
}

function Copy({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
}

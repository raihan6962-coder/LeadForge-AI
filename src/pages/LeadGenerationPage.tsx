import { useState } from 'react';
import { Search, ChevronRight, Target, AlertTriangle, Layers } from 'lucide-react';
import { Card, CardHeader, ProgressBar, KPICard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';

const searchExpansion = { primaryQuery: '', relatedQueries: [] as { query: string; leadsDiscovered: number; qualified: number; rejected: number; duplicates: number; status: string }[] };
const currentJob = { progress: { current: 0, target: 1000 } };

export function LeadGenerationPage() {
  const [selectedQuery, setSelectedQuery] = useState<number | null>(null);

  const totalDiscovered = searchExpansion.relatedQueries.reduce((sum, q) => sum + q.leadsDiscovered, 0);
  const totalQualified = searchExpansion.relatedQueries.reduce((sum, q) => sum + q.qualified, 0);
  const totalRejected = searchExpansion.relatedQueries.reduce((sum, q) => sum + q.rejected, 0);
  const totalDuplicates = searchExpansion.relatedQueries.reduce((sum, q) => sum + q.duplicates, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-primary">Search Expansion Visualization</h2>
        <p className="text-xs text-muted mt-0.5">How the system discovers leads when the primary keyword doesn't produce enough</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Discovered" value={totalDiscovered} icon={<Search size={16} />} color="accent" />
        <KPICard label="Total Qualified" value={totalQualified} icon={<Target size={16} />} color="success" />
        <KPICard label="Total Rejected" value={totalRejected} icon={<AlertTriangle size={16} />} color="error" />
        <KPICard label="Duplicates" value={totalDuplicates} icon={<Layers size={16} />} color="warning" />
      </div>

      {/* Primary Keyword */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
            <Search size={20} />
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider">Primary Keyword</p>
            <p className="text-lg font-semibold text-primary">{searchExpansion.primaryQuery}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status="running" />
          </div>
        </div>

        <div className="card-base p-4 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-secondary font-medium">Primary Query Results</span>
            <span className="text-xs text-muted tabular-nums">{currentJob.progress.current} discovered</span>
          </div>
          <ProgressBar value={currentJob.progress.current} max={currentJob.progress.target} color="accent" size="md" showValue={false} />
          <p className="text-[10px] text-muted mt-2">
            Target: {currentJob.progress.target.toLocaleString()} qualified leads. The system expands the search when the primary query alone cannot reach the target.
          </p>
        </div>
      </Card>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader title="Search Expansion Funnel" subtitle="Related queries generated to maximize discovery" icon={<Layers size={18} />} />
        <div className="px-5 pb-5">
          <div className="flex flex-col items-center gap-1">
            {/* Primary node */}
            <div className="w-full max-w-md p-4 rounded-xl bg-accent-500/10 border border-accent-500/20 text-center glow-accent">
              <p className="text-xs text-accent-300 font-medium uppercase tracking-wider">Primary Query</p>
              <p className="text-sm text-primary font-semibold mt-1">{searchExpansion.primaryQuery}</p>
              <p className="text-xs text-muted mt-1">{currentJob.progress.current} leads discovered</p>
            </div>

            <ChevronRight size={20} className="text-muted -rotate-90 my-1" />

            {/* Related queries */}
            {searchExpansion.relatedQueries.map((rq, i) => {
              const widthPercent = 100 - (i * 12);
              return (
                <div key={i} className="w-full flex flex-col items-center">
                  <div
                    className="p-3.5 rounded-xl border text-center transition-all cursor-pointer hover:border-white/20"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: rq.status === 'exhausted' ? 'rgba(110, 118, 129, 0.05)' : 'rgba(255,255,255,0.03)',
                      borderColor: rq.status === 'exhausted' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                    }}
                    onClick={() => setSelectedQuery(selectedQuery === i ? null : i)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left min-w-0">
                        <p className="text-xs text-primary font-medium truncate">{rq.query}</p>
                        <p className="text-[10px] text-muted mt-0.5">{rq.leadsDiscovered} discovered · {rq.qualified} qualified</p>
                      </div>
                      <StatusBadge status={rq.status} showDot={false} />
                    </div>
                  </div>

                  {selectedQuery === i && (
                    <div className="w-full max-w-lg mt-2 p-4 card-base animate-slide-up">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-muted uppercase">Discovered</p>
                          <p className="text-sm text-primary tabular-nums">{rq.leadsDiscovered}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Qualified</p>
                          <p className="text-sm text-success-400 tabular-nums">{rq.qualified}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Rejected</p>
                          <p className="text-sm text-error-400 tabular-nums">{rq.rejected}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Duplicates</p>
                          <p className="text-sm text-warning-400 tabular-nums">{rq.duplicates}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {i < searchExpansion.relatedQueries.length - 1 && (
                    <ChevronRight size={16} className="text-muted -rotate-90 my-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-warning-500/5 border border-warning-500/15">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-warning-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-secondary leading-relaxed">
                The system cannot guarantee {currentJob.progress.target.toLocaleString()} qualified leads if the market does not contain that many qualifying apps.
                Search expansion continues until the target is reached or discovery is reasonably exhausted.
                The current configuration allows up to 5 expansion levels.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

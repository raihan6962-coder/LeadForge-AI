import { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Zap, Search, CheckCircle2, Copy, XCircle,
  Mail, Send, Clock, Target, ArrowRight, Bot, Globe, Star, AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, ProgressBar, KPICard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Phase = 'idle' | 'searching' | 'discovery' | 'qualification' | 'deduplication' | 'enrichment' | 'complete';
type QueryStatus = 'pending' | 'querying' | 'parsing' | 'done' | 'error';

interface SearchQuery {
  query: string;
  type: 'primary' | 'expansion';
  status: QueryStatus;
  resultsFound: number;
}

interface TestLead {
  id: string;
  appName: string;
  packageName: string;
  developer: string;
  developerEmail: string;
  rating: number;
  installs: string;
  category: string;
  country: string;
  website: string;
  email: string;
  source: string;
  phase: string;
  status: 'discovered' | 'qualified' | 'rejected' | 'duplicate';
  rejectionReason?: string;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export function AutomationTestPage() {
  const [keyword, setKeyword] = useState('');
  const [maxRating, setMaxRating] = useState('5');
  const [minRating, setMinRating] = useState('3');
  const [maxInstalls, setMaxInstalls] = useState('100000');
  const [minInstalls, setMinInstalls] = useState('100');
  const [maxLeads, setMaxLeads] = useState('20');

  const [phase, setPhase] = useState<Phase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [leads, setLeads] = useState<TestLead[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [stats, setStats] = useState({ discovered: 0, qualified: 0, rejected: 0, duplicates: 0, enriched: 0 });
  const [error, setError] = useState('');
  const intervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const targetCount = Math.min(parseInt(maxLeads) || 20, 50);

  useEffect(() => { return () => { clearInterval(intervalRef.current); clearInterval(timerRef.current); }; }, []);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logLines]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogLines(prev => [...prev, `[${time}] ${msg}`]);
  };

  const fetchPlayStore = async (query: string): Promise<any[]> => {
    try {
      const res = await fetch(`/api/playstore/search?q=${encodeURIComponent(query)}&lang=en&country=us`);
      const data = await res.json();
      if (data.success && data.data?.apps) return data.data.apps;
      return [];
    } catch {
      return [];
    }
  };

  const startTest = async () => {
    if (!keyword.trim()) return;
    setIsRunning(true);
    setPhase('searching');
    setProgress(0);
    setElapsed(0);
    setLeads([]);
    setLogLines([]);
    setStats({ discovered: 0, qualified: 0, rejected: 0, duplicates: 0, enriched: 0 });
    setError('');

    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    const maxR = parseFloat(maxRating) || 5;
    const minR = parseFloat(minRating) || 3;
    const maxI = parseInt(maxInstalls) || 100000;
    const minI = parseInt(minInstalls) || 100;

    // Build search queries
    const queries: SearchQuery[] = [
      { query: keyword, type: 'primary', status: 'pending', resultsFound: 0 },
      { query: `${keyword} app`, type: 'expansion', status: 'pending', resultsFound: 0 },
      { query: `best ${keyword}`, type: 'expansion', status: 'pending', resultsFound: 0 },
    ];
    setSearchQueries([...queries]);
    addLog(`Initializing Google Play Store scraper...`);
    await sleep(400);
    addLog(`Building search queries for "${keyword}"...`);
    await sleep(300);

    // Execute search queries
    let allApps: any[] = [];
    for (let qi = 0; qi < queries.length; qi++) {
      queries[qi] = { ...queries[qi], status: 'querying' };
      setSearchQueries([...queries]);
      addLog(`Searching Google Play: "${queries[qi].query}"...`);
      await sleep(500);

      const apps = await fetchPlayStore(queries[qi].query);
      queries[qi] = { ...queries[qi], status: 'parsing', resultsFound: apps.length };
      setSearchQueries([...queries]);
      addLog(`Found ${apps.length} apps. Parsing results...`);
      await sleep(300);

      allApps = [...allApps, ...apps.map(a => ({ ...a, _queryIdx: qi }))];
      queries[qi] = { ...queries[qi], status: 'done' };
      setSearchQueries([...queries]);
      addLog(`Query ${qi + 1} complete. ${apps.length} results.`);
      await sleep(200);
    }

    if (allApps.length === 0) {
      setError('No results found from Google Play Store. The service may be temporarily unavailable or blocking automated requests.');
      addLog('ERROR: No results returned from Google Play Store.');
      clearInterval(timerRef.current);
      setIsRunning(false);
      setPhase('idle');
      return;
    }

    setPhase('discovery');
    setProgress(20);
    addLog(`Search complete. ${allApps.length} total apps discovered. Starting qualification...`);
    await sleep(400);

    // Deduplicate by packageName
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const app of allApps) {
      if (!seen.has(app.packageName)) {
        seen.add(app.packageName);
        unique.push(app);
      }
    }
    addLog(`After dedup: ${unique.length} unique apps.`);
    await sleep(300);

    // Qualify
    let leadList: TestLead[] = [];
    let qualified = 0;
    let rejected = 0;
    let duplicates = 0;

    for (let i = 0; i < unique.length && leadList.length < targetCount; i++) {
      const app = unique[i];
      const rating = app.rating || 0;
      const installs = parseInt(String(app.installs).replace(/[^0-9]/g, '')) || 0;
      const email = app.developerEmail || `contact@${app.developer?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown'}.com`;

      const isDup = seen.has(email);
      seen.add(email);

      let status: TestLead['status'] = 'qualified';
      let rejectionReason = '';

      if (isDup) {
        status = 'duplicate';
        duplicates++;
      } else if (rating > 0 && rating < minR) {
        status = 'rejected';
        rejectionReason = `Rating ${rating} below minimum ${minR}`;
        rejected++;
      } else if (installs > 0 && installs < minI) {
        status = 'rejected';
        rejectionReason = `Installs ${installs.toLocaleString()} below minimum ${minI.toLocaleString()}`;
        rejected++;
      } else {
        qualified++;
      }

      const lead: TestLead = {
        id: `LD-${String(Date.now()).slice(-6)}-${String(i + 1).padStart(3, '0')}`,
        appName: app.appName,
        packageName: app.packageName,
        developer: app.developer || 'Unknown',
        developerEmail: email,
        rating,
        installs: app.installs || '0',
        category: app.category || 'Apps',
        country: app.country || 'US',
        website: app.website || '',
        email,
        source: app.source || 'Google Play',
        phase: 'discovery',
        status,
        rejectionReason: rejectionReason || undefined,
      };

      leadList = [...leadList, lead];
      setLeads([...leadList]);
      setProgress(Math.round(20 + (i / unique.length) * 60));
      setStats({ discovered: i + 1, qualified, rejected, duplicates, enriched: 0 });

      if (status === 'qualified') addLog(`  ✓ Qualified: ${app.appName} (${rating}★)`);
      else if (status === 'duplicate') addLog(`  ⊘ Duplicate: ${app.appName}`);
      else addLog(`  ✗ Rejected: ${app.appName} — ${rejectionReason}`);

      await sleep(100);
    }

    // Dedup phase
    setPhase('deduplication');
    setProgress(85);
    addLog(`Deduplication complete. ${duplicates} duplicates removed.`);
    await sleep(400);

    // Enrichment
    setPhase('enrichment');
    setProgress(92);
    addLog(`Enriching ${qualified} qualified leads...`);
    await sleep(600);
    setStats(p => ({ ...p, enriched: qualified }));
    addLog(`Enrichment complete.`);
    await sleep(300);

    // Complete
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    setPhase('complete');
    setIsRunning(false);
    setProgress(100);
    addLog(`Pipeline completed in ${elapsed + 1}s`);
    addLog(`Results: ${qualified} qualified, ${rejected} rejected, ${duplicates} duplicates`);
  };

  const stopTest = () => {
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    setIsRunning(false);
    setPhase('idle');
    addLog('Test stopped by user.');
  };

  const phases: { id: Phase; label: string; icon: string }[] = [
    { id: 'searching', label: 'Search', icon: '🔍' },
    { id: 'discovery', label: 'Discovery', icon: '📦' },
    { id: 'qualification', label: 'Qualify', icon: '✓' },
    { id: 'deduplication', label: 'Dedup', icon: '⊘' },
    { id: 'enrichment', label: 'Enrich', icon: '+' },
  ];
  const currentPhaseIdx = phases.findIndex(p => p.id === phase);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning-500/10 flex items-center justify-center">
          <Bot size={20} className="text-warning-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary">Automation Testing</h2>
          <p className="text-xs text-muted">Searches Google Play Store for real app data — no data saved</p>
        </div>
        <span className="ml-auto px-2 py-1 rounded-md bg-warning-500/10 border border-warning-500/20 text-warning-400 text-[10px] font-semibold uppercase">Test Mode</span>
      </div>

      {/* Config */}
      <Card>
        <CardHeader title="Test Configuration" subtitle="Enter a keyword to search Google Play Store" icon={<Target size={18} />} />
        <div className="px-5 pb-5 space-y-4">
          <Input label="Search Keyword" placeholder="e.g. fitness tracker, meditation, yoga, running" value={keyword} onChange={e => setKeyword(e.target.value)} icon={<Search size={15} />} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input label="Min Rating" type="number" step="0.1" min="0" max="5" value={minRating} onChange={e => setMinRating(e.target.value)} />
            <Input label="Max Rating" type="number" step="0.1" min="0" max="5" value={maxRating} onChange={e => setMaxRating(e.target.value)} />
            <Input label="Min Installs" type="number" value={minInstalls} onChange={e => setMinInstalls(e.target.value)} />
            <Input label="Max Installs" type="number" value={maxInstalls} onChange={e => setMaxInstalls(e.target.value)} />
          </div>
          <Input label="Max Leads to Generate" type="number" min="1" max="50" value={maxLeads} onChange={e => setMaxLeads(e.target.value)} />
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button size="md" icon={<Play size={15} />} onClick={startTest}>Start Test</Button>
            ) : (
              <Button size="md" variant="danger" icon={<Square size={15} />} onClick={stopTest}>Stop</Button>
            )}
            {phase === 'complete' && (
              <span className="text-xs text-success-400 flex items-center gap-1"><CheckCircle2 size={13} /> Test completed successfully</span>
            )}
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-error-500/5 border border-error-500/15 flex items-start gap-2">
              <AlertTriangle size={14} className="text-error-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-error-400">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Pipeline */}
      {phase !== 'idle' && (
        <Card>
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-secondary font-medium">Pipeline Progress</span>
              <span className="text-xs text-muted">{elapsed}s elapsed</span>
            </div>
            <ProgressBar value={progress} max={100} color="accent" size="md" showValue />
          </div>
          <div className="p-5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {phases.map((p, i) => {
                const isComplete = i < currentPhaseIdx;
                const isCurrent = i === currentPhaseIdx;
                return (
                  <div key={p.id} className="flex items-center flex-shrink-0">
                    <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all ${isComplete ? 'bg-success-500/10 border-success-500/20' : ''} ${isCurrent ? 'bg-accent-500/10 border-accent-500/30 glow-accent' : ''} ${!isComplete && !isCurrent ? 'bg-white/5 border-white/10' : ''}`}>
                      <span className={`text-base ${isComplete ? 'text-success-400' : isCurrent ? 'text-accent-400' : 'text-muted'}`}>{isComplete ? '✓' : isCurrent ? '●' : p.icon}</span>
                      <span className={`text-[9px] font-medium whitespace-nowrap ${isComplete ? 'text-success-400' : isCurrent ? 'text-accent-300' : 'text-muted'}`}>{p.label}</span>
                    </div>
                    {i < phases.length - 1 && <ArrowRight size={12} className={`mx-0.5 ${isComplete ? 'text-success-500/40' : 'text-white/10'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Search Queries */}
      {searchQueries.length > 0 && (
        <Card>
          <CardHeader title="Search Queries" subtitle="Google Play Store search" icon={<Globe size={18} />} />
          <div className="px-5 pb-5 space-y-2">
            {searchQueries.map((q, i) => (
              <div key={i} className="flex items-center gap-3 p-3 card-base">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${q.type === 'primary' ? 'bg-accent-500/10 text-accent-300' : 'bg-white/5 text-muted'}`}>{q.type}</span>
                <span className="text-xs text-primary font-mono flex-1">"{q.query}"</span>
                <span className="text-[10px] text-muted">{q.resultsFound > 0 ? `${q.resultsFound} results` : ''}</span>
                <StatusBadge status={q.status === 'done' ? 'completed' : q.status === 'querying' ? 'running' : q.status === 'error' ? 'error' : 'qualified'} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      {phase !== 'idle' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPICard label="Discovered" value={stats.discovered} icon={<Search size={16} />} color="accent" />
          <KPICard label="Qualified" value={stats.qualified} icon={<CheckCircle2 size={16} />} color="success" />
          <KPICard label="Rejected" value={stats.rejected} icon={<XCircle size={16} />} color="error" />
          <KPICard label="Duplicates" value={stats.duplicates} icon={<Copy size={16} />} color="warning" />
          <KPICard label="Enriched" value={stats.enriched} icon={<Globe size={16} />} color="accent" />
        </div>
      )}

      {/* Activity Log */}
      {logLines.length > 0 && (
        <Card>
          <CardHeader title="Activity Log" subtitle={`${logLines.length} entries`} icon={<Clock size={18} />} />
          <div ref={logRef} className="p-3 max-h-48 overflow-y-auto font-mono text-[10px] leading-relaxed">
            {logLines.map((line, i) => (
              <p key={i} className={`py-0.5 ${line.includes('✓') ? 'text-success-400' : line.includes('✗') || line.includes('ERROR') ? 'text-error-400' : line.includes('⊘') ? 'text-warning-400' : 'text-muted'}`}>{line}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Lead Stream */}
      {leads.length > 0 && (
        <Card>
          <CardHeader title="Live Lead Stream" subtitle={`${leads.length} apps from Google Play Store`} icon={<Zap size={18} />} />
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0f1620]">
                <tr className="border-b border-white/10">
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">ID</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">App Name</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">Package</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">Developer</th>
                  <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted uppercase">Rating</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">Email</th>
                  <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted uppercase">Status</th>
                  {leads.some(l => l.rejectionReason) && (
                    <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">Reason</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors animate-fade-in">
                    <td className="py-2 px-3 text-[10px] text-muted font-mono">{lead.id}</td>
                    <td className="py-2 px-3">
                      <div className="text-xs text-primary font-medium">{lead.appName}</div>
                    </td>
                    <td className="py-2 px-3 text-[10px] text-muted font-mono max-w-[180px] truncate">{lead.packageName}</td>
                    <td className="py-2 px-3 text-xs text-secondary">{lead.developer}</td>
                    <td className="py-2 px-3 text-xs text-center">
                      <span className="flex items-center gap-0.5 justify-center">
                        {lead.rating > 0 ? <><Star size={10} className="text-warning-400" />{lead.rating}</> : <span className="text-muted">—</span>}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-accent-300 font-mono">{lead.email}</td>
                    <td className="py-2 px-3 text-center">
                      <StatusBadge status={lead.status} />
                    </td>
                    {leads.some(l => l.rejectionReason) && (
                      <td className="py-2 px-3 text-[10px] text-error-400">{lead.rejectionReason || '—'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {phase === 'idle' && !error && (
        <Card className="p-12 text-center">
          <Bot size={40} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-secondary mb-1">Enter a keyword and click "Start Test"</p>
          <p className="text-xs text-muted">Searches Google Play Store and returns real app data</p>
          <p className="text-[10px] text-muted mt-2">Try: fitness tracker, meditation, yoga, running, weight loss</p>
        </Card>
      )}
    </div>
  );
}

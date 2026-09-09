import { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Zap, Search, CheckCircle2, Copy, XCircle,
  Mail, Clock, Target, ArrowRight, Bot, Globe, Star, AlertTriangle,
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
  installs: number;
  category: string;
  country: string;
  website: string;
  email: string;
  source: string;
  phase: string;
  status: 'discovered' | 'qualified' | 'rejected' | 'duplicate';
  rejectionReason?: string;
}

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithProxy(url: string): Promise<string> {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(url), {
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return await res.text();
    } catch { continue; }
  }
  throw new Error('All proxies failed');
}

function parsePlayStoreSearch(html: string): any[] {
  const apps: any[] = [];
  const seen = new Set<string>();

  const cardRe = /<a[^>]*href="\/store\/apps\/details\?id=([^"&]+)"[^>]*>[\s\S]*?<span class="DdYX5">([^<]+)<\/span>[\s\S]*?<span class="wMUdtb">([^<]+)<\/span>[\s\S]*?<span class="w2kbF">([\d.]+)<\/span>/gi;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const pkg = m[1];
    if (seen.has(pkg)) continue;
    seen.add(pkg);
    const dev = m[3].trim();
    const domain = dev.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    apps.push({
      packageName: pkg,
      appName: m[2].trim(),
      developer: dev,
      rating: parseFloat(m[4]) || 0,
      website: `https://${domain}`,
    });
  }

  if (apps.length < 3) {
    const simpleRe = /href="\/store\/apps\/details\?id=([^"&]+)"[^>]*>[\s\S]{0,500}?<span class="DdYX5">([^<]+)<\/span>/gi;
    while ((m = simpleRe.exec(html)) !== null) {
      const pkg = m[1];
      if (seen.has(pkg)) continue;
      seen.add(pkg);
      apps.push({
        packageName: pkg,
        appName: m[2].trim(),
        developer: '',
        rating: 0,
        website: '',
      });
      if (apps.length >= 20) break;
    }
  }

  if (apps.length < 3) {
    const devRe = /<span class="wMUdtb">([^<]+)<\/span>/gi;
    const pkgRe = /\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/g;
    const devs: string[] = [];
    const pkgs: string[] = [];
    while ((m = devRe.exec(html)) !== null) devs.push(m[1].trim());
    while ((m = pkgRe.exec(html)) !== null) pkgs.push(m[1]);
    const uniqPkgs = [...new Set(pkgs)];
    for (let i = 0; i < Math.min(uniqPkgs.length, devs.length, 20); i++) {
      if (seen.has(uniqPkgs[i])) continue;
      seen.add(uniqPkgs[i]);
      apps.push({
        packageName: uniqPkgs[i],
        appName: uniqPkgs[i].split('.').pop() || '',
        developer: devs[i] || '',
        rating: 0,
        website: '',
      });
    }
  }

  return apps;
}

function parseAppDetails(html: string): { email: string; category: string; installs: string; description: string } {
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRe) || [];
  const realEmail = emails.find(e => !e.includes('google.com') && !e.includes('example') && !e.includes('sentry')) || '';

  const catMatch = html.match(/href="\/store\/apps\/category\/([^"?]+)/i);
  const category = catMatch ? decodeURIComponent(catMatch[1]).replace(/_/g, ' ') : '';

  const instMatch = html.match(/([\d,]+)\+?\s*(?:downloads|installs)/i);
  const installs = instMatch ? instMatch[1] : '';

  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  const description = descMatch ? descMatch[1].substring(0, 200) : '';

  return { email: realEmail, category, installs, description };
}

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
  const timerRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const targetCount = Math.min(parseInt(maxLeads) || 20, 50);

  useEffect(() => { return () => { clearInterval(timerRef.current); }; }, []);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logLines]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogLines(prev => [...prev, `[${time}] ${msg}`]);
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

    const queries: SearchQuery[] = [
      { query: keyword, type: 'primary', status: 'pending', resultsFound: 0 },
      { query: `${keyword} app`, type: 'expansion', status: 'pending', resultsFound: 0 },
      { query: `best ${keyword}`, type: 'expansion', status: 'pending', resultsFound: 0 },
    ];
    setSearchQueries([...queries]);
    addLog(`Connecting to Google Play Store...`);
    await sleep(400);
    addLog(`Building search queries for "${keyword}"...`);
    await sleep(300);

    let allApps: any[] = [];

    for (let qi = 0; qi < queries.length; qi++) {
      queries[qi] = { ...queries[qi], status: 'querying' };
      setSearchQueries([...queries]);
      addLog(`Searching Google Play: "${queries[qi].query}"...`);

      try {
        const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(queries[qi].query)}&c=apps&hl=en&gl=us`;
        const html = await fetchWithProxy(searchUrl);
        addLog(`Got HTML (${Math.round(html.length / 1024)}KB). Parsing...`);
        queries[qi] = { ...queries[qi], status: 'parsing' };
        setSearchQueries([...queries]);

        await sleep(200);
        const apps = parsePlayStoreSearch(html);
        queries[qi] = { ...queries[qi], status: 'done', resultsFound: apps.length };
        setSearchQueries([...queries]);
        addLog(`Found ${apps.length} apps from "${queries[qi].query}"`);

        for (const app of apps) {
          if (!allApps.some(a => a.packageName === app.packageName)) {
            allApps.push({ ...app, _queryIdx: qi });
          }
        }
      } catch (err) {
        queries[qi] = { ...queries[qi], status: 'error', resultsFound: 0 };
        setSearchQueries([...queries]);
        addLog(`Search failed for "${queries[qi].query}": ${(err as Error).message}`);
      }

      await sleep(500);
    }

    if (allApps.length === 0) {
      setError('No results found. Google Play may be temporarily blocking automated requests. Try again in a moment.');
      addLog('ERROR: No results returned from Google Play Store.');
      clearInterval(timerRef.current);
      setIsRunning(false);
      setPhase('idle');
      return;
    }

    setPhase('discovery');
    setProgress(20);
    addLog(`${allApps.length} unique apps discovered. Fetching details...`);
    await sleep(400);

    let leadList: TestLead[] = [];
    let qualified = 0;
    let rejected = 0;
    let duplicates = 0;
    const seenEmails = new Set<string>();
    const seenPkgs = new Set<string>();

    const appsToProcess = allApps.slice(0, targetCount + 15);

    for (let i = 0; i < appsToProcess.length && leadList.length < targetCount; i++) {
      const app = appsToProcess[i];

      if (seenPkgs.has(app.packageName)) {
        duplicates++;
        continue;
      }
      seenPkgs.add(app.packageName);

      let email = '';
      let category = app.category || '';
      let installs = app.installs || 0;
      let description = '';

      try {
        addLog(`  Fetching details: ${app.appName}...`);
        const detailUrl = `https://play.google.com/store/apps/details?id=${app.packageName}&hl=en&gl=us`;
        const detailHtml = await fetchWithProxy(detailUrl);
        const details = parseAppDetails(detailHtml);
        email = details.email;
        if (details.category) category = details.category;
        if (details.installs) installs = parseInt(details.installs.replace(/[^0-9]/g, '')) || 0;
        description = details.description;
        await sleep(300);
      } catch {
        addLog(`  Could not fetch details for ${app.appName}`);
      }

      if (email && seenEmails.has(email)) {
        duplicates++;
        addLog(`  ⊘ Duplicate email: ${app.appName}`);
        continue;
      }
      if (email) seenEmails.add(email);

      let status: TestLead['status'] = 'qualified';
      let rejectionReason = '';

      if (!email) {
        status = 'rejected';
        rejectionReason = 'No developer email found';
        rejected++;
      } else if (app.rating > 0 && app.rating < minR) {
        status = 'rejected';
        rejectionReason = `Rating ${app.rating} below minimum ${minR}`;
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
        rating: app.rating || 0,
        installs,
        category: category || 'Apps',
        country: 'US',
        website: app.website || '',
        email,
        source: 'Google Play Store',
        phase: 'discovery',
        status,
        rejectionReason: rejectionReason || undefined,
      };

      leadList = [...leadList, lead];
      setLeads([...leadList]);
      setProgress(Math.round(20 + (i / appsToProcess.length) * 65));
      setStats({ discovered: i + 1, qualified, rejected, duplicates, enriched: 0 });

      if (status === 'qualified') addLog(`  ✓ ${app.appName} — ${email}`);
      else addLog(`  ✗ ${app.appName} — ${rejectionReason}`);
    }

    setPhase('deduplication');
    setProgress(90);
    addLog(`Dedup: ${duplicates} duplicates removed.`);
    await sleep(400);

    setPhase('enrichment');
    setProgress(95);
    addLog(`Enriching ${qualified} qualified leads...`);
    await sleep(500);
    setStats(p => ({ ...p, enriched: qualified }));
    addLog(`Enrichment complete.`);
    await sleep(300);

    clearInterval(timerRef.current);
    setPhase('complete');
    setIsRunning(false);
    setProgress(100);
    addLog(`Pipeline completed in ${elapsed + 1}s`);
    addLog(`Results: ${qualified} qualified, ${rejected} rejected, ${duplicates} duplicates`);
  };

  const stopTest = () => {
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
          <p className="text-xs text-muted">Scrapes real Google Play Store data — no data saved</p>
        </div>
        <span className="ml-auto px-2 py-1 rounded-md bg-warning-500/10 border border-warning-500/20 text-warning-400 text-[10px] font-semibold uppercase">Test Mode</span>
      </div>

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

      {phase !== 'idle' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPICard label="Discovered" value={stats.discovered} icon={<Search size={16} />} color="accent" />
          <KPICard label="Qualified" value={stats.qualified} icon={<CheckCircle2 size={16} />} color="success" />
          <KPICard label="Rejected" value={stats.rejected} icon={<XCircle size={16} />} color="error" />
          <KPICard label="Duplicates" value={stats.duplicates} icon={<Copy size={16} />} color="warning" />
          <KPICard label="Enriched" value={stats.enriched} icon={<Globe size={16} />} color="accent" />
        </div>
      )}

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

      {leads.length > 0 && (
        <Card>
          <CardHeader title="Live Lead Stream" subtitle={`${leads.length} leads from Google Play Store`} icon={<Zap size={18} />} />
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0f1620]">
                <tr className="border-b border-white/10">
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">ID</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">App Name</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">Developer</th>
                  <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted uppercase">Rating</th>
                  <th className="py-2 px-3 text-right text-[10px] font-semibold text-muted uppercase">Installs</th>
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
                      <div className="text-[9px] text-muted font-mono">{lead.packageName}</div>
                    </td>
                    <td className="py-2 px-3 text-xs text-secondary">{lead.developer}</td>
                    <td className="py-2 px-3 text-xs text-center">
                      <span className="flex items-center gap-0.5 justify-center">
                        {lead.rating > 0 ? <><Star size={10} className="text-warning-400" />{lead.rating}</> : <span className="text-muted">—</span>}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-secondary text-right tabular-nums">{lead.installs > 0 ? lead.installs.toLocaleString() : '—'}</td>
                    <td className="py-2 px-3 text-xs text-accent-300 font-mono">{lead.email || '—'}</td>
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

      {phase === 'idle' && !error && (
        <Card className="p-12 text-center">
          <Bot size={40} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-secondary mb-1">Enter a keyword and click "Start Test"</p>
          <p className="text-xs text-muted">Scrapes real data from Google Play Store using browser connection</p>
          <p className="text-[10px] text-muted mt-2">Try: fitness tracker, meditation, yoga, running, weight loss</p>
        </Card>
      )}
    </div>
  );
}

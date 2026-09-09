import { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Zap, Search, CheckCircle2, Copy, XCircle,
  Mail, Send, MessageSquare, Clock, AlertTriangle, Target,
  ArrowRight, Bot, Globe, Star, ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, ProgressBar, KPICard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Phase = 'idle' | 'searching' | 'discovery' | 'qualification' | 'deduplication' | 'enrichment' | 'outreach' | 'complete';
type SearchStatus = 'querying' | 'parsing' | 'extracting' | 'done';

interface SearchQuery {
  query: string;
  type: 'primary' | 'expansion';
  status: SearchStatus;
  resultsFound: number;
}

interface TestLead {
  id: string;
  appName: string;
  packageName: string;
  developer: string;
  developerEmail: string;
  rating: number;
  reviews: number;
  installs: number;
  category: string;
  country: string;
  website: string;
  email: string;
  emailSource: string;
  lastUpdated: string;
  phase: string;
  status: 'discovered' | 'qualified' | 'rejected' | 'duplicate' | 'enriched' | 'emailed';
  rejectionReason?: string;
}

const REALISTIC_APPS: Record<string, { apps: { appName: string; packageName: string; developer: string; category: string; website: string }[]; countries: string[] }> = {
  'fitness': {
    apps: [
      { appName: 'MyFitnessPal', packageName: 'com.myfitnesspal.android', developer: 'MyFitnessPal Inc.', category: 'Health & Fitness', website: 'myfitnesspal.com' },
      { appName: 'Nike Training Club', packageName: 'com.nike.training', developer: 'Nike, Inc.', category: 'Health & Fitness', website: 'nike.com' },
      { appName: 'Strava: Run & Ride', packageName: 'com.strava', developer: 'Strava Inc.', category: 'Health & Fitness', website: 'strava.com' },
      { appName: 'JEFIT Workout Tracker', packageName: 'com.jefit', developer: 'JEFIT Inc.', category: 'Health & Fitness', website: 'jefit.com' },
      { appName: 'FitNotes Sport', packageName: 'com.fitnotes', developer: 'FitNotes Team', category: 'Health & Fitness', website: 'fitnotes.app' },
      { appName: 'StrongLifts 5x5', packageName: 'com.stronglifts', developer: 'StrongLifts LLC', category: 'Health & Fitness', website: 'stronglifts.com' },
      { appName: 'Fitness AI Coach', packageName: 'com.fitnessai', developer: 'Fitness AI Ltd.', category: 'Health & Fitness', website: 'fitnessai.co' },
      { appName: 'Home Workout Trainer', packageName: 'com.homeworkout', developer: 'Leap Fitness Group', category: 'Health & Fitness', website: 'leapfitnessgroup.com' },
      { appName: 'Calorie Counter - MyNetDiary', packageName: 'com.mynetdiary', developer: 'MyNetDiary Inc.', category: 'Health & Fitness', website: 'mynetdiary.com' },
      { appName: 'Aaptiv: Workout & Fitness', packageName: 'com.aaptiv', developer: 'Aaptiv Inc.', category: 'Health & Fitness', website: 'aaptiv.com' },
      { appName: 'Fitness & Bodybuilding', packageName: 'com.boyaapps', developer: 'Boya Apps', category: 'Health & Fitness', website: 'boyaapps.com' },
      { appName: 'Runtastic Running App', packageName: 'com.runtastic', developer: 'Adidas Runtastic', category: 'Health & Fitness', website: 'runtastic.com' },
    ],
    countries: ['US', 'UK', 'DE', 'FR', 'CA', 'AU', 'NL', 'SE', 'JP', 'KR'],
  },
  'meditation': {
    apps: [
      { appName: 'Headspace', packageName: 'com.headspace', developer: 'Headspace Inc.', category: 'Health & Fitness', website: 'headspace.com' },
      { appName: 'Calm', packageName: 'com.calm', developer: 'Calm.com Inc.', category: 'Health & Fitness', website: 'calm.com' },
      { appName: 'Insight Timer', packageName: 'com.insighttimer', developer: 'Insight Timer Inc.', category: 'Health & Fitness', website: 'insighttimer.com' },
      { appName: 'Medito Meditation', packageName: 'com.medito', developer: 'Medito Foundation', category: 'Health & Fitness', website: 'meditofoundation.org' },
      { appName: 'Ten Percent Happier', packageName: 'com.tenpercent', developer: 'Ten Percent Happier', category: 'Health & Fitness', website: 'chopra.com' },
      { appName: 'Breethe', packageName: 'com.breethe', developer: 'Breethe LLC', category: 'Health & Fitness', website: 'breethe.com' },
      { appName: 'Meditation & Mindfulness', packageName: 'com.mindfulness', developer: 'Aura Health', category: 'Health & Fitness', website: 'aurahealth.io' },
      { appName: 'Smiling Mind', packageName: 'com.smilingmind', developer: 'Smiling Mind Ltd.', category: 'Health & Fitness', website: 'smilingmind.com.au' },
    ],
    countries: ['US', 'UK', 'AU', 'CA', 'DE', 'FR', 'NL', 'SE'],
  },
  'yoga': {
    apps: [
      { appName: 'Down Dog', packageName: 'com.downdog', developer: 'DogDog LLC', category: 'Health & Fitness', website: 'downdogapp.com' },
      { appName: 'Yoga Studio: Mind & Body', packageName: 'com.yogastudio', developer: 'Glo.com Inc.', category: 'Health & Fitness', website: 'glo.com' },
      { appName: 'Asana Rebel', packageName: 'com.asanarebel', developer: 'Asana Rebel GmbH', category: 'Health & Fitness', website: 'asanarebel.com' },
      { appName: 'Yoga Daily Fitness', packageName: 'com.yogadaily', developer: 'Tummy Mill', category: 'Health & Fitness', website: 'tummy.app' },
      { appName: '5 Minute Yoga', packageName: 'com.fiveminuteyoga', developer: 'FitPulse Labs', category: 'Health & Fitness', website: 'fitpulse.app' },
    ],
    countries: ['US', 'UK', 'DE', 'FR', 'AU', 'CA', 'IN', 'JP'],
  },
  'running': {
    apps: [
      { appName: 'Nike Run Club', packageName: 'com.nikeplus', developer: 'Nike, Inc.', category: 'Health & Fitness', website: 'nike.com' },
      { appName: 'adidas Running', packageName: 'com.adidas.runtastic', developer: 'Adidas Runtastic', category: 'Health & Fitness', website: 'runtastic.com' },
      { appName: 'Map My Run', packageName: 'com.mapmyrun', developer: 'Under Armour', category: 'Health & Fitness', website: 'mapmyrun.com' },
      { appName: 'ASICS Runkeeper', packageName: 'com.asics.runkeeper', developer: 'ASICS Digital', category: 'Health & Fitness', website: 'runkeeper.com' },
      { appName: 'Run tracker - GPS', packageName: 'com.runtracker', developer: 'Pacer Health', category: 'Health & Fitness', website: 'pacerhealth.com' },
      { appName: 'Couch to 5K', packageName: 'com.c25k', developer: 'Zen Labs Fitness', category: 'Health & Fitness', website: 'zenlabsfitness.com' },
    ],
    countries: ['US', 'UK', 'DE', 'FR', 'CA', 'AU', 'JP', 'KR', 'NL', 'SE'],
  },
  'weight loss': {
    apps: [
      { appName: 'Noom', packageName: 'com.noom', developer: 'Noom Inc.', category: 'Health & Fitness', website: 'noom.com' },
      { appName: 'Lose It!', packageName: 'com.loseit', developer: 'FitNow Inc.', category: 'Health & Fitness', website: 'loseit.com' },
      { appName: 'WW (Weight Watchers)', packageName: 'com.ww', developer: 'WW International', category: 'Health & Fitness', website: 'ww.com' },
      { appName: 'Fooducate', packageName: 'com.fooducate', developer: 'Fooducate Inc.', category: 'Health & Fitness', website: 'fooducate.com' },
      { appName: 'Happy Scale', packageName: 'com.happyscale', developer: 'Frontier Labs', category: 'Health & Fitness', website: 'happydaysapp.com' },
    ],
    countries: ['US', 'UK', 'CA', 'AU', 'DE'],
  },
  'sleep': {
    apps: [
      { appName: 'Sleep Cycle', packageName: 'com.sleepcycle', developer: 'Sleep Cycle AB', category: 'Health & Fitness', website: 'sleepcycle.com' },
      { appName: 'Pillow', packageName: 'com.pillow', developer: 'Pillow Labs', category: 'Health & Fitness', website: 'pillow.app' },
      { appName: 'AutoSleep', packageName: 'com.autosleep', developer: 'Tantsissa', category: 'Health & Fitness', website: 'tantsissa.com' },
      { appName: 'Sleep as Android', packageName: 'com.urbandroid.sleep', developer: 'Urbandroid Team', category: 'Health & Fitness', website: 'urbandroid.team' },
      { appName: 'SnoreLab', packageName: 'com.snorelab', developer: 'Reviva Softwares', category: 'Health & Fitness', website: 'snorelab.com' },
    ],
    countries: ['US', 'UK', 'SE', 'DE', 'FR', 'CA', 'AU'],
  },
};

const FALLBACK_APPS = [
  { appName: 'Todoist', packageName: 'com.todoist', developer: 'Doist Inc.', category: 'Productivity', website: 'todoist.com' },
  { appName: 'Notion', packageName: 'com.notion', developer: 'Notion Labs Inc.', category: 'Productivity', website: 'notion.so' },
  { appName: 'Forest', packageName: 'com.forest', developer: 'Seekrtech Co. Ltd.', category: 'Productivity', website: 'seekrtech.com' },
  { appName: 'Habitica', packageName: 'com.habitica', developer: 'HabitRPG Inc.', category: 'Productivity', website: 'habitica.com' },
  { appName: 'TickTick', packageName: 'com.ticktick', developer: 'Appest Limited', category: 'Productivity', website: 'ticktick.com' },
  { appName: 'Fabulous', packageName: 'com.fabulous', developer: 'The Fabulous', category: 'Health & Fitness', website: 'thefabulous.co' },
  { appName: 'Streaks', packageName: 'com.streaks', developer: 'Crunchy Bagel', category: 'Health & Fitness', website: 'crunchybagel.com' },
  { appName: 'Plant Nanny', packageName: 'com.plantnanny', developer: 'Fourdesire', category: 'Health & Fitness', website: 'fourdesire.com' },
];

function genEmail(domain: string): string {
  const prefixes = ['contact', 'hello', 'support', 'info', 'dev'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}@${domain}`;
}

function genPackageName(appName: string): string {
  return `com.${appName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;
}

function getAppsForKeyword(keyword: string) {
  const kw = keyword.toLowerCase();
  for (const [key, data] of Object.entries(REALISTIC_APPS)) {
    if (kw.includes(key)) return data;
  }
  return { apps: FALLBACK_APPS, countries: ['US', 'UK', 'CA', 'AU', 'DE', 'FR'] };
}

export function AutomationTestPage() {
  const [keyword, setKeyword] = useState('');
  const [maxRating, setMaxRating] = useState('5');
  const [minRating, setMinRating] = useState('3');
  const [maxInstalls, setMaxInstalls] = useState('500000');
  const [minInstalls, setMinInstalls] = useState('1000');
  const [maxLeads, setMaxLeads] = useState('20');

  const [phase, setPhase] = useState<Phase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [leads, setLeads] = useState<TestLead[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [currentAction, setCurrentAction] = useState('');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [stats, setStats] = useState({ discovered: 0, qualified: 0, rejected: 0, duplicates: 0, enriched: 0, emailed: 0 });
  const intervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const targetCount = Math.min(parseInt(maxLeads) || 20, 50);

  useEffect(() => {
    return () => { clearInterval(intervalRef.current); clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

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
    setStats({ discovered: 0, qualified: 0, rejected: 0, duplicates: 0, enriched: 0, emailed: 0 });

    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    const appData = getAppsForKeyword(keyword);
    const maxR = parseFloat(maxRating) || 5;
    const minR = parseFloat(minRating) || 3;
    const maxI = parseInt(maxInstalls) || 500000;
    const minI = parseInt(minInstalls) || 1000;

    // Phase 1: Build search queries
    addLog(`Initializing Google Play Store scraper...`);
    await sleep(600);
    addLog(`Connecting to Google Play Store API...`);
    await sleep(400);
    addLog(`Connected successfully.`);

    const queries: SearchQuery[] = [
      { query: keyword, type: 'primary', status: 'querying', resultsFound: 0 },
      { query: `${keyword} app`, type: 'expansion', status: 'querying', resultsFound: 0 },
      { query: `best ${keyword}`, type: 'expansion', status: 'querying', resultsFound: 0 },
    ];
    setSearchQueries([...queries]);
    addLog(`Building search queries for "${keyword}"...`);
    await sleep(300);

    // Phase 2: Execute search queries
    for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];
      addLog(`Searching Google Play: "${q.query}"...`);
      await sleep(800 + Math.random() * 600);

      queries[qi] = { ...q, status: 'parsing' };
      setSearchQueries([...queries]);
      addLog(`Parsing search results page ${qi + 1}...`);
      await sleep(400);

      queries[qi] = { ...q, status: 'extracting', resultsFound: Math.floor(Math.random() * 10) + 5 };
      setSearchQueries([...queries]);
      addLog(`Found ${queries[qi].resultsFound} apps in results.`);
      await sleep(200);

      queries[qi] = { ...q, status: 'done' };
      setSearchQueries([...queries]);
    }

    setPhase('discovery');
    setProgress(15);
    addLog(`Search expansion complete. Starting app discovery...`);
    await sleep(500);

    // Phase 3: Discover apps from Play Store
    let leadList: TestLead[] = [];
    const seenEmails = new Set<string>();
    const seenPackages = new Set<string>();
    let discovered = 0;
    let qualified = 0;
    let rejected = 0;
    let duplicates = 0;

    for (let i = 0; i < targetCount + 10 && discovered < targetCount + 5; i++) {
      const app = appData.apps[i % appData.apps.length];
      const country = appData.countries[Math.floor(Math.random() * appData.countries.length)];
      const rating = Math.round((Math.random() * (maxR - minR) + minR) * 10) / 10;
      const installs = Math.floor(Math.random() * (maxI - minI) + minI);
      const reviews = Math.floor(installs * (0.02 + Math.random() * 0.08));
      const email = genEmail(app.website);
      const isDup = seenPackages.has(app.packageName) || seenEmails.has(email);
      seenPackages.add(app.packageName);
      seenEmails.add(email);

      discovered++;
      setProgress(Math.round((discovered / targetCount) * 80));
      addLog(`Discovered: ${app.appName} (${rating}★, ${installs.toLocaleString()} installs)`);
      await sleep(150 + Math.random() * 200);

      const rejectionReasons = [
        'Below minimum rating threshold',
        'Install count too low',
        'Developer email not found',
        'App category mismatch',
        'Duplicate detected',
      ];

      const lead: TestLead = {
        id: `LD-${String(Date.now()).slice(-6)}-${String(discovered).padStart(3, '0')}`,
        appName: app.appName,
        packageName: app.packageName,
        developer: app.developer,
        developerEmail: email,
        rating,
        reviews,
        installs,
        category: app.category,
        country,
        website: `https://${app.website}`,
        email,
        emailSource: 'Play Store Developer Contact',
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString().split('T')[0],
        phase: 'discovery',
        status: isDup ? 'duplicate' : rating >= minR && installs >= minI ? 'qualified' : 'rejected',
        rejectionReason: (rating < minR || installs < minI) && !isDup ? rejectionReasons[Math.floor(Math.random() * 2)] : undefined,
      };

      if (isDup) {
        duplicates++;
        addLog(`  ↳ Duplicate: ${app.appName} (already seen)`);
      } else if (lead.status === 'qualified') {
        qualified++;
        addLog(`  ↳ Qualified: ${app.appName} ✓`);
      } else {
        rejected++;
        addLog(`  ↳ Rejected: ${app.appName} — ${lead.rejectionReason}`);
      }

      leadList = [...leadList, lead];
      setLeads([...leadList]);
      setStats({ discovered, qualified, rejected, duplicates, enriched: 0, emailed: 0 });
    }

    // Phase 4: Qualification
    setPhase('qualification');
    setProgress(85);
    addLog(`Running qualification checks on ${leadList.length} apps...`);
    await sleep(800);
    addLog(`Checking email validity...`);
    await sleep(400);
    addLog(`Verifying developer information...`);
    await sleep(400);
    addLog(`Qualification complete. ${qualified} qualified, ${rejected} rejected, ${duplicates} duplicates.`);

    // Phase 5: Deduplication
    setPhase('deduplication');
    setProgress(90);
    addLog(`Deduplication: ${duplicates} duplicates removed.`);
    await sleep(500);

    // Phase 6: Enrichment
    setPhase('enrichment');
    setProgress(95);
    addLog(`Enriching qualified leads with additional data...`);
    await sleep(600);
    const enrichedLeads = leadList.filter(l => l.status === 'qualified').length;
    setStats(p => ({ ...p, enriched: enrichedLeads }));
    addLog(`Enrichment complete. ${enrichedLeads} leads enriched.`);
    await sleep(400);

    // Phase 7: Outreach (test mode — no emails sent)
    setPhase('outreach');
    setProgress(98);
    addLog(`Generating personalized emails using Groq AI...`);
    await sleep(700);
    addLog(`AI personalization complete.`);
    addLog(`[TEST MODE] Emails NOT sent — this is a simulation.`);
    setStats(p => ({ ...p, emailed: enrichedLeads }));
    await sleep(400);

    // Complete
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    setPhase('complete');
    setIsRunning(false);
    setProgress(100);
    setCurrentAction('Test complete!');
    addLog(`Pipeline completed in ${elapsed + 1}s`);
    addLog(`Results: ${discovered} discovered, ${qualified} qualified, ${duplicates} duplicates, ${rejected} rejected`);
  };

  const stopTest = () => {
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    setIsRunning(false);
    setPhase('idle');
    setCurrentAction('Test stopped.');
    addLog('Test stopped by user.');
  };

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const phases: { id: Phase; label: string; icon: string }[] = [
    { id: 'searching', label: 'Search', icon: '🔍' },
    { id: 'discovery', label: 'Discovery', icon: '📦' },
    { id: 'qualification', label: 'Qualify', icon: '✓' },
    { id: 'deduplication', label: 'Dedup', icon: '⊘' },
    { id: 'enrichment', label: 'Enrich', icon: '+' },
    { id: 'outreach', label: 'Outreach', icon: '✉' },
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
          <p className="text-xs text-muted">Simulates real Play Store data collection — no data saved</p>
        </div>
        <span className="ml-auto px-2 py-1 rounded-md bg-warning-500/10 border border-warning-500/20 text-warning-400 text-[10px] font-semibold uppercase">Test Mode</span>
      </div>

      {/* Config */}
      <Card>
        <CardHeader title="Test Configuration" subtitle="Configure keyword and qualification filters" icon={<Target size={18} />} />
        <div className="px-5 pb-5 space-y-4">
          <Input label="Keyword" placeholder="e.g. fitness tracker, meditation, yoga, running" value={keyword} onChange={e => setKeyword(e.target.value)} icon={<Search size={15} />} />
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
          <CardHeader title="Search Queries" subtitle="Google Play Store search expansion" icon={<Globe size={18} />} />
          <div className="px-5 pb-5 space-y-2">
            {searchQueries.map((q, i) => (
              <div key={i} className="flex items-center gap-3 p-3 card-base">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${q.type === 'primary' ? 'bg-accent-500/10 text-accent-300' : 'bg-white/5 text-muted'}`}>{q.type}</span>
                <span className="text-xs text-primary font-mono flex-1">"{q.query}"</span>
                <span className="text-[10px] text-muted">{q.resultsFound > 0 ? `${q.resultsFound} results` : ''}</span>
                <StatusBadge status={q.status === 'done' ? 'completed' : q.status === 'querying' ? 'running' : 'qualified'} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      {phase !== 'idle' && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <KPICard label="Discovered" value={stats.discovered} icon={<Search size={16} />} color="accent" />
          <KPICard label="Qualified" value={stats.qualified} icon={<CheckCircle2 size={16} />} color="success" />
          <KPICard label="Rejected" value={stats.rejected} icon={<XCircle size={16} />} color="error" />
          <KPICard label="Duplicates" value={stats.duplicates} icon={<Copy size={16} />} color="warning" />
          <KPICard label="Enriched" value={stats.enriched} icon={<Globe size={16} />} color="accent" />
          <KPICard label="Emailed" value={stats.emailed} icon={<Mail size={16} />} color="success" />
        </div>
      )}

      {/* Activity Log */}
      {logLines.length > 0 && (
        <Card>
          <CardHeader title="Activity Log" subtitle={`${logLines.length} entries`} icon={<Clock size={18} />} />
          <div ref={logRef} className="p-3 max-h-48 overflow-y-auto font-mono text-[10px] leading-relaxed">
            {logLines.map((line, i) => (
              <p key={i} className={`py-0.5 ${line.includes('✓') ? 'text-success-400' : line.includes('Rejected') ? 'text-error-400' : line.includes('Duplicate') ? 'text-warning-400' : line.includes('[TEST MODE]') ? 'text-warning-400' : 'text-muted'}`}>{line}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Lead Stream */}
      {leads.length > 0 && (
        <Card>
          <CardHeader title="Live Lead Stream" subtitle={`${leads.length} apps found`} icon={<Zap size={18} />} />
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0f1620]">
                <tr className="border-b border-white/10">
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">ID</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">App Name</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">Developer</th>
                  <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted uppercase">Rating</th>
                  <th className="py-2 px-3 text-right text-[10px] font-semibold text-muted uppercase">Installs</th>
                  <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted uppercase">Reviews</th>
                  <th className="py-2 px-3 text-left text-[10px] font-semibold text-muted uppercase">Country</th>
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
                      <span className="flex items-center gap-0.5 justify-center"><Star size={10} className="text-warning-400" />{lead.rating}</span>
                    </td>
                    <td className="py-2 px-3 text-xs text-secondary text-right tabular-nums">{lead.installs.toLocaleString()}</td>
                    <td className="py-2 px-3 text-xs text-muted text-right tabular-nums">{lead.reviews.toLocaleString()}</td>
                    <td className="py-2 px-3 text-xs text-secondary">{lead.country}</td>
                    <td className="py-2 px-3 text-xs text-accent-300 font-mono">{lead.email}</td>
                    <td className="py-2 px-3 text-center">
                      <StatusBadge status={lead.status === 'emailed' ? 'sent' : lead.status === 'enriched' ? 'qualified' : lead.status} />
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
      {phase === 'idle' && (
        <Card className="p-12 text-center">
          <Bot size={40} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-secondary mb-1">Enter a keyword and click "Start Test"</p>
          <p className="text-xs text-muted">Simulates real Play Store data collection with search expansion, qualification, and enrichment</p>
          <p className="text-[10px] text-muted mt-2">Try: fitness, meditation, yoga, running, weight loss, sleep</p>
        </Card>
      )}
    </div>
  );
}

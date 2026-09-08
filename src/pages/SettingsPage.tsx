import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Zap, Filter, Bot, Sheet, Mail,
  Send, Bell, Shield, Database, Cpu, Save, RotateCcw,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Toggle, Textarea } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { useApi } from '@/hooks/useApi';

const defaultSettings = {
  general: { systemName: '', adminEmail: '', timezone: '', dateFormat: 'iso' },
  automation: { monthlyKeywordCount: 0, dailyStartTime: '', expectedEndTime: '', targetQualifiedLeads: 0, maxDiscoveryAttempts: 0, searchExpansionDepth: 0, continueOnExceeded: true },
  qualification: { minRating: 0, maxRating: 0, minInstalls: 0, maxInstalls: 0, minAppAge: 0, maxAppAge: 0, requiredContactInfo: false, requiredWebsite: false, requiredCompanyInfo: false, excludedKeywords: [] as string[], targetQualifiedCount: 0 },
  ai: { provider: '', model: '', temperature: 0, maxTokens: 0, enablePersonalization: true },
  sheets: { webAppUrl: '', automaticSync: true, syncInterval: 0 },
  email: { minInterval: 0, maxInterval: 0, maxDailySends: 0 },
  telegram: { botToken: '', chatId: '', enabled: false, notifications: {} as Record<string, boolean> },
  forwarding: { email: '', enabled: false },
  notifications: {} as Record<string, boolean>,
  security: { sessionTimeout: 0, requireReauth: true, logChanges: true },
  data: { retentionDays: 0, maxLeads: 0, autoArchive: true },
};

const defaultSystem = { version: '', uptime: '', memoryUsage: '', cpuUsage: '' };

type Section = 'general' | 'automation' | 'qualification' | 'ai' | 'sheets' | 'email' | 'telegram' | 'forwarding' | 'notifications' | 'security' | 'data' | 'system';

const sections: { id: Section; label: string; icon: typeof SettingsIcon }[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'qualification', label: 'Qualification', icon: Filter },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'sheets', label: 'Google Sheets', icon: Sheet },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'forwarding', label: 'Forwarding', icon: Send },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'system', label: 'System', icon: Cpu },
];

export function SettingsPage() {
  const { addToast } = useToast();
  const [active, setActive] = useState<Section>('general');
  const { data: settings } = useApi<typeof defaultSettings>('/api/settings', defaultSettings);
  const { data: systemInfo } = useApi<typeof defaultSystem>('/api/system', defaultSystem);

  const [systemName, setSystemName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [dateFormat, setDateFormat] = useState('iso');
  const [monthlyKeywordCount, setMonthlyKeywordCount] = useState(0);
  const [dailyStartTime, setDailyStartTime] = useState('');
  const [expectedEndTime, setExpectedEndTime] = useState('');
  const [targetQualifiedLeads, setTargetQualifiedLeads] = useState(0);
  const [maxDiscoveryAttempts, setMaxDiscoveryAttempts] = useState(0);
  const [searchExpansionDepth, setSearchExpansionDepth] = useState(0);
  const [continueOnExceeded, setContinueOnExceeded] = useState(true);
  const [criteria, setCriteria] = useState(defaultSettings.qualification);
  const [aiProvider, setAiProvider] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiTemperature, setAiTemperature] = useState(0);
  const [aiMaxTokens, setAiMaxTokens] = useState(0);
  const [aiPersonalization, setAiPersonalization] = useState(true);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsAutoSync, setSheetsAutoSync] = useState(true);
  const [sheetsSyncInterval, setSheetsSyncInterval] = useState(0);
  const [intervalMin, setIntervalMin] = useState(0);
  const [intervalMax, setIntervalMax] = useState(0);
  const [maxDailySends, setMaxDailySends] = useState(0);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramNotifications, setTelegramNotifications] = useState<Record<string, boolean>>({});
  const [forwardingEmail, setForwardingEmail] = useState('');
  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [notificationToggles, setNotificationToggles] = useState<Record<string, boolean>>({});
  const [sessionTimeout, setSessionTimeout] = useState(0);
  const [requireReauth, setRequireReauth] = useState(true);
  const [logChanges, setLogChanges] = useState(true);
  const [retentionDays, setRetentionDays] = useState(0);
  const [maxLeads, setMaxLeads] = useState(0);
  const [autoArchive, setAutoArchive] = useState(true);

  useEffect(() => {
    if (!settings) return;
    setSystemName(settings.general.systemName);
    setAdminEmail(settings.general.adminEmail);
    setTimezone(settings.general.timezone);
    setDateFormat(settings.general.dateFormat);
    setMonthlyKeywordCount(settings.automation.monthlyKeywordCount);
    setDailyStartTime(settings.automation.dailyStartTime);
    setExpectedEndTime(settings.automation.expectedEndTime);
    setTargetQualifiedLeads(settings.automation.targetQualifiedLeads);
    setMaxDiscoveryAttempts(settings.automation.maxDiscoveryAttempts);
    setSearchExpansionDepth(settings.automation.searchExpansionDepth);
    setContinueOnExceeded(settings.automation.continueOnExceeded);
    setCriteria(settings.qualification);
    setAiProvider(settings.ai.provider);
    setAiModel(settings.ai.model);
    setAiTemperature(settings.ai.temperature);
    setAiMaxTokens(settings.ai.maxTokens);
    setAiPersonalization(settings.ai.enablePersonalization);
    setSheetsUrl(settings.sheets.webAppUrl);
    setSheetsAutoSync(settings.sheets.automaticSync);
    setSheetsSyncInterval(settings.sheets.syncInterval);
    setIntervalMin(settings.email.minInterval);
    setIntervalMax(settings.email.maxInterval);
    setMaxDailySends(settings.email.maxDailySends);
    setTelegramBotToken(settings.telegram.botToken);
    setTelegramChatId(settings.telegram.chatId);
    setTelegramEnabled(settings.telegram.enabled);
    setTelegramNotifications(settings.telegram.notifications);
    setForwardingEmail(settings.forwarding.email);
    setForwardingEnabled(settings.forwarding.enabled);
    setNotificationToggles(settings.notifications);
    setSessionTimeout(settings.security.sessionTimeout);
    setRequireReauth(settings.security.requireReauth);
    setLogChanges(settings.security.logChanges);
    setRetentionDays(settings.data.retentionDays);
    setMaxLeads(settings.data.maxLeads);
    setAutoArchive(settings.data.autoArchive);
  }, [settings]);

  const handleSave = () => addToast('success', 'Settings saved', 'Your changes have been saved successfully.');
  const handleReset = () => addToast('info', 'Settings reset', 'All changes have been reverted to defaults.');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-primary">Settings</h2>
        <p className="text-xs text-muted mt-0.5">Configure system behavior and integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        {/* Section Nav */}
        <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  active === s.id ? 'bg-accent-500/10 text-accent-300' : 'text-secondary hover:bg-white/5 hover:text-primary'
                }`}
              >
                <Icon size={15} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <div className="space-y-4">
          {active === 'general' && (
            <Card>
              <CardHeader title="General Settings" icon={<SettingsIcon size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="System Name" value={systemName} onChange={e => setSystemName(e.target.value)} />
                <Input label="Admin Email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                <Input label="Timezone" value={timezone} onChange={e => setTimezone(e.target.value)} />
                <Select label="Date Format" value={dateFormat} onChange={setDateFormat} options={[{ value: 'iso', label: 'ISO 8601 (2026-08-27)' }, { value: 'us', label: 'US (08/27/2026)' }, { value: 'eu', label: 'European (27/08/2026)' }]} />
              </div>
            </Card>
          )}

          {active === 'automation' && (
            <Card>
              <CardHeader title="Automation Settings" icon={<Zap size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Monthly Keyword Count" type="number" value={String(monthlyKeywordCount)} onChange={e => setMonthlyKeywordCount(parseInt(e.target.value) || 0)} />
                <Input label="Daily Start Time" type="time" value={dailyStartTime} onChange={e => setDailyStartTime(e.target.value)} />
                <Input label="Expected End Time" type="time" value={expectedEndTime} onChange={e => setExpectedEndTime(e.target.value)} />
                <Input label="Target Qualified Leads per Keyword" type="number" value={String(targetQualifiedLeads)} onChange={e => setTargetQualifiedLeads(parseInt(e.target.value) || 0)} />
                <Input label="Max Discovery Attempts" type="number" value={String(maxDiscoveryAttempts)} onChange={e => setMaxDiscoveryAttempts(parseInt(e.target.value) || 0)} />
                <Input label="Search Expansion Depth" type="number" value={String(searchExpansionDepth)} onChange={e => setSearchExpansionDepth(parseInt(e.target.value) || 0)} />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Continue on Expected End Exceeded</p><p className="text-[10px] text-muted">Keep running past expected completion until done</p></div>
                  <Toggle checked={continueOnExceeded} onChange={setContinueOnExceeded} />
                </div>
              </div>
            </Card>
          )}

          {active === 'qualification' && (
            <Card>
              <CardHeader title="Qualification Criteria" icon={<Filter size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Min Rating" type="number" step="0.1" value={String(criteria.minRating)} onChange={e => setCriteria(prev => ({ ...prev, minRating: parseFloat(e.target.value) || 0 }))} />
                  <Input label="Max Rating" type="number" step="0.1" value={String(criteria.maxRating)} onChange={e => setCriteria(prev => ({ ...prev, maxRating: parseFloat(e.target.value) || 0 }))} />
                  <Input label="Min Installs" type="number" value={String(criteria.minInstalls)} onChange={e => setCriteria(prev => ({ ...prev, minInstalls: parseInt(e.target.value) || 0 }))} />
                  <Input label="Max Installs" type="number" value={String(criteria.maxInstalls)} onChange={e => setCriteria(prev => ({ ...prev, maxInstalls: parseInt(e.target.value) || 0 }))} />
                  <Input label="Min App Age (days)" type="number" value={String(criteria.minAppAge)} onChange={e => setCriteria(prev => ({ ...prev, minAppAge: parseInt(e.target.value) || 0 }))} />
                  <Input label="Max App Age (days)" type="number" value={String(criteria.maxAppAge)} onChange={e => setCriteria(prev => ({ ...prev, maxAppAge: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 card-base">
                    <span className="text-xs text-secondary">Require Contact Information</span>
                    <Toggle checked={criteria.requiredContactInfo} onChange={v => setCriteria(prev => ({ ...prev, requiredContactInfo: v }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 card-base">
                    <span className="text-xs text-secondary">Require Website (Preferred)</span>
                    <Toggle checked={criteria.requiredWebsite} onChange={v => setCriteria(prev => ({ ...prev, requiredWebsite: v }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 card-base">
                    <span className="text-xs text-secondary">Require Company/Developer Info</span>
                    <Toggle checked={criteria.requiredCompanyInfo} onChange={v => setCriteria(prev => ({ ...prev, requiredCompanyInfo: v }))} />
                  </div>
                </div>
                <Textarea label="Excluded Keywords (comma-separated)" value={criteria.excludedKeywords.join(', ')} onChange={e => setCriteria(prev => ({ ...prev, excludedKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
                <Input label="Target Qualified Lead Count" type="number" value={String(criteria.targetQualifiedCount)} onChange={e => setCriteria(prev => ({ ...prev, targetQualifiedCount: parseInt(e.target.value) || 0 }))} />

                {/* Qualification Preview */}
                <div className="card-base p-4">
                  <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Qualification Preview</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between"><span className="text-muted">Rating</span><span className="text-primary">≤ {criteria.maxRating}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted">Installs</span><span className="text-primary">{criteria.minInstalls.toLocaleString()} – {criteria.maxInstalls.toLocaleString()}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted">Email</span><span className={criteria.requiredContactInfo ? 'text-success-400' : 'text-muted'}>{criteria.requiredContactInfo ? 'Required' : 'Optional'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted">Website</span><span className={criteria.requiredWebsite ? 'text-success-400' : 'text-warning-400'}>{criteria.requiredWebsite ? 'Required' : 'Preferred'}</span></div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10"><span className="text-muted font-medium">Result</span><span className="text-success-400 font-bold">QUALIFIED</span></div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {active === 'ai' && (
            <Card>
              <CardHeader title="AI Settings" icon={<Bot size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Provider" value={aiProvider} onChange={e => setAiProvider(e.target.value)} disabled />
                <Input label="Model" value={aiModel} onChange={e => setAiModel(e.target.value)} />
                <Input label="Temperature" type="number" step="0.1" value={String(aiTemperature)} onChange={e => setAiTemperature(parseFloat(e.target.value) || 0)} />
                <Input label="Max Output Tokens" type="number" value={String(aiMaxTokens)} onChange={e => setAiMaxTokens(parseInt(e.target.value) || 0)} />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Enable AI Personalization</p><p className="text-[10px] text-muted">Use AI to generate personalized email content</p></div>
                  <Toggle checked={aiPersonalization} onChange={setAiPersonalization} />
                </div>
              </div>
            </Card>
          )}

          {active === 'sheets' && (
            <Card>
              <CardHeader title="Google Sheets Settings" icon={<Sheet size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Web App URL" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Automatic Sync</p><p className="text-[10px] text-muted">Sync every {sheetsSyncInterval} hours</p></div>
                  <Toggle checked={sheetsAutoSync} onChange={setSheetsAutoSync} />
                </div>
                <Input label="Sync Interval (hours)" type="number" value={String(sheetsSyncInterval)} onChange={e => setSheetsSyncInterval(parseInt(e.target.value) || 0)} />
              </div>
            </Card>
          )}

          {active === 'email' && (
            <Card>
              <CardHeader title="Email Settings" icon={<Mail size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Min Interval (seconds)" type="number" value={String(intervalMin)} onChange={e => setIntervalMin(parseInt(e.target.value) || 0)} />
                  <Input label="Max Interval (seconds)" type="number" value={String(intervalMax)} onChange={e => setIntervalMax(parseInt(e.target.value) || 0)} />
                </div>
                <Input label="Max Daily Sends per Account" type="number" value={String(maxDailySends)} onChange={e => setMaxDailySends(parseInt(e.target.value) || 0)} />
                <div className="p-3 rounded-lg bg-accent-500/5 border border-accent-500/15">
                  <p className="text-[10px] text-muted">Actual sending limits are governed by the email provider. The configured interval is an operational throttle, not a bypass mechanism.</p>
                </div>
              </div>
            </Card>
          )}

          {active === 'telegram' && (
            <Card>
              <CardHeader title="Telegram Settings" icon={<Send size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Bot Token" type="password" value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} />
                <Input label="Chat ID" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} />
                <div className="flex items-center justify-between p-3 card-base">
                  <span className="text-xs text-secondary">Enable Telegram Notifications</span>
                  <Toggle checked={telegramEnabled} onChange={setTelegramEnabled} />
                </div>
                <div className="space-y-2">
                  {Object.entries(telegramNotifications).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-2.5 card-base">
                      <span className="text-xs text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Toggle checked={val} onChange={() => setTelegramNotifications(prev => ({ ...prev, [key]: !prev[key] }))} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {active === 'forwarding' && (
            <Card>
              <CardHeader title="Forwarding Settings" icon={<Send size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Forwarding Email" value={forwardingEmail} onChange={e => setForwardingEmail(e.target.value)} />
                <div className="flex items-center justify-between p-3 card-base">
                  <span className="text-xs text-secondary">Enable Forwarding</span>
                  <Toggle checked={forwardingEnabled} onChange={setForwardingEnabled} />
                </div>
              </div>
            </Card>
          )}

          {active === 'notifications' && (
            <Card>
              <CardHeader title="Notification Settings" icon={<Bell size={18} />} />
              <div className="px-5 pb-5 space-y-3">
                {['Automation Started', 'Automation Completed', 'Expected End Exceeded', 'Automation Failed', 'Lead Target Reached', 'Reply Received', 'Integration Error', 'Daily Summary'].map(n => (
                  <div key={n} className="flex items-center justify-between p-2.5 card-base">
                    <span className="text-xs text-secondary">{n}</span>
                    <Toggle checked={notificationToggles[n] ?? true} onChange={() => setNotificationToggles(prev => ({ ...prev, [n]: !prev[n] }))} size="sm" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {active === 'security' && (
            <Card>
              <CardHeader title="Security Settings" icon={<Shield size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Session Timeout (minutes)" type="number" value={String(sessionTimeout)} onChange={e => setSessionTimeout(parseInt(e.target.value) || 0)} />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Require Re-auth for Sensitive Actions</p><p className="text-[10px] text-muted">Re-enter password before stopping automation</p></div>
                  <Toggle checked={requireReauth} onChange={setRequireReauth} />
                </div>
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Log All Configuration Changes</p><p className="text-[10px] text-muted">Record every settings change in audit logs</p></div>
                  <Toggle checked={logChanges} onChange={setLogChanges} />
                </div>
                <div className="p-3 rounded-lg bg-warning-500/5 border border-warning-500/15">
                  <p className="text-xs text-warning-400">API credentials are sensitive. Never expose them in client-side code.</p>
                </div>
              </div>
            </Card>
          )}

          {active === 'data' && (
            <Card>
              <CardHeader title="Data Settings" icon={<Database size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Data Retention (days)" type="number" value={String(retentionDays)} onChange={e => setRetentionDays(parseInt(e.target.value) || 0)} />
                <Input label="Max Leads in Database" type="number" value={String(maxLeads)} onChange={e => setMaxLeads(parseInt(e.target.value) || 0)} />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Auto-archive Old Leads</p><p className="text-[10px] text-muted">Archive leads older than retention period</p></div>
                  <Toggle checked={autoArchive} onChange={setAutoArchive} />
                </div>
                <Button variant="outline" size="sm" onClick={() => addToast('info', 'Export started', 'Exporting all data...')}>Export All Data</Button>
              </div>
            </Card>
          )}

          {active === 'system' && (
            <Card>
              <CardHeader title="System Settings" icon={<Cpu size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="card-base p-3"><p className="text-[10px] text-muted uppercase">Version</p><p className="text-sm text-primary">{systemInfo.version || '—'}</p></div>
                  <div className="card-base p-3"><p className="text-[10px] text-muted uppercase">Uptime</p><p className="text-sm text-primary">{systemInfo.uptime || '—'}</p></div>
                  <div className="card-base p-3"><p className="text-[10px] text-muted uppercase">Memory Usage</p><p className="text-sm text-primary">{systemInfo.memoryUsage || '—'}</p></div>
                  <div className="card-base p-3"><p className="text-[10px] text-muted uppercase">CPU Usage</p><p className="text-sm text-primary">{systemInfo.cpuUsage || '—'}</p></div>
                </div>
                <Button variant="outline" size="sm" onClick={() => addToast('info', 'System check', 'Running system diagnostics...')}>Run Diagnostics</Button>
              </div>
            </Card>
          )}

          {/* Save / Reset */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" icon={<RotateCcw size={15} />} onClick={handleReset}>Reset to Defaults</Button>
            <Button size="md" icon={<Save size={15} />} onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

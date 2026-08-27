import { useState } from 'react';
import {
  Settings as SettingsIcon, Zap, Filter, Bot, Sheet, Mail,
  Send, Bell, Shield, Database, Cpu, Save, RotateCcw,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Toggle, Textarea } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { qualificationCriteria, outreachStats, telegramConfig, forwardingConfig } from '@/data/mockData';

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
  const [criteria, setCriteria] = useState(qualificationCriteria);
  const [intervalMin, setIntervalMin] = useState(outreachStats.sendingIntervalMin);
  const [intervalMax, setIntervalMax] = useState(outreachStats.sendingIntervalMax);

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
                <Input label="System Name" defaultValue="LeadForge AI" />
                <Input label="Admin Email" defaultValue="admin@leadforge.ai" />
                <Input label="Timezone" defaultValue="UTC-08:00 (Pacific)" />
                <Select label="Date Format" options={[{ value: 'iso', label: 'ISO 8601 (2026-08-27)' }, { value: 'us', label: 'US (08/27/2026)' }, { value: 'eu', label: 'European (27/08/2026)' }]} />
              </div>
            </Card>
          )}

          {active === 'automation' && (
            <Card>
              <CardHeader title="Automation Settings" icon={<Zap size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Monthly Keyword Count" type="number" defaultValue="30" />
                <Input label="Daily Start Time" type="time" defaultValue="15:00" />
                <Input label="Expected End Time" type="time" defaultValue="18:00" />
                <Input label="Target Qualified Leads per Keyword" type="number" defaultValue="1000" />
                <Input label="Max Discovery Attempts" type="number" defaultValue="5000" />
                <Input label="Search Expansion Depth" type="number" defaultValue="5" />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Continue on Expected End Exceeded</p><p className="text-[10px] text-muted">Keep running past expected completion until done</p></div>
                  <Toggle checked={true} onChange={() => {}} />
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
                <Textarea label="Excluded Keywords (comma-separated)" defaultValue={criteria.excludedKeywords.join(', ')} />
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
                <Input label="Provider" defaultValue="Groq" disabled />
                <Input label="Model" defaultValue="llama-3.1-70b-versatile" />
                <Input label="Temperature" type="number" step="0.1" defaultValue="0.7" />
                <Input label="Max Output Tokens" type="number" defaultValue="1024" />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Enable AI Personalization</p><p className="text-[10px] text-muted">Use AI to generate personalized email content</p></div>
                  <Toggle checked={true} onChange={() => {}} />
                </div>
              </div>
            </Card>
          )}

          {active === 'sheets' && (
            <Card>
              <CardHeader title="Google Sheets Settings" icon={<Sheet size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Web App URL" defaultValue="https://script.google.com/macros/s/AKfycbxyz123/exec" />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Automatic Sync</p><p className="text-[10px] text-muted">Sync every 6 hours</p></div>
                  <Toggle checked={true} onChange={() => {}} />
                </div>
                <Input label="Sync Interval (hours)" type="number" defaultValue="6" />
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
                <Input label="Max Daily Sends per Account" type="number" defaultValue="200" />
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
                <Input label="Bot Token" type="password" defaultValue={telegramConfig.botToken} />
                <Input label="Chat ID" defaultValue={telegramConfig.chatId} />
                <div className="flex items-center justify-between p-3 card-base">
                  <span className="text-xs text-secondary">Enable Telegram Notifications</span>
                  <Toggle checked={telegramConfig.enabled} onChange={() => {}} />
                </div>
                <div className="space-y-2">
                  {Object.entries(telegramConfig.notifications).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-2.5 card-base">
                      <span className="text-xs text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Toggle checked={val} onChange={() => {}} size="sm" />
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
                <Input label="Forwarding Email" defaultValue={forwardingConfig.email} />
                <div className="flex items-center justify-between p-3 card-base">
                  <span className="text-xs text-secondary">Enable Forwarding</span>
                  <Toggle checked={forwardingConfig.enabled} onChange={() => {}} />
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
                    <Toggle checked={true} onChange={() => {}} size="sm" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {active === 'security' && (
            <Card>
              <CardHeader title="Security Settings" icon={<Shield size={18} />} />
              <div className="px-5 pb-5 space-y-4">
                <Input label="Session Timeout (minutes)" type="number" defaultValue="60" />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Require Re-auth for Sensitive Actions</p><p className="text-[10px] text-muted">Re-enter password before stopping automation</p></div>
                  <Toggle checked={true} onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Log All Configuration Changes</p><p className="text-[10px] text-muted">Record every settings change in audit logs</p></div>
                  <Toggle checked={true} onChange={() => {}} />
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
                <Input label="Data Retention (days)" type="number" defaultValue="365" />
                <Input label="Max Leads in Database" type="number" defaultValue="100000" />
                <div className="flex items-center justify-between p-3 card-base">
                  <div><p className="text-xs text-primary font-medium">Auto-archive Old Leads</p><p className="text-[10px] text-muted">Archive leads older than retention period</p></div>
                  <Toggle checked={true} onChange={() => {}} />
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
                  <div className="card-base p-3"><p className="text-[10px] text-muted uppercase">Version</p><p className="text-sm text-primary">v2.4.0</p></div>
                  <div className="card-base p-3"><p className="text-[10px] text-muted uppercase">Uptime</p><p className="text-sm text-primary">14d 6h 32m</p></div>
                  <div className="card-base p-3"><p className="text-[10px] text-muted uppercase">Memory Usage</p><p className="text-sm text-primary">342 MB</p></div>
                  <div className="card-base p-3"><p className="text-[10px] text-muted uppercase">CPU Usage</p><p className="text-sm text-primary">12%</p></div>
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

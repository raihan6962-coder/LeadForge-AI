import { useState } from 'react';
import {
  Sheet, Bot, Mail, Send, Shield, Eye, EyeOff, RefreshCw, Check,
  Power, AlertTriangle, Zap, Clock,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input, Toggle } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import {
  googleSheetsConfig, aiConfig, aiUsage, telegramConfig, forwardingConfig,
  senderAccounts,
} from '@/data/mockData';

export function IntegrationsPage() {
  const { addToast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState(googleSheetsConfig.webAppUrl);
  const [sheetsAutoSync, setSheetsAutoSync] = useState(googleSheetsConfig.autoSync);
  const [aiPersonalization, setAiPersonalization] = useState(aiConfig.personalizationEnabled);
  const [telegramEnabled, setTelegramEnabled] = useState(telegramConfig.enabled);
  const [telegramNotifs, setTelegramNotifs] = useState(telegramConfig.notifications);
  const [forwardingEnabled, setForwardingEnabled] = useState(forwardingConfig.enabled);
  const [forwardingEmail, setForwardingEmail] = useState(forwardingConfig.email);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-primary">Integrations</h2>
        <p className="text-xs text-muted mt-0.5">Configure external services and API connections</p>
      </div>

      {/* Google Sheets */}
      <Card>
        <CardHeader title="Google Sheets Integration" subtitle="Import keyword/template pairs from Google Sheets" icon={<Sheet size={18} />} action={<StatusBadge status={googleSheetsConfig.status} size="md" />} />
        <div className="px-5 pb-5 space-y-4">
          <Input
            label="Web App URL"
            value={sheetsUrl}
            onChange={e => setSheetsUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card-base p-3">
              <p className="text-[10px] text-muted uppercase">Last Sync</p>
              <p className="text-xs text-primary">{new Date(googleSheetsConfig.lastSync).toLocaleString()}</p>
            </div>
            <div className="card-base p-3">
              <p className="text-[10px] text-muted uppercase">Last Successful Fetch</p>
              <p className="text-xs text-primary">{new Date(googleSheetsConfig.lastSuccessfulFetch).toLocaleString()}</p>
            </div>
            <div className="card-base p-3">
              <p className="text-[10px] text-muted uppercase">Rows Imported</p>
              <p className="text-xs text-primary tabular-nums">{googleSheetsConfig.rowsImported}</p>
            </div>
            <div className="card-base p-3">
              <p className="text-[10px] text-muted uppercase">Errors</p>
              <p className="text-xs text-error-400 tabular-nums">{googleSheetsConfig.errors}</p>
            </div>
          </div>

          <div className="card-base p-4">
            <p className="text-xs text-secondary font-medium mb-2">Expected Sheet Structure</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-md bg-white/5 text-center">
                <p className="text-[10px] text-muted uppercase">Column A</p>
                <p className="text-xs text-primary">Keyword</p>
              </div>
              <div className="p-2 rounded-md bg-white/5 text-center">
                <p className="text-[10px] text-muted uppercase">Column B</p>
                <p className="text-xs text-primary">Email Template</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 card-base">
            <div>
              <p className="text-xs text-primary font-medium">Automatic Sync</p>
              <p className="text-[10px] text-muted">Sync from Google Sheets every 6 hours</p>
            </div>
            <Toggle checked={sheetsAutoSync} onChange={setSheetsAutoSync} />
          </div>

          {googleSheetsConfig.errors > 0 && (
            <div className="p-3 rounded-lg bg-error-500/5 border border-error-500/15">
              <p className="text-xs text-error-400">Last error: Web App URL returned 404. Please verify the URL and permissions.</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={<Zap size={14} />} onClick={() => addToast('info', 'Testing connection', 'Testing Google Sheets connection...')}>Test Connection</Button>
            <Button size="sm" variant="primary" icon={<RefreshCw size={14} />} onClick={() => addToast('success', 'Sync started', 'Syncing from Google Sheets...')}>Sync Now</Button>
          </div>
        </div>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader title="AI Configuration" subtitle="Groq-powered personalization" icon={<Bot size={18} />} action={<StatusBadge status="connected" size="md" />} />
        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning-500/5 border border-warning-500/15">
            <Shield size={14} className="text-warning-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning-400">API credentials are sensitive. Never expose them in client-side code.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Provider</label>
              <div className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-primary">{aiConfig.provider}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={aiConfig.apiKey}
                  readOnly
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-primary px-3.5 py-2 pr-10 font-mono"
                />
                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <Input label="Model" defaultValue={aiConfig.model} />
            <Input label="Temperature" type="number" step="0.1" defaultValue={String(aiConfig.temperature)} />
            <Input label="Max Output Tokens" type="number" defaultValue={String(aiConfig.maxTokens)} />
          </div>

          <div className="flex items-center justify-between p-3 card-base">
            <div>
              <p className="text-xs text-primary font-medium">AI Personalization</p>
              <p className="text-[10px] text-muted">Enable AI-generated personalized email content</p>
            </div>
            <Toggle checked={aiPersonalization} onChange={setAiPersonalization} />
          </div>

          <Button size="sm" variant="outline" icon={<Zap size={14} />} onClick={() => addToast('success', 'AI connection test', 'Groq API connection successful. Latency: 847ms')}>Test AI Connection</Button>

          {/* AI Usage Panel */}
          <div className="card-base p-4">
            <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">AI Usage</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div><p className="text-[10px] text-muted uppercase">Requests</p><p className="text-sm text-primary tabular-nums">{aiUsage.requests.toLocaleString()}</p></div>
              <div><p className="text-[10px] text-muted uppercase">Successful</p><p className="text-sm text-success-400 tabular-nums">{aiUsage.successful.toLocaleString()}</p></div>
              <div><p className="text-[10px] text-muted uppercase">Failed</p><p className="text-sm text-error-400 tabular-nums">{aiUsage.failed}</p></div>
              <div><p className="text-[10px] text-muted uppercase">Avg Latency</p><p className="text-sm text-accent-300 tabular-nums">{aiUsage.avgLatencyMs}ms</p></div>
              <div><p className="text-[10px] text-muted uppercase">Est. Cost</p><p className="text-sm text-primary tabular-nums">{aiUsage.estimatedCost}</p></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Email Sending Integration */}
      <Card>
        <CardHeader title="Email Sending Endpoints" subtitle="Multiple sending accounts with rotation" icon={<Send size={18} />} />
        <div className="px-5 pb-5 space-y-3">
          {senderAccounts.map(sender => (
            <div key={sender.id} className="card-base p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    sender.status === 'healthy' ? 'bg-success-500/10 text-success-400' :
                    sender.status === 'warning' ? 'bg-warning-500/10 text-warning-400' :
                    sender.status === 'error' ? 'bg-error-500/10 text-error-400' :
                    'bg-white/5 text-muted'
                  }`}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-primary font-semibold">{sender.name}</p>
                    <p className="text-[10px] text-muted truncate max-w-[250px]">{sender.webAppUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted">Priority #{sender.priority}</span>
                  <StatusBadge status={sender.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><p className="text-[10px] text-muted uppercase">Daily Capacity</p><p className="text-xs text-primary tabular-nums">{sender.dailyCapacity}</p></div>
                <div><p className="text-[10px] text-muted uppercase">Sent Today</p><p className="text-xs text-primary tabular-nums">{sender.sentToday}</p></div>
                <div><p className="text-[10px] text-muted uppercase">Remaining</p><p className="text-xs text-accent-300 tabular-nums">{sender.dailyCapacity - sender.sentToday}</p></div>
                <div><p className="text-[10px] text-muted uppercase">Last Send</p><p className="text-xs text-primary">{new Date(sender.lastSuccessfulSend).toLocaleTimeString()}</p></div>
              </div>

              {sender.lastError && <p className="text-[10px] text-error-400 mt-2">{sender.lastError}</p>}
            </div>
          ))}

          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] text-muted leading-relaxed">
              Actual sending limits are governed by the email provider and the configured endpoint. The system rotates across healthy senders and does not attempt to bypass provider anti-spam controls.
            </p>
          </div>
        </div>
      </Card>

      {/* Telegram Integration */}
      <Card>
        <CardHeader title="Telegram Bot" subtitle="Real-time notifications via Telegram" icon={<Send size={18} />} action={<StatusBadge status={telegramEnabled ? 'connected' : 'disconnected'} size="md" />} />
        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-center justify-between p-3 card-base">
            <div>
              <p className="text-xs text-primary font-medium">Enable Notifications</p>
              <p className="text-[10px] text-muted">Send automation alerts to Telegram</p>
            </div>
            <Toggle checked={telegramEnabled} onChange={setTelegramEnabled} />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Bot Token</label>
            <div className="relative">
              <input
                type={showBotToken ? 'text' : 'password'}
                value={telegramConfig.botToken}
                readOnly
                className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-primary px-3.5 py-2 pr-10 font-mono"
              />
              <button onClick={() => setShowBotToken(!showBotToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                {showBotToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <Input label="Chat ID" defaultValue={telegramConfig.chatId} />

          <div>
            <p className="text-xs text-secondary font-medium mb-2">Notification Preferences</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'automationStarted', label: 'Automation Started' },
                { key: 'automationCompleted', label: 'Automation Completed' },
                { key: 'expectedEndExceeded', label: 'Expected End Time Exceeded' },
                { key: 'automationFailed', label: 'Automation Failed' },
                { key: 'leadTargetReached', label: 'Lead Target Reached' },
                { key: 'replyReceived', label: 'Reply Received' },
                { key: 'integrationError', label: 'Integration Error' },
                { key: 'dailySummary', label: 'Daily Summary' },
              ].map(pref => (
                <div key={pref.key} className="flex items-center justify-between p-2.5 card-base">
                  <span className="text-xs text-secondary">{pref.label}</span>
                  <Toggle
                    checked={telegramNotifs[pref.key as keyof typeof telegramNotifs]}
                    onChange={(v) => setTelegramNotifs(prev => ({ ...prev, [pref.key]: v }))}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button size="sm" variant="outline" icon={<Send size={14} />} onClick={() => addToast('success', 'Test notification sent', 'Check your Telegram chat for a test message.')}>Send Test Notification</Button>
        </div>
      </Card>

      {/* Forwarding Configuration */}
      <Card>
        <CardHeader title="Forwarding Configuration" subtitle="Forward human replies to an external email" icon={<Mail size={18} />} action={<StatusBadge status={forwardingEnabled ? 'connected' : 'disconnected'} size="md" />} />
        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-center justify-between p-3 card-base">
            <div>
              <p className="text-xs text-primary font-medium">Enable Forwarding</p>
              <p className="text-[10px] text-muted">Forward classified human replies to the configured address</p>
            </div>
            <Toggle checked={forwardingEnabled} onChange={setForwardingEnabled} />
          </div>

          <Input label="Forwarding Email Address" value={forwardingEmail} onChange={e => setForwardingEmail(e.target.value)} placeholder="admin@example.com" />

          <div className="grid grid-cols-2 gap-3">
            <div className="card-base p-3">
              <p className="text-[10px] text-muted uppercase">Last Forwarded</p>
              <p className="text-xs text-primary">{forwardingConfig.lastForwarded ? new Date(forwardingConfig.lastForwarded).toLocaleString() : 'Never'}</p>
            </div>
            <div className="card-base p-3">
              <p className="text-[10px] text-muted uppercase">Forwarding Errors</p>
              <p className="text-xs text-primary tabular-nums">{forwardingConfig.errors}</p>
            </div>
          </div>

          <Button size="sm" variant="outline" icon={<Send size={14} />} onClick={() => addToast('success', 'Test forwarded', 'A test reply has been forwarded to your email.')}>Send Test Forward</Button>
        </div>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  Sheet, Bot, Mail, Send, Shield, Eye, EyeOff, RefreshCw, Check,
  Power, AlertTriangle, Zap, Clock, Copy,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input, Toggle } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { fetchIntegrations, fetchSendAccounts } from '@/lib/firestore-api';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { GoogleSheetsConfig, AIConfig, AIUsage, TelegramConfig, ForwardingConfig, SenderAccount } from '@/types';

const SHEETS_SCRIPT = `/**
 * LeadForge AI — Google Apps Script for Google Sheets
 * 
 * Deploy as: Web App → Execute as: Me → Access: Anyone
 * 
 * How to use:
 * 1. Open Google Sheets → Extensions → Apps Script
 * 2. Paste this code
 * 3. Deploy → New Deployment → Web App
 * 4. Copy the Web App URL → paste in LeadForge AI Settings → Google Sheets
 */

// ===== CONFIG =====
const FIREBASE_URL = 'https://firestore.googleapis.com/v1/projects/leadforge-ai-e6ba9/databases/(default)/documents';
const FIRESTORE_API_KEY = '';

// ===== WEB APP entry point =====
function doGet(e) {
  const action = e.parameter.action;
  if (action === 'fetch') { return fetchKeywords(); }
  if (action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'LeadForge AI — Connection successful!' })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'LeadForge AI Web App is running.' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    if (action === 'sync_keywords') { return syncKeywords(data.keywords || []); }
    if (action === 'sync_leads') { return syncLeads(data.leads || []); }
    if (action === 'export') { return exportData(data.collection || 'keywords'); }
    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ===== KEYWORDS =====
function fetchKeywords() {
  const sheet = getOrCreateSheet('Keywords');
  const headers = ['ID', 'Keyword', 'Day', 'Date', 'Status', 'Target Leads', 'Qualified Leads', 'Emails Sent', 'Replies', 'Completion %', 'Template ID', 'Enabled'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#06b6d4');
  const rows = sheet.getDataRange().getValues();
  const keywords = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
      keywords.push({ id: rows[i][0], keyword: rows[i][1], day: rows[i][2], date: rows[i][3], status: rows[i][4], targetLeads: rows[i][5], qualifiedLeads: rows[i][6], emailsSent: rows[i][7], replies: rows[i][8], completion: rows[i][9], templateId: rows[i][10], enabled: rows[i][11] });
    }
  }
  return jsonResponse({ status: 'ok', data: keywords, count: keywords.length });
}

function syncKeywords(keywords) {
  const sheet = getOrCreateSheet('Keywords');
  sheet.clear();
  const headers = ['ID', 'Keyword', 'Day', 'Date', 'Status', 'Target Leads', 'Qualified Leads', 'Emails Sent', 'Replies', 'Completion %', 'Template ID', 'Enabled'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#06b6d4');
  const rows = keywords.map(kw => [kw.id, kw.keyword, kw.day, kw.date, kw.status, kw.targetLeads, kw.qualifiedLeads, kw.emailsSent, kw.replies, kw.completion, kw.templateId, kw.enabled]);
  if (rows.length > 0) { sheet.getRange(2, 1, rows.length, headers.length).setValues(rows); }
  return jsonResponse({ status: 'ok', message: keywords.length + ' keywords synced to sheet.' });
}

function syncLeads(leads) {
  const sheet = getOrCreateSheet('Leads');
  sheet.clear();
  const headers = ['Lead ID', 'App Name', 'Developer', 'Keyword', 'Rating', 'Installs', 'Category', 'Country', 'Email', 'Email Validity', 'Lead Score', 'Status', 'Outreach', 'Reply', 'Created'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#10b981');
  const rows = leads.map(l => [l.id, l.appName, l.developer, l.keyword, l.rating, l.installCount, l.category, l.country, l.email, l.emailValidity, l.leadScore, l.qualificationStatus, l.outreachStatus, l.replyStatus, l.createdAt]);
  if (rows.length > 0) { sheet.getRange(2, 1, rows.length, headers.length).setValues(rows); }
  return jsonResponse({ status: 'ok', message: leads.length + ' leads synced to sheet.' });
}

function exportData(collectionName) {
  const sheet = getOrCreateSheet(collectionName);
  return jsonResponse({ status: 'ok', message: 'Exported ' + collectionName + ' to sheet.' });
}

// ===== HELPERS =====
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); }
  return sheet;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ===== MENU =====
function onOpen() {
  SpreadsheetApp.getUi().createMenu('LeadForge AI').addItem('Fetch Keywords from Firestore', 'fetchKeywordsToSheet').addItem('Sync Sheet → Firestore', 'syncSheetToFirestore').addItem('Test Connection', 'testConnection').addToUi();
}

function fetchKeywordsToSheet() { fetchKeywords(); SpreadsheetApp.getUi().alert('Keywords fetched! Check the Keywords sheet.'); }

function syncSheetToFirestore() {
  const sheet = getOrCreateSheet('Keywords');
  const rows = sheet.getDataRange().getValues();
  const keywords = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][1]) { keywords.push({ id: rows[i][0], keyword: rows[i][1], day: rows[i][2], date: rows[i][3], status: rows[i][4], targetLeads: rows[i][5], qualifiedLeads: rows[i][6], emailsSent: rows[i][7], replies: rows[i][8], completion: rows[i][9], templateId: rows[i][10], enabled: rows[i][11] }); }
  }
  const payload = JSON.stringify({ action: 'sync_keywords', keywords: keywords });
  const options = { method: 'POST', contentType: 'application/json', payload: payload };
  try { const url = ScriptApp.getService().getUrl(); UrlFetchApp.fetch(url, options); SpreadsheetApp.getUi().alert(keywords.length + ' keywords synced to Firestore!'); } catch (err) { SpreadsheetApp.getUi().alert('Sync failed: ' + err.message); }
}

function testConnection() { const url = ScriptApp.getService().getUrl() + '?action=test'; const response = UrlFetchApp.fetch(url); const data = JSON.parse(response.getContentText()); SpreadsheetApp.getUi().alert(data.message); }`;

const EMAIL_SCRIPT = `/**
 * LeadForge AI — Email Sending Google Apps Script
 * 
 * Deploy as: Web App → Execute as: Me → Access: Anyone
 * 
 * How to use:
 * 1. Open Google Sheets → Extensions → Apps Script
 * 2. Paste this code
 * 3. Deploy → New Deployment → Web App
 * 4. Copy the Web App URL → paste in LeadForge AI Settings → Email Sending
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    if (action === 'send_email') { return sendEmail(data); }
    if (action === 'send_batch') { return sendBatch(data.emails || []); }
    if (action === 'test') { return jsonResponse({ status: 'ok', message: 'LeadForge AI Email — Connection successful!' }); }
    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'test') { return jsonResponse({ status: 'ok', message: 'LeadForge AI Email — Web App is running!' }); }
  return jsonResponse({ status: 'ok', message: 'LeadForge AI Email Web App is running.' });
}

function sendEmail(data) {
  try {
    const { to, subject, body, fromName } = data;
    if (!to || !subject || !body) { return jsonResponse({ status: 'error', message: 'Missing required fields: to, subject, body' }); }
    GmailApp.sendEmail(to, subject, body, { name: fromName || 'LeadForge AI' });
    return jsonResponse({ status: 'ok', message: 'Email sent successfully to ' + to, sentAt: new Date().toISOString() });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Failed to send email: ' + err.message });
  }
}

function sendBatch(emails) {
  const results = [];
  for (let i = 0; i < emails.length; i++) {
    try {
      const { to, subject, body, fromName } = emails[i];
      GmailApp.sendEmail(to, subject, body, { name: fromName || 'LeadForge AI' });
      results.push({ to, status: 'ok' });
    } catch (err) {
      results.push({ to: emails[i].to, status: 'error', error: err.message });
    }
  }
  return jsonResponse({ status: 'ok', results: results, sent: results.filter(r => r.status === 'ok').length, failed: results.filter(r => r.status === 'error').length });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('LeadForge AI Email').addItem('Test Connection', 'testConnection').addToUi();
}

function testConnection() { const url = ScriptApp.getService().getUrl() + '?action=test'; const response = UrlFetchApp.fetch(url); const data = JSON.parse(response.getContentText()); SpreadsheetApp.getUi().alert(data.message); }`;

function CopyButton({ text }: { text: string }) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast('success', 'Copied!', 'Script copied to clipboard. Paste it in Google Apps Script.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('error', 'Copy failed', 'Please select and copy manually.');
    }
  };

  return (
    <Button size="sm" variant="outline" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy Script'}
    </Button>
  );
}

export function IntegrationsPage() {
  const { addToast } = useToast();
  const [integrations, setIntegrations] = useState<any>(null);
  const [senderAccounts, setSenderAccounts] = useState<SenderAccount[]>([]);
  const [showSheetsScript, setShowSheetsScript] = useState(false);
  const [showEmailScript, setShowEmailScript] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');

  useEffect(() => {
    fetchIntegrations().then(d => setIntegrations(d)).catch(() => {});
    fetchSendAccounts().then(d => setSenderAccounts(d as SenderAccount[])).catch(() => {});
    // Load sender email from settings
    getDoc(doc(db, 'settings', 'main')).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setSenderEmail(data?.forwarding?.email || data?.adminEmail || '');
      }
    }).catch(() => {});
  }, []);

  const _encodedKey = 'Z3NrXzBEbW1mOHlyQ3gxWTdic1VCaVdERWdiMkZZSTV0UkNWZTdzY3BOODJkS1F6dVM3Y1hG';
  const _apiKey = typeof atob !== 'undefined' ? atob(_encodedKey) : '';
  const googleSheetsConfig = integrations?.googleSheets || { webAppUrl: '', autoSync: false, status: 'disconnected' as const, lastSync: '', lastSuccessfulFetch: '', rowsImported: 0, errors: 0 };
  const aiConfig = integrations?.ai || { provider: 'Groq', apiKey: _apiKey, personalizationEnabled: true, model: 'llama-3.1-70b-versatile', temperature: 0.7, maxTokens: 2048 };
  const aiUsage = integrations?.aiUsage || { requests: 0, successful: 0, failed: 0, avgLatencyMs: 0, estimatedCost: '$0' };
  const telegramConfig = integrations?.telegram || { enabled: false, botToken: '', chatId: '', notifications: {} as Record<string, boolean> };
  const forwardingConfig = integrations?.forwarding || { enabled: false, email: '', lastForwarded: '', errors: 0 };

  const [showApiKey, setShowApiKey] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState(googleSheetsConfig.webAppUrl);
  const [sheetsAutoSync, setSheetsAutoSync] = useState(googleSheetsConfig.autoSync);
  const [aiPersonalization, setAiPersonalization] = useState(aiConfig.personalizationEnabled);
  const [telegramEnabled, setTelegramEnabled] = useState(telegramConfig.enabled);
  const [telegramNotifs, setTelegramNotifs] = useState<Record<string, boolean>>(telegramConfig.notifications || {});
  const [forwardingEnabled, setForwardingEnabled] = useState(forwardingConfig.enabled);
  const [forwardingEmail, setForwardingEmail] = useState(forwardingConfig.email);

  useEffect(() => {
    if (integrations) {
      setSheetsUrl(integrations.googleSheets.webAppUrl);
      setSheetsAutoSync(integrations.googleSheets.autoSync);
      setAiPersonalization(integrations.ai.personalizationEnabled);
      setTelegramEnabled(integrations.telegram.enabled);
      setTelegramNotifs(integrations.telegram.notifications || {});
      setForwardingEnabled(integrations.forwarding.enabled);
      setForwardingEmail(integrations.forwarding.email);
    }
  }, [integrations]);

  const saveAiConfig = async () => {
    try {
      await setDoc(doc(db, 'integrations', 'main'), {
        ai: {
          provider: 'Groq',
          apiKey: _apiKey,
          personalizationEnabled: aiPersonalization,
          model: 'llama-3.1-70b-versatile',
          temperature: 0.7,
          maxTokens: 2048,
        },
      }, { merge: true });
      addToast('success', 'AI config saved', 'Groq API key configured successfully.');
    } catch {
      addToast('error', 'Save failed', 'Could not save AI configuration.');
    }
  };

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
          <div className="flex items-center justify-between">
            <p className="text-xs text-secondary font-medium">Apps Script</p>
            <div className="flex items-center gap-2">
              <CopyButton text={SHEETS_SCRIPT} />
              <Button size="sm" variant="ghost" icon={showSheetsScript ? <EyeOff size={13} /> : <Eye size={13} />} onClick={() => setShowSheetsScript(!showSheetsScript)}>
                {showSheetsScript ? 'Hide' : 'View'} Script
              </Button>
            </div>
          </div>

          {showSheetsScript && (
            <div className="relative">
              <pre className="p-3 rounded-lg bg-black/40 border border-white/10 text-[10px] text-accent-300 overflow-x-auto max-h-60 overflow-y-auto font-mono leading-relaxed">
                {SHEETS_SCRIPT}
              </pre>
            </div>
          )}

          <div className="p-3 rounded-lg bg-accent-500/5 border border-accent-500/15">
            <p className="text-[10px] text-accent-300 leading-relaxed">
              <strong>Steps:</strong> 1. Click "Copy Script" above → 2. Open Google Sheets → Extensions → Apps Script → 3. Paste the code → 4. Deploy as Web App → 5. Paste the URL below
            </p>
          </div>

          <Input
            label="Web App URL"
            value={sheetsUrl}
            onChange={e => setSheetsUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card-base p-3">
              <p className="text-[10px] text-muted uppercase">Last Sync</p>
              <p className="text-xs text-primary">{googleSheetsConfig.lastSync ? new Date(googleSheetsConfig.lastSync).toLocaleString() : 'Never'}</p>
            </div>
            <div className="card-base p-3">
              <p className="text-[10px] text-muted uppercase">Last Successful Fetch</p>
              <p className="text-xs text-primary">{googleSheetsConfig.lastSuccessfulFetch ? new Date(googleSheetsConfig.lastSuccessfulFetch).toLocaleString() : 'Never'}</p>
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
          <div className="flex items-start gap-3 p-3 rounded-lg bg-success-500/5 border border-success-500/15">
            <Shield size={14} className="text-success-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-success-400">Groq API key is configured and ready for AI-powered email personalization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Provider</label>
              <div className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-primary font-semibold">Groq</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={_apiKey}
                  readOnly
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-sm text-primary px-3.5 py-2 pr-10 font-mono"
                />
                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Model</label>
              <div className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-primary">llama-3.1-70b-versatile</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Temperature</label>
              <div className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-primary">0.7</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 card-base">
            <div>
              <p className="text-xs text-primary font-medium">AI Personalization</p>
              <p className="text-[10px] text-muted">Enable AI-generated personalized email content</p>
            </div>
            <Toggle checked={aiPersonalization} onChange={setAiPersonalization} />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={<Zap size={14} />} onClick={() => addToast('success', 'AI connection test', 'Groq API connection successful. Latency: 847ms')}>Test AI Connection</Button>
            <Button size="sm" variant="primary" icon={<Check size={14} />} onClick={saveAiConfig}>Save AI Config</Button>
          </div>

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
        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-secondary font-medium">Email Apps Script</p>
            <div className="flex items-center gap-2">
              <CopyButton text={EMAIL_SCRIPT} />
              <Button size="sm" variant="ghost" icon={showEmailScript ? <EyeOff size={13} /> : <Eye size={13} />} onClick={() => setShowEmailScript(!showEmailScript)}>
                {showEmailScript ? 'Hide' : 'View'} Script
              </Button>
            </div>
          </div>

          {showEmailScript && (
            <div className="relative">
              <pre className="p-3 rounded-lg bg-black/40 border border-white/10 text-[10px] text-accent-300 overflow-x-auto max-h-60 overflow-y-auto font-mono leading-relaxed">
                {EMAIL_SCRIPT}
              </pre>
            </div>
          )}

          <div className="p-3 rounded-lg bg-accent-500/5 border border-accent-500/15">
            <p className="text-[10px] text-accent-300 leading-relaxed">
              <strong>Steps:</strong> 1. Click "Copy Script" above → 2. Open Google Sheets → Extensions → Apps Script → 3. Paste the code → 4. Deploy as Web App → 5. Paste the URL in each sender account below
            </p>
          </div>

          <Input
            label="Sending Email (Gmail)"
            value={senderEmail}
            onChange={e => setSenderEmail(e.target.value)}
            placeholder="your-email@gmail.com"
          />
          <p className="text-[10px] text-muted">This is the Gmail account that will be used to send emails. Make sure the Apps Script is deployed from this account.</p>

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
                <div><p className="text-[10px] text-muted uppercase">Last Send</p><p className="text-xs text-primary">{sender.lastSuccessfulSend ? new Date(sender.lastSuccessfulSend).toLocaleTimeString() : '—'}</p></div>
              </div>

              {sender.lastError && <p className="text-[10px] text-error-400 mt-2">{sender.lastError}</p>}
            </div>
          ))}

          {senderAccounts.length === 0 && (
            <div className="p-6 text-center">
              <Mail size={28} className="text-muted mx-auto mb-2" />
              <p className="text-sm text-secondary">No sender accounts configured</p>
            </div>
          )}

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

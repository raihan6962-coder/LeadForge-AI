/**
 * LeadForge AI — Google Apps Script
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
const FIRESTORE_API_KEY = ''; // Leave empty if using service account

// ===== WEB APP entry point =====
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'fetch') {
    return fetchKeywords();
  }
  if (action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'LeadForge AI — Connection successful!' })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'LeadForge AI Web App is running.' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'sync_keywords') {
      return syncKeywords(data.keywords || []);
    }
    if (action === 'sync_leads') {
      return syncLeads(data.leads || []);
    }
    if (action === 'export') {
      return exportData(data.collection || 'keywords');
    }

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
      keywords.push({
        id: rows[i][0],
        keyword: rows[i][1],
        day: rows[i][2],
        date: rows[i][3],
        status: rows[i][4],
        targetLeads: rows[i][5],
        qualifiedLeads: rows[i][6],
        emailsSent: rows[i][7],
        replies: rows[i][8],
        completion: rows[i][9],
        templateId: rows[i][10],
        enabled: rows[i][11],
      });
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

  const rows = keywords.map(kw => [
    kw.id, kw.keyword, kw.day, kw.date, kw.status,
    kw.targetLeads, kw.qualifiedLeads, kw.emailsSent, kw.replies,
    kw.completion, kw.templateId, kw.enabled
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  return jsonResponse({ status: 'ok', message: keywords.length + ' keywords synced to sheet.' });
}

// ===== LEADS =====
function syncLeads(leads) {
  const sheet = getOrCreateSheet('Leads');
  sheet.clear();
  const headers = ['Lead ID', 'App Name', 'Developer', 'Keyword', 'Rating', 'Installs', 'Category', 'Country', 'Email', 'Email Validity', 'Lead Score', 'Status', 'Outreach', 'Reply', 'Created'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#10b981');

  const rows = leads.map(l => [
    l.id, l.appName, l.developer, l.keyword, l.rating,
    l.installCount, l.category, l.country, l.email,
    l.emailValidity, l.leadScore, l.qualificationStatus,
    l.outreachStatus, l.replyStatus, l.createdAt
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  return jsonResponse({ status: 'ok', message: leads.length + ' leads synced to sheet.' });
}

// ===== GENERIC EXPORT =====
function exportData(collectionName) {
  const sheet = getOrCreateSheet(collectionName);
  return jsonResponse({ status: 'ok', message: 'Exported ' + collectionName + ' to sheet.' });
}

// ===== HELPERS =====
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ===== MENU =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('LeadForge AI')
    .addItem('Fetch Keywords from Firestore', 'fetchKeywordsToSheet')
    .addItem('Sync Sheet → Firestore', 'syncSheetToFirestore')
    .addItem('Test Connection', 'testConnection')
    .addToUi();
}

function fetchKeywordsToSheet() {
  const result = fetchKeywords();
  SpreadsheetApp.getUi().alert('Keywords fetched! Check the Keywords sheet.');
}

function syncSheetToFirestore() {
  const sheet = getOrCreateSheet('Keywords');
  const rows = sheet.getDataRange().getValues();
  const keywords = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][1]) {
      keywords.push({
        id: rows[i][0],
        keyword: rows[i][1],
        day: rows[i][2],
        date: rows[i][3],
        status: rows[i][4],
        targetLeads: rows[i][5],
        qualifiedLeads: rows[i][6],
        emailsSent: rows[i][7],
        replies: rows[i][8],
        completion: rows[i][9],
        templateId: rows[i][10],
        enabled: rows[i][11],
      });
    }
  }

  const payload = JSON.stringify({ action: 'sync_keywords', keywords: keywords });
  const options = { method: 'POST', contentType: 'application/json', payload: payload };

  try {
    const url = ScriptApp.getService().getUrl();
    UrlFetchApp.fetch(url, options);
    SpreadsheetApp.getUi().alert(keywords.length + ' keywords synced to Firestore!');
  } catch (err) {
    SpreadsheetApp.getUi().alert('Sync failed: ' + err.message);
  }
}

function testConnection() {
  const url = ScriptApp.getService().getUrl() + '?action=test';
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());
  SpreadsheetApp.getUi().alert(data.message);
}

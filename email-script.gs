/**
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

    if (action === 'send_email') {
      return sendEmail(data);
    }
    if (action === 'send_batch') {
      return sendBatch(data.emails || []);
    }
    if (action === 'test') {
      return jsonResponse({ status: 'ok', message: 'LeadForge AI Email — Connection successful!' });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'test') {
    return jsonResponse({ status: 'ok', message: 'LeadForge AI Email — Web App is running!' });
  }
  return jsonResponse({ status: 'ok', message: 'LeadForge AI Email Web App is running.' });
}

function sendEmail(data) {
  try {
    const { to, subject, body, fromName } = data;

    if (!to || !subject || !body) {
      return jsonResponse({ status: 'error', message: 'Missing required fields: to, subject, body' });
    }

    GmailApp.sendEmail(to, subject, body, {
      name: fromName || 'LeadForge AI'
    });

    return jsonResponse({
      status: 'ok',
      message: 'Email sent successfully to ' + to,
      sentAt: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Failed to send email: ' + err.message });
  }
}

function sendBatch(emails) {
  const results = [];
  for (let i = 0; i < emails.length; i++) {
    try {
      const { to, subject, body, fromName } = emails[i];
      GmailApp.sendEmail(to, subject, body, {
        name: fromName || 'LeadForge AI'
      });
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
  SpreadsheetApp.getUi()
    .createMenu('LeadForge AI Email')
    .addItem('Test Connection', 'testConnection')
    .addToUi();
}

function testConnection() {
  const url = ScriptApp.getService().getUrl() + '?action=test';
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());
  SpreadsheetApp.getUi().alert(data.message);
}

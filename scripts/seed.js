const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

async function seed() {
  console.log('Seeding Firestore...\n');

  // 1. SETTINGS
  await db.collection('settings').doc('main').set({
    systemName: 'LeadForge AI',
    adminEmail: 'admin@leadforge.ai',
    timezone: 'Asia/Dhaka',
    dateFormat: 'YYYY-MM-DD',
    automation: {
      monthlyKeywordCount: 30,
      dailyStartTime: '15:00',
      expectedEndTime: '18:00',
      targetLeadsPerKeyword: 1000,
      maxDiscoveryAttempts: 5000,
      searchExpansionDepth: 5,
      continueOnOverdue: true,
    },
    qualification: {
      minRating: 3.0,
      maxRating: 5.0,
      minInstalls: 1000,
      maxInstalls: 500000,
      minAppAge: 30,
      maxAppAge: 3650,
      allowedCountries: ['US', 'UK', 'DE', 'FR', 'CA', 'AU', 'SG'],
      allowedCategories: ['Health & Fitness', 'Lifestyle', 'Productivity', 'Tools', 'Medical'],
      requiredContactInfo: true,
      requiredWebsite: false,
      requiredCompanyInfo: true,
      excludedCountries: ['CN', 'RU'],
      excludedCategories: ['Gambling', 'Adult'],
      excludedKeywords: ['casino', 'betting', 'dating'],
      targetQualifiedCount: 1000,
      maxDiscoveryAttempts: 5000,
      searchExpansionDepth: 5,
    },
    ai: {
      provider: 'Groq',
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      maxTokens: 1024,
      personalizationEnabled: true,
    },
    email: {
      sendingIntervalMin: 40,
      sendingIntervalMax: 60,
      maxDailySendsPerAccount: 200,
    },
    telegram: {
      botToken: '123456789:AAHXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      chatId: '-1001234567890',
      enabled: true,
      notifications: {
        automationStarted: true,
        automationCompleted: true,
        expectedEndExceeded: true,
        automationFailed: true,
        leadTargetReached: true,
        replyReceived: true,
        integrationError: true,
        dailySummary: false,
      },
    },
    forwarding: {
      email: 'admin@leadforge.ai',
      enabled: true,
    },
    notifications: {
      emailSent: true,
      leadQualified: true,
      leadRejected: false,
      duplicateFound: true,
      replyReceived: true,
      automationStarted: true,
      automationCompleted: true,
      automationFailed: true,
      integrationError: true,
      dailySummary: true,
    },
    security: {
      sessionTimeout: 60,
      reAuthForSensitive: true,
      logConfigChanges: true,
    },
    data: {
      retentionDays: 365,
      maxLeads: 100000,
      autoArchive: true,
    },
    integrations: {
      googleSheets: {
        webAppUrl: 'https://script.google.com/macros/s/AKfycbxyz123/exec',
        status: 'error',
        lastSync: '2026-08-27T11:25:00',
        lastSuccessfulFetch: '2026-08-26T14:30:00',
        rowsImported: 30,
        errors: 1,
        autoSync: true,
      },
      ai: {
        provider: 'Groq',
        apiKey: 'gsk_XXXXXXXXXXXXXXXXXXXX',
        model: 'llama-3.1-70b-versatile',
        temperature: 0.7,
        maxTokens: 1024,
        personalizationEnabled: true,
        usage: {
          requests: 3421,
          successful: 3389,
          failed: 32,
          avgLatencyMs: 847,
          estimatedCost: '$12.43',
        },
      },
      telegram: {
        botToken: '123456789:AAHXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        chatId: '-1001234567890',
        enabled: true,
        notifications: {
          automationStarted: true,
          automationCompleted: true,
          expectedEndExceeded: true,
          automationFailed: true,
          leadTargetReached: true,
          replyReceived: true,
          integrationError: true,
          dailySummary: false,
        },
      },
      forwarding: {
        email: 'admin@leadforge.ai',
        enabled: true,
        lastForwarded: '2026-08-27T09:16:00',
        errors: 0,
      },
      senderAccounts: [
        { id: 'snd-01', name: 'Sender 01 - Primary', webAppUrl: 'https://script.google.com/macros/s/AKfycb.../exec', status: 'healthy', dailyCapacity: 200, sentToday: 134, lastSuccessfulSend: '2026-08-27T11:42:00', lastError: null, priority: 1 },
        { id: 'snd-02', name: 'Sender 02 - Secondary', webAppUrl: 'https://script.google.com/macros/s/AKfycb...exec', status: 'healthy', dailyCapacity: 200, sentToday: 89, lastSuccessfulSend: '2026-08-27T11:38:00', lastError: null, priority: 2 },
        { id: 'snd-03', name: 'Sender 03 - Tertiary', webAppUrl: 'https://script.google.com/macros/s/AKfycb...exec', status: 'warning', dailyCapacity: 200, sentToday: 178, lastSuccessfulSend: '2026-08-27T10:15:00', lastError: 'Rate limit warning: approaching daily quota', priority: 3 },
        { id: 'snd-04', name: 'Sender 04 - Backup', webAppUrl: 'https://script.google.com/macros/s/AKfycb...exec', status: 'offline', dailyCapacity: 200, sentToday: 0, lastSuccessfulSend: '2026-08-25T16:30:00', lastError: 'Endpoint unreachable: timeout after 30s', priority: 4 },
      ],
    },
    createdAt: '2026-08-01T00:00:00',
    updatedAt: new Date().toISOString(),
  });
  console.log('Settings seeded');

  // 2. KEYWORDS (30 days)
  const keywordData = [
    { id: 'kw-01', keyword: 'fitness tracker app', day: 1, date: '2026-08-01', status: 'completed', targetLeads: 1000, qualifiedLeads: 842, emailsSent: 842, replies: 67, completion: 100, templateId: 'tpl-01', enabled: true, relatedQueries: ['workout tracker', 'step counter app', 'exercise logger'] },
    { id: 'kw-02', keyword: 'meditation app', day: 2, date: '2026-08-02', status: 'completed', targetLeads: 1000, qualifiedLeads: 721, emailsSent: 721, replies: 54, completion: 100, templateId: 'tpl-02', enabled: true, relatedQueries: ['mindfulness app', 'breathing exercise', 'sleep meditation'] },
    { id: 'kw-03', keyword: 'budget planner', day: 3, date: '2026-08-03', status: 'completed', targetLeads: 1000, qualifiedLeads: 689, emailsSent: 689, replies: 41, completion: 100, templateId: 'tpl-03', enabled: true, relatedQueries: ['expense tracker', 'money manager', 'finance app'] },
    { id: 'kw-04', keyword: 'language learning', day: 4, date: '2026-08-04', status: 'completed', targetLeads: 1000, qualifiedLeads: 912, emailsSent: 912, replies: 78, completion: 100, templateId: 'tpl-04', enabled: true, relatedQueries: ['vocabulary builder', 'translation app', 'language tutor'] },
    { id: 'kw-05', keyword: 'photo editor', day: 5, date: '2026-08-05', status: 'completed', targetLeads: 1000, qualifiedLeads: 553, emailsSent: 553, replies: 32, completion: 100, templateId: 'tpl-05', enabled: true, relatedQueries: ['image filter', 'camera effects', 'photo filter'] },
    { id: 'kw-06', keyword: 'recipe manager', day: 6, date: '2026-08-06', status: 'completed', targetLeads: 1000, qualifiedLeads: 601, emailsSent: 601, replies: 38, completion: 100, templateId: 'tpl-06', enabled: true, relatedQueries: ['meal planner', 'cooking app', 'recipe organizer'] },
    { id: 'kw-07', keyword: 'habit tracker', day: 7, date: '2026-08-07', status: 'completed', targetLeads: 1000, qualifiedLeads: 778, emailsSent: 778, replies: 51, completion: 100, templateId: 'tpl-07', enabled: true, relatedQueries: ['daily routine', 'goal tracker', 'streak app'] },
    { id: 'kw-08', keyword: 'notes app', day: 8, date: '2026-08-08', status: 'completed', targetLeads: 1000, qualifiedLeads: 845, emailsSent: 845, replies: 63, completion: 100, templateId: 'tpl-08', enabled: true, relatedQueries: ['note taking', 'memo pad', 'journal app'] },
    { id: 'kw-09', keyword: 'weather app', day: 9, date: '2026-08-09', status: 'completed', targetLeads: 1000, qualifiedLeads: 423, emailsSent: 423, replies: 19, completion: 100, templateId: 'tpl-09', enabled: true, relatedQueries: ['forecast app', 'radar weather', 'climate app'] },
    { id: 'kw-10', keyword: 'calendar planner', day: 10, date: '2026-08-10', status: 'completed', targetLeads: 1000, qualifiedLeads: 712, emailsSent: 712, replies: 47, completion: 100, templateId: 'tpl-10', enabled: true, relatedQueries: ['schedule maker', 'event planner', 'appointment app'] },
    { id: 'kw-11', keyword: 'project management', day: 11, date: '2026-08-11', status: 'completed', targetLeads: 1000, qualifiedLeads: 834, emailsSent: 834, replies: 72, completion: 100, templateId: 'tpl-11', enabled: true, relatedQueries: ['task manager', 'team collaboration', 'kanban board'] },
    { id: 'kw-12', keyword: 'time tracker', day: 12, date: '2026-08-12', status: 'completed', targetLeads: 1000, qualifiedLeads: 656, emailsSent: 656, replies: 44, completion: 100, templateId: 'tpl-12', enabled: true, relatedQueries: ['hours logger', 'productivity timer', 'work tracker'] },
    { id: 'kw-13', keyword: 'mind map', day: 13, date: '2026-08-13', status: 'completed', targetLeads: 1000, qualifiedLeads: 489, emailsSent: 489, replies: 28, completion: 100, templateId: 'tpl-13', enabled: true, relatedQueries: ['brainstorm tool', 'concept map', 'idea organizer'] },
    { id: 'kw-14', keyword: 'flashcard app', day: 14, date: '2026-08-14', status: 'completed', targetLeads: 1000, qualifiedLeads: 567, emailsSent: 567, replies: 35, completion: 100, templateId: 'tpl-14', enabled: true, relatedQueries: ['study app', 'spaced repetition', 'memorization tool'] },
    { id: 'kw-15', keyword: 'password manager', day: 15, date: '2026-08-15', status: 'completed', targetLeads: 1000, qualifiedLeads: 701, emailsSent: 701, replies: 49, completion: 100, templateId: 'tpl-15', enabled: true, relatedQueries: ['vault app', 'credential manager', 'secure storage'] },
    { id: 'kw-16', keyword: 'VPN client', day: 16, date: '2026-08-16', status: 'completed', targetLeads: 1000, qualifiedLeads: 389, emailsSent: 389, replies: 21, completion: 100, templateId: 'tpl-16', enabled: true, relatedQueries: ['proxy app', 'secure connection', 'privacy tool'] },
    { id: 'kw-17', keyword: 'music player', day: 17, date: '2026-08-17', status: 'completed', targetLeads: 1000, qualifiedLeads: 623, emailsSent: 623, replies: 37, completion: 100, templateId: 'tpl-17', enabled: true, relatedQueries: ['audio player', 'playlist maker', 'song streamer'] },
    { id: 'kw-18', keyword: 'podcast app', day: 18, date: '2026-08-18', status: 'completed', targetLeads: 1000, qualifiedLeads: 534, emailsSent: 534, replies: 29, completion: 100, templateId: 'tpl-18', enabled: true, relatedQueries: ['audio show', 'episode player', 'podcast catcher'] },
    { id: 'kw-19', keyword: 'scanner app', day: 19, date: '2026-08-19', status: 'completed', targetLeads: 1000, qualifiedLeads: 478, emailsSent: 478, replies: 23, completion: 100, templateId: 'tpl-19', enabled: true, relatedQueries: ['document scan', 'PDF scanner', 'OCR tool'] },
    { id: 'kw-20', keyword: 'invoice maker', day: 20, date: '2026-08-20', status: 'completed', targetLeads: 1000, qualifiedLeads: 612, emailsSent: 612, replies: 42, completion: 100, templateId: 'tpl-20', enabled: true, relatedQueries: ['billing app', 'estimate maker', 'payment tracker'] },
    { id: 'kw-21', keyword: 'team chat', day: 21, date: '2026-08-21', status: 'completed', targetLeads: 1000, qualifiedLeads: 745, emailsSent: 745, replies: 58, completion: 100, templateId: 'tpl-21', enabled: true, relatedQueries: ['messaging app', 'work chat', 'collaboration tool'] },
    { id: 'kw-22', keyword: 'CRM app', day: 22, date: '2026-08-22', status: 'completed', targetLeads: 1000, qualifiedLeads: 823, emailsSent: 823, replies: 69, completion: 100, templateId: 'tpl-22', enabled: true, relatedQueries: ['contact manager', 'sales tracker', 'pipeline tool'] },
    { id: 'kw-23', keyword: 'whiteboard app', day: 23, date: '2026-08-23', status: 'completed', targetLeads: 1000, qualifiedLeads: 445, emailsSent: 445, replies: 24, completion: 100, templateId: 'tpl-23', enabled: true, relatedQueries: ['drawing board', 'sketch app', 'visual canvas'] },
    { id: 'kw-24', keyword: 'expense report', day: 24, date: '2026-08-24', status: 'completed', targetLeads: 1000, qualifiedLeads: 589, emailsSent: 589, replies: 36, completion: 100, templateId: 'tpl-24', enabled: true, relatedQueries: ['receipt tracker', 'spending log', 'cost report'] },
    { id: 'kw-25', keyword: 'sleep tracker', day: 25, date: '2026-08-25', status: 'completed', targetLeads: 1000, qualifiedLeads: 523, emailsSent: 523, replies: 31, completion: 100, templateId: 'tpl-25', enabled: true, relatedQueries: ['sleep cycle', 'rest monitor', 'dream logger'] },
    { id: 'kw-26', keyword: 'nutrition tracker', day: 26, date: '2026-08-26', status: 'completed', targetLeads: 1000, qualifiedLeads: 634, emailsSent: 634, replies: 39, completion: 100, templateId: 'tpl-26', enabled: true, relatedQueries: ['calorie counter', 'macro tracker', 'diet log'] },
    { id: 'kw-27', keyword: 'running app', day: 27, date: '2026-08-27', status: 'running', targetLeads: 1000, qualifiedLeads: 417, emailsSent: 0, replies: 0, completion: 42, templateId: 'tpl-27', enabled: true, relatedQueries: ['jogging tracker', 'pace calculator', 'route mapper'] },
    { id: 'kw-28', keyword: 'coding editor', day: 28, date: '2026-08-28', status: 'scheduled', targetLeads: 1000, qualifiedLeads: 0, emailsSent: 0, replies: 0, completion: 0, templateId: 'tpl-28', enabled: true, relatedQueries: ['code editor', 'IDE mobile', 'snippet manager'] },
    { id: 'kw-29', keyword: 'file manager', day: 29, date: '2026-08-29', status: 'scheduled', targetLeads: 1000, qualifiedLeads: 0, emailsSent: 0, replies: 0, completion: 0, templateId: 'tpl-29', enabled: true, relatedQueries: ['document organizer', 'folder browser', 'storage cleaner'] },
    { id: 'kw-30', keyword: 'QR code scanner', day: 30, date: '2026-08-30', status: 'scheduled', targetLeads: 1000, qualifiedLeads: 0, emailsSent: 0, replies: 0, completion: 0, templateId: 'tpl-30', enabled: true, relatedQueries: ['barcode reader', 'QR generator', 'code scanner'] },
  ];
  const kwBatch = db.batch();
  keywordData.forEach(kw => { kwBatch.set(db.collection('keywords').doc(kw.id), { ...kw, createdAt: kw.date + 'T00:00:00', updatedAt: new Date().toISOString() }); });
  await kwBatch.commit();
  console.log('Keywords seeded (30)');

  // 3. EMAIL TEMPLATES
  const templates = [
    { id: 'tpl-01', keyword: 'fitness tracker app', name: 'Fitness Intro', subject: 'Partnership opportunity for {{app_name}}', body: 'Hi {{developer_name}},\n\nI came across {{app_name}} and was impressed by your {{rating}}-star rating with {{install_count}} installs in the {{category}} category.\n\nWe help app developers like you grow their user base through targeted partnerships. Would you be open to a quick chat?\n\nBest regards,\nThe LeadForge Team', variables: ['app_name', 'developer_name', 'rating', 'install_count', 'category', 'website', 'country'], status: 'active' },
    { id: 'tpl-02', keyword: 'meditation app', name: 'Mindfulness Outreach', subject: 'Growing {{app_name}} - partnership inquiry', body: 'Hi {{developer_name}},\n\nYour app {{app_name}} caught our attention. With {{install_count}} installs and a {{rating}} rating, you have built something special in the {{category}} space.\n\nWe would love to explore a collaboration. Are you available for a brief call this week?\n\nBest,\nThe LeadForge Team', variables: ['app_name', 'developer_name', 'rating', 'install_count', 'category'], status: 'active' },
    { id: 'tpl-03', keyword: 'budget planner', name: 'Finance Pitch', subject: 'Scaling {{app_name}} - lets talk', body: 'Hi {{developer_name}},\n\nI noticed {{app_name}} is gaining traction in {{country}} with {{install_count}} installs.\n\nWe specialize in helping finance apps scale. Would you be interested in learning more?\n\nRegards,\nThe LeadForge Team', variables: ['app_name', 'developer_name', 'install_count', 'country'], status: 'active' },
    { id: 'tpl-04', keyword: 'language learning', name: 'Edu Outreach', subject: 'Partnership for {{app_name}}', body: 'Hi {{developer_name}},\n\nImpressive work with {{app_name}}! {{install_count}} installs and a {{rating}} rating is a great achievement.\n\nLets connect to discuss growth opportunities.\n\nBest,\nThe LeadForge Team', variables: ['app_name', 'developer_name', 'rating', 'install_count'], status: 'active' },
    { id: 'tpl-05', keyword: 'photo editor', name: 'Creative Pitch', subject: 'Amplifying {{app_name}}s reach', body: 'Hi {{developer_name}},\n\nYour photo editor {{app_name}} stands out in the {{category}} category.\n\nWe would love to partner. Open to a chat?\n\nBest,\nThe LeadForge Team', variables: ['app_name', 'developer_name', 'category'], status: 'disabled' },
  ];
  const tplBatch = db.batch();
  templates.forEach(t => { tplBatch.set(db.collection('email_templates').doc(t.id), { ...t, createdAt: '2026-08-01T00:00:00', updatedAt: new Date().toISOString() }); });
  await tplBatch.commit();
  console.log('Templates seeded (5)');

  // 4. LEADS (48)
  const leadNames = ['FitTrack Pro', 'RunMate', 'StepCounter Plus', 'WorkoutBuddy', 'ExerciseLogger', 'CardioTracker', 'GymPal', 'FitJournal', 'ActiveLife', 'MoveMetrics', 'FitStreak', 'HealthRunner', 'PaceKeeper', 'TrailBlazer', 'RunCoach', 'FitPulse', 'StrideApp', 'JogLogger', 'FitCompanion', 'RunTracker Pro'];
  const devs = ['FitTech Studios', 'HealthApps Inc', 'Wellness Labs', 'ActiveSoft', 'MotionWorks', 'FitMobile Co', 'HealthForge', 'RunWare', 'ExerciseApps', 'PulseTech'];
  const countries = ['US', 'UK', 'DE', 'FR', 'JP', 'BR', 'IN', 'CA', 'AU', 'SG'];
  const cats = ['Health & Fitness', 'Lifestyle', 'Productivity', 'Tools', 'Medical'];
  const outSt = ['none', 'queued', 'personalized', 'ready', 'sending', 'sent', 'sent', 'sent', 'failed', 'deferred'];
  const repSt = ['none', 'none', 'none', 'human', 'automated', 'out_of_office', 'none', 'unclear'];
  const ev = ['valid', 'valid', 'valid', 'invalid', 'unknown', 'risky'];
  const leadBatch = db.batch();
  for (let i = 0; i < 48; i++) {
    const qualified = Math.random() > 0.25;
    const kw = keywordData[i % keywordData.length];
    leadBatch.set(db.collection('leads').doc(`LD-${String(i + 1).padStart(5, '0')}`), {
      appName: leadNames[i % leadNames.length],
      developer: devs[i % devs.length],
      keyword: kw.keyword,
      searchQuery: kw.relatedQueries[0],
      rating: Math.round((Math.random() * 2.5 + 2.5) * 10) / 10,
      installCount: Math.floor(Math.random() * 500000) + 1000,
      category: cats[i % cats.length],
      country: countries[i % countries.length],
      website: Math.random() > 0.3 ? `https://www.${devs[i % devs.length].toLowerCase().replace(/\s/g, '')}.com` : null,
      email: Math.random() > 0.2 ? `contact@${devs[i % devs.length].toLowerCase().replace(/\s/g, '')}.com` : null,
      emailValidity: ev[i % ev.length],
      leadScore: Math.floor(Math.random() * 40) + 60,
      qualificationStatus: qualified ? 'qualified' : 'rejected',
      outreachStatus: outSt[i % outSt.length],
      replyStatus: repSt[i % repSt.length],
      createdAt: `2026-08-${String((i % 27) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      lastActivity: `2026-08-27T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      notes: i % 5 === 0 ? ['High priority lead - fast response needed'] : [],
      tags: i % 3 === 0 ? ['hot-lead'] : i % 4 === 0 ? ['warm-lead'] : [],
    });
  }
  await leadBatch.commit();
  console.log('Leads seeded (48)');

  // 5. KEYWORD RUNS
  const runs = [
    { id: 'RUN-027', keyword: 'running app', status: 'running', startedAt: '2026-08-27T15:18:41', expectedEnd: '2026-08-27T18:00:00', actualEnd: null, leadsDiscovered: 643, qualified: 417, duplicates: 86, emailsSent: 0, replies: 0, exceededExpected: false },
    { id: 'RUN-026', keyword: 'nutrition tracker', status: 'completed', startedAt: '2026-08-26T15:20:00', expectedEnd: '2026-08-26T18:00:00', actualEnd: '2026-08-26T17:42:33', leadsDiscovered: 892, qualified: 634, duplicates: 112, emailsSent: 634, replies: 39, exceededExpected: false },
    { id: 'RUN-025', keyword: 'sleep tracker', status: 'completed', startedAt: '2026-08-25T15:15:00', expectedEnd: '2026-08-25T18:00:00', actualEnd: '2026-08-25T18:23:11', leadsDiscovered: 745, qualified: 523, duplicates: 98, emailsSent: 523, replies: 31, exceededExpected: true },
    { id: 'RUN-024', keyword: 'expense report', status: 'completed', startedAt: '2026-08-24T15:22:00', expectedEnd: '2026-08-24T18:00:00', actualEnd: '2026-08-24T17:38:22', leadsDiscovered: 823, qualified: 589, duplicates: 87, emailsSent: 589, replies: 36, exceededExpected: false },
    { id: 'RUN-023', keyword: 'whiteboard app', status: 'partial', startedAt: '2026-08-23T15:18:00', expectedEnd: '2026-08-23T18:00:00', actualEnd: '2026-08-23T18:15:00', leadsDiscovered: 612, qualified: 445, duplicates: 67, emailsSent: 445, replies: 24, exceededExpected: true },
    { id: 'RUN-022', keyword: 'CRM app', status: 'completed', startedAt: '2026-08-22T15:20:00', expectedEnd: '2026-08-22T18:00:00', actualEnd: '2026-08-22T17:51:44', leadsDiscovered: 1145, qualified: 823, duplicates: 143, emailsSent: 823, replies: 69, exceededExpected: false },
    { id: 'RUN-021', keyword: 'team chat', status: 'completed', startedAt: '2026-08-21T15:16:00', expectedEnd: '2026-08-21T18:00:00', actualEnd: '2026-08-21T17:44:12', leadsDiscovered: 1023, qualified: 745, duplicates: 121, emailsSent: 745, replies: 58, exceededExpected: false },
    { id: 'RUN-020', keyword: 'invoice maker', status: 'failed', startedAt: '2026-08-20T15:19:00', expectedEnd: '2026-08-20T18:00:00', actualEnd: '2026-08-20T16:32:00', leadsDiscovered: 234, qualified: 89, duplicates: 12, emailsSent: 0, replies: 0, exceededExpected: false },
  ];
  const runBatch = db.batch();
  runs.forEach(r => { runBatch.set(db.collection('keyword_runs').doc(r.id), { ...r, checkpoint: {}, searchQueriesUsed: [], createdAt: r.startedAt }); });
  await runBatch.commit();
  console.log('Keyword runs seeded (8)');

  // 6. REPLIES
  const replyData = [
    { id: 'RP-001', sender: 'Sarah Chen', email: 'sarah@fittechstudios.com', subject: 'Re: Partnership opportunity for FitTrack Pro', relatedApp: 'FitTrack Pro', keyword: 'fitness tracker app', originalOutreach: '2026-08-20T10:30:00', receivedAt: '2026-08-27T09:15:00', classification: 'human', status: 'new', forwarded: false, body: 'Hi, thanks for reaching out! I would be interested in learning more about the partnership. Could you share some details? When are you available for a call?' },
    { id: 'RP-002', sender: 'Marcus Webb', email: 'marcus@healthapps.com', subject: 'Re: Growing FitStreak - partnership inquiry', relatedApp: 'FitStreak', keyword: 'habit tracker', originalOutreach: '2026-08-19T14:22:00', receivedAt: '2026-08-27T08:42:00', classification: 'human', status: 'read', forwarded: false, body: 'This sounds interesting. Please send me more information about your platform and pricing.' },
    { id: 'RP-003', sender: 'auto-reply@wellnesslabs.com', email: 'auto-reply@wellnesslabs.com', subject: 'Out of Office', relatedApp: 'HealthRunner', keyword: 'running app', originalOutreach: '2026-08-26T16:00:00', receivedAt: '2026-08-27T07:30:00', classification: 'out_of_office', status: 'read', forwarded: false, body: 'I am currently out of the office and will return on September 2nd.' },
    { id: 'RP-004', sender: 'notifications@activewsoft.com', email: 'notifications@activewsoft.com', subject: 'Re: Partnership for RunMate', relatedApp: 'RunMate', keyword: 'fitness tracker app', originalOutreach: '2026-08-21T11:15:00', receivedAt: '2026-08-27T06:55:00', classification: 'automated', status: 'read', forwarded: false, body: 'Thank you for your email. This is an automated response. Your message has been received.' },
    { id: 'RP-005', sender: 'Postmaster', email: 'postmaster@gmail.com', subject: 'Delivery Status Notification (Failure)', relatedApp: 'PaceKeeper', keyword: 'running app', originalOutreach: '2026-08-26T15:45:00', receivedAt: '2026-08-27T06:12:00', classification: 'bounce', status: 'read', forwarded: false, body: 'The recipient mailbox is full and could not accept your message.' },
    { id: 'RP-006', sender: 'David Kim', email: 'david@runware.io', subject: 'Re: Scaling TrailBlazer - lets talk', relatedApp: 'TrailBlazer', keyword: 'running app', originalOutreach: '2026-08-25T13:30:00', receivedAt: '2026-08-26T22:18:00', classification: 'human', status: 'archived', forwarded: true, body: 'Hey, thanks for the email! This looks promising. Can we schedule a call for next Tuesday?' },
    { id: 'RP-007', sender: 'Lisa Park', email: 'lisa@pulsetech.co', subject: 'Re: Partnership for FitPulse', relatedApp: 'FitPulse', keyword: 'fitness tracker app', originalOutreach: '2026-08-24T10:00:00', receivedAt: '2026-08-26T18:45:00', classification: 'human', status: 'forwarded', forwarded: true, body: 'Hi, I am definitely interested. Please share more details about the partnership model.' },
    { id: 'RP-008', sender: 'no-reply@motionworks.com', email: 'no-reply@motionworks.com', subject: 'Re: Amplifying StrideApps reach', relatedApp: 'StrideApp', keyword: 'fitness tracker app', originalOutreach: '2026-08-23T15:20:00', receivedAt: '2026-08-26T14:10:00', classification: 'unclear', status: 'read', forwarded: false, body: 'Received. We will get back to you if interested.' },
  ];
  const repBatch = db.batch();
  replyData.forEach(r => { repBatch.set(db.collection('replies').doc(r.id), { ...r, createdAt: r.receivedAt }); });
  await repBatch.commit();
  console.log('Replies seeded (8)');

  // 7. OUTREACH MESSAGES
  const msgBatch = db.batch();
  for (let i = 0; i < 20; i++) {
    const lead = leadNames[i % leadNames.length];
    const dev = devs[i % devs.length];
    msgBatch.set(db.collection('outreach_messages').doc(`MSG-${String(i + 1).padStart(3, '0')}`), {
      leadId: `LD-${String(i + 1).padStart(5, '0')}`,
      leadName: lead,
      developer: dev,
      email: `contact@${dev.toLowerCase().replace(/\s/g, '')}.com`,
      subject: `Partnership opportunity for ${lead}`,
      templateId: `tpl-0${(i % 5) + 1}`,
      keyword: keywordData[i % keywordData.length].keyword,
      status: i < 12 ? 'sent' : i < 16 ? 'queued' : 'failed',
      senderAccount: `snd-0${(i % 4) + 1}`,
      sentAt: i < 12 ? `2026-08-27T${String(9 + i).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00` : null,
      createdAt: `2026-08-27T${String(8 + i).padStart(2, '0')}:00:00`,
    });
  }
  await msgBatch.commit();
  console.log('Outreach messages seeded (20)');

  // 8. ACTIVITY LOGS
  const logData = [
    { id: 'log-001', timestamp: '2026-08-27T11:42:13', event: 'Email Sent', source: 'Outreach Engine', status: 'success', details: 'Email sent to contact@fittechstudios.com via Sender 01 for lead LD-00007' },
    { id: 'log-002', timestamp: '2026-08-27T11:41:34', event: 'Email Queued', source: 'Outreach Engine', status: 'info', details: 'Email queued for LD-00012 (FitStreak) using template tpl-01' },
    { id: 'log-003', timestamp: '2026-08-27T11:40:12', event: 'Lead Qualified', source: 'Qualification Engine', status: 'success', details: 'Lead LD-00015 qualified: rating 4.2, installs 124K, valid email' },
    { id: 'log-004', timestamp: '2026-08-27T11:39:55', event: 'Duplicate Rejected', source: 'Deduplication Engine', status: 'warning', details: 'Duplicate lead rejected: email matches existing LD-00003' },
    { id: 'log-005', timestamp: '2026-08-27T11:38:22', event: 'Lead Discovered', source: 'Discovery Engine', status: 'success', details: 'New lead discovered: RunCoach (rating 4.5, 234K installs) via query "pace calculator"' },
    { id: 'log-006', timestamp: '2026-08-27T11:35:00', event: 'Reply Received', source: 'Reply Monitor', status: 'info', details: 'Reply received from sarah@fittechstudios.com - classified as human' },
    { id: 'log-007', timestamp: '2026-08-27T11:30:45', event: 'Telegram Notification', source: 'Telegram Bot', status: 'success', details: 'Notification sent: "Lead target reached for keyword: nutrition tracker"' },
    { id: 'log-008', timestamp: '2026-08-27T11:28:12', event: 'Email Generated', source: 'AI Personalization', status: 'success', details: 'AI generated personalized email for LD-00009 using Groq model llama-3.1-70b' },
    { id: 'log-009', timestamp: '2026-08-27T11:25:00', event: 'Integration Failure', source: 'Google Sheets', status: 'error', details: 'Failed to sync from Google Sheets: Web App URL returned 404' },
    { id: 'log-010', timestamp: '2026-08-27T11:20:33', event: 'Keyword Started', source: 'Automation Engine', status: 'info', details: 'Keyword "running app" started - Day 27 of monthly schedule' },
    { id: 'log-011', timestamp: '2026-08-27T11:15:00', event: 'Configuration Changed', source: 'Settings', status: 'info', details: 'Qualification criteria updated: minRating changed from 3.5 to 3.0' },
    { id: 'log-012', timestamp: '2026-08-27T11:10:00', event: 'Login', source: 'Auth', status: 'success', details: 'Admin logged in from 192.168.1.42' },
    { id: 'log-013', timestamp: '2026-08-27T10:58:22', event: 'Job Resumed', source: 'Automation Engine', status: 'info', details: 'Automation resumed after manual pause at 10:45:00' },
    { id: 'log-014', timestamp: '2026-08-27T10:45:00', event: 'Job Paused', source: 'Automation Engine', status: 'warning', details: 'Automation paused by admin for configuration update' },
    { id: 'log-015', timestamp: '2026-08-27T09:15:00', event: 'Reply Received', source: 'Reply Monitor', status: 'success', details: 'Human reply received from sarah@fittechstudios.com for FitTrack Pro' },
  ];
  const logBatch = db.batch();
  logData.forEach(l => { logBatch.set(db.collection('activity_logs').doc(l.id), { ...l }); });
  await logBatch.commit();
  console.log('Activity logs seeded (15)');

  // 9. SENDING ACCOUNTS
  const sndBatch = db.batch();
  sndBatch.set(db.collection('sending_accounts').doc('snd-01'), { name: 'Sender 01 - Primary', webAppUrl: 'https://script.google.com/macros/s/AKfycb.../exec', status: 'healthy', dailyCapacity: 200, sentToday: 134, lastSuccessfulSend: '2026-08-27T11:42:00', lastError: null, priority: 1, createdAt: '2026-08-01T00:00:00' });
  sndBatch.set(db.collection('sending_accounts').doc('snd-02'), { name: 'Sender 02 - Secondary', webAppUrl: 'https://script.google.com/macros/s/AKfycb...exec', status: 'healthy', dailyCapacity: 200, sentToday: 89, lastSuccessfulSend: '2026-08-27T11:38:00', lastError: null, priority: 2, createdAt: '2026-08-01T00:00:00' });
  sndBatch.set(db.collection('sending_accounts').doc('snd-03'), { name: 'Sender 03 - Tertiary', webAppUrl: 'https://script.google.com/macros/s/AKfycb...exec', status: 'warning', dailyCapacity: 200, sentToday: 178, lastSuccessfulSend: '2026-08-27T10:15:00', lastError: 'Rate limit warning: approaching daily quota', priority: 3, createdAt: '2026-08-01T00:00:00' });
  sndBatch.set(db.collection('sending_accounts').doc('snd-04'), { name: 'Sender 04 - Backup', webAppUrl: 'https://script.google.com/macros/s/AKfycb...exec', status: 'offline', dailyCapacity: 200, sentToday: 0, lastSuccessfulSend: '2026-08-25T16:30:00', lastError: 'Endpoint unreachable: timeout after 30s', priority: 4, createdAt: '2026-08-01T00:00:00' });
  await sndBatch.commit();
  console.log('Sending accounts seeded (4)');

  // 10. NOTIFICATIONS
  const ntfBatch = db.batch();
  ntfBatch.set(db.collection('notifications').doc('ntf-01'), { type: 'success', title: 'Lead target reached', message: 'Keyword "nutrition tracker" reached 634 qualified leads', timestamp: '2026-08-27T11:30:00', acknowledged: false, important: true });
  ntfBatch.set(db.collection('notifications').doc('ntf-02'), { type: 'warning', title: 'Sender capacity warning', message: 'Sender 03 is approaching its daily sending quota (178/200)', timestamp: '2026-08-27T10:15:00', acknowledged: false, important: true });
  ntfBatch.set(db.collection('notifications').doc('ntf-03'), { type: 'error', title: 'Integration error', message: 'Google Sheets sync failed: Web App URL returned 404', timestamp: '2026-08-27T11:25:00', acknowledged: false, important: true });
  ntfBatch.set(db.collection('notifications').doc('ntf-04'), { type: 'info', title: 'New reply received', message: 'Human reply from Sarah Chen regarding FitTrack Pro', timestamp: '2026-08-27T09:15:00', acknowledged: true, important: false });
  ntfBatch.set(db.collection('notifications').doc('ntf-05'), { type: 'success', title: 'Automation completed', message: 'Keyword "nutrition tracker" completed successfully in 2h 22m', timestamp: '2026-08-26T17:42:00', acknowledged: true, important: false });
  await ntfBatch.commit();
  console.log('Notifications seeded (5)');

  // 11. SEARCH QUERIES
  const sqBatch = db.batch();
  sqBatch.set(db.collection('search_queries').doc('sq-01'), { keyword: 'running app', query: 'running app', leadsDiscovered: 643, qualified: 417, rejected: 140, duplicates: 86, status: 'completed', level: 0, parentQuery: null });
  sqBatch.set(db.collection('search_queries').doc('sq-02'), { keyword: 'running app', query: 'jogging tracker', leadsDiscovered: 234, qualified: 189, rejected: 45, duplicates: 23, status: 'completed', level: 1, parentQuery: 'running app' });
  sqBatch.set(db.collection('search_queries').doc('sq-03'), { keyword: 'running app', query: 'pace calculator', leadsDiscovered: 187, qualified: 134, rejected: 53, duplicates: 19, status: 'completed', level: 1, parentQuery: 'running app' });
  sqBatch.set(db.collection('search_queries').doc('sq-04'), { keyword: 'running app', query: 'route mapper', leadsDiscovered: 156, qualified: 98, rejected: 58, duplicates: 14, status: 'completed', level: 1, parentQuery: 'running app' });
  sqBatch.set(db.collection('search_queries').doc('sq-05'), { keyword: 'running app', query: 'marathon trainer', leadsDiscovered: 98, qualified: 67, rejected: 31, duplicates: 8, status: 'completed', level: 1, parentQuery: 'running app' });
  sqBatch.set(db.collection('search_queries').doc('sq-06'), { keyword: 'running app', query: 'couch to 5k', leadsDiscovered: 76, qualified: 41, rejected: 35, duplicates: 6, status: 'exhausted', level: 1, parentQuery: 'running app' });
  await sqBatch.commit();
  console.log('Search queries seeded (6)');

  console.log('\nAll demo data seeded successfully!');
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });

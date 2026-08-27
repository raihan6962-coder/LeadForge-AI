# LeadForge AI — Production Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Deployment                     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Vite SPA   │  │  API Routes  │  │  Inngest Handler│ │
│  │  (Frontend)  │  │  (Serverless)│  │  (Background)   │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                   │          │
│         └────────────────┼───────────────────┘          │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  Firebase  │   │  Inngest   │   │  External  │
    │  Auth +    │   │  Cloud     │   │  Services  │
    │  Firestore │   │  Service   │   │  (Gmail,   │
    │            │   │            │   │  Telegram) │
    └───────────┘   └───────────┘   └───────────┘
```

## Prerequisites

1. **Firebase Project** — Firestore + Authentication enabled
2. **Inngest Account** — Free tier at https://inngest.com
3. **Vercel Account** — For deployment
4. **Google Cloud** — For Google Apps Script (email sending)
5. **Telegram Bot** — @BotFather for bot token

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (Email/Password provider)
5. Create a web app in Project Settings

### 1.2 Firebase Config
Copy the Firebase config and add to `.env`:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 1.3 Firebase Admin SDK
For server-side API routes, generate a service account key:
1. Go to Project Settings → Service Accounts
2. Generate new private key
3. Extract the following values:
```bash
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 1.4 Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 1.5 Create Admin User
1. Go to Firebase Authentication
2. Add user with email/password
3. This user will be the admin login

## Step 2: Inngest Setup

### 2.1 Create Inngest Account
1. Go to https://inngest.com
2. Sign up / Log in
3. Create a new project

### 2.2 Get Keys
From Inngest dashboard:
- **Event Key** — for sending events
- **Signing Key** — for webhook verification

Add to Vercel environment variables:
```bash
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
```

### 2.3 Connect Inngest to Vercel
In the Inngest dashboard:
1. Go to Settings → URL
2. Set the app URL to: `https://your-domain.vercel.app/api/inngest`
3. Inngest will automatically sync your functions

## Step 3: Vercel Deployment

### 3.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial production setup"
git remote add origin https://github.com/your-user/leadforge-ai.git
git push -u origin main
```

### 3.2 Deploy to Vercel
1. Go to https://vercel.com
2. Import the GitHub repository
3. Framework: Vite
4. Add environment variables (see .env.example)
5. Deploy

### 3.3 Environment Variables (Vercel)
Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
GROQ_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
GOOGLE_SHEET_WEB_APP_URL=
```

## Step 4: External Integrations

### 4.1 Google Sheets (Optional)
1. Create a Google Sheet with columns: Keyword, Subject, Body
2. Go to Extensions → Apps Script
3. Deploy as Web App (execute as Me, accessible by anyone)
4. Copy the Web App URL
5. Add to settings

### 4.2 Email Sending (Google Apps Script)
1. Create a Google Apps Script Web App
2. Implement Gmail API sending
3. Deploy as Web App
4. Add the URL as a sending account in Settings

### 4.3 Telegram Bot (Optional)
1. Message @BotFather on Telegram
2. Create /newbot
3. Copy the bot token
4. Get your chat ID (message @userinfobot)
5. Add to settings

### 4.4 Groq AI (Optional)
1. Go to https://console.groq.com
2. Create an API key
3. Add to settings

## Step 5: Verify Deployment

### 5.1 Check Health
Visit `https://your-domain.vercel.app/api/health`

### 5.2 Check Inngest
Visit Inngest dashboard → Functions tab to see synced functions

### 5.3 Test Authentication
1. Visit the app
2. Log in with the Firebase admin credentials
3. Verify dashboard loads

## Background Jobs

Inngest handles all background processing:
- **Scheduled keyword execution** — runs daily at configured time
- **Lead discovery** — discovers and qualifies leads
- **Email outreach** — sends personalized emails
- **Reply monitoring** — checks for incoming replies
- **Analytics aggregation** — daily metric computation
- **Telegram notifications** — sends alerts

These run independently of the browser and survive server restarts.

## Monitoring

- **Inngest Dashboard** — Job status, retries, errors
- **Firebase Console** — Database, authentication
- **Vercel Dashboard** — Deployment logs, API metrics
- **App Dashboard** — Activity logs, system health

## Troubleshooting

### Build fails
- Run `npm run typecheck` to find TypeScript errors
- Ensure all env vars are set

### Inngest functions not showing
- Check the Inngest URL is correct
- Verify `/api/inngest` endpoint is accessible

### Authentication fails
- Verify Firebase config in `.env`
- Check Firebase Auth is enabled
- Verify the user exists in Firebase Auth

### Firestore permission denied
- Check Firestore rules are deployed
- Verify the user is authenticated
- Check service account has Firestore access

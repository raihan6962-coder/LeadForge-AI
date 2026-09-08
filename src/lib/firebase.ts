import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2cQIX90EW-YFAMgLNwNpmGlm3YrfQZ6s",
  authDomain: "leadforge-ai-e6ba9.firebaseapp.com",
  projectId: "leadforge-ai-e6ba9",
  storageBucket: "leadforge-ai-e6ba9.firebasestorage.app",
  messagingSenderId: "178034529827",
  appId: "1:178034529827:web:c664b4efb4a7788b664396",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

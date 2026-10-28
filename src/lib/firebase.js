import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// הערכים מגיעים מ-Firebase Console → Project settings → Your apps (ראה README)
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

export const app = isFirebaseConfigured ? initializeApp(config) : null
export const auth = app ? getAuth(app) : null

// Firestore עם מטמון מקומי (IndexedDB): קריאה וכתיבה עובדות גם בלי קליטה,
// והשינויים נשלחים לשרת אוטומטית כשהחיבור חוזר
export const db = app
  ? initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  : null

if (auth) auth.languageCode = 'he' // מיילים של איפוס סיסמה בעברית

// לבדיקות מקומיות בלבד: VITE_FIREBASE_EMULATOR=true
if (app && import.meta.env.VITE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

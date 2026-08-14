import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAziy52rBBKG0s1Ask8fsiE-HetBTx8b8U",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ich-meds-d307e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ich-meds-d307e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ich-meds-d307e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "268948669123",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:268948669123:web:e00d715b090dcb9cf1d876",
  measurementId: "G-QZK5X4QM5H"
};

let app: any = null;
let auth: any = null;
let storage: any = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  storage = getStorage(app);
} catch (e) {
  console.warn("Firebase initialization warning:", e);
}

export { auth, storage };

// Messaging may not be supported in all environments (like SSR)
export const getMessagingToken = async () => {
  if (typeof window !== 'undefined' && app && await isSupported()) {
    try {
      return getMessaging(app);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export default app;

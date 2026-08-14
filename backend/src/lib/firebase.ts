let bucket: any = null;
let messaging: any = null;
let auth: any = null;

try {
  // Only attempt to load firebase-admin if explicitly available and needed
  if (process.env.FIREBASE_CONFIGURED === 'true') {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    bucket = admin.storage().bucket();
    messaging = admin.messaging();
    auth = admin.auth();
  }
} catch (e) {
  console.warn('Firebase Admin dynamic load skipped:', (e as Error).message);
}

export { bucket, messaging, auth };


import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firebaseConfigError: string | null = null;

if (
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes("YOUR_API_KEY") || // Basic check for placeholder
  firebaseConfig.apiKey.includes("NEXT_PUBLIC_") || // Basic check if value is still variable name
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  firebaseConfigError =
    "Firebase configuration is missing or invalid. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
    "and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set correctly in your .env file and the server is restarted. " +
    "Authentication and Firebase-dependent features will not work.";
  console.error("Firebase Init Error:", firebaseConfigError);
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    } catch (e) {
      firebaseConfigError = `Firebase initialization failed: ${e instanceof Error ? e.message : String(e)}`;
      console.error("Firebase Caught Init Error:", firebaseConfigError);
      app = null; // Ensure app is null on error
      auth = null; // Ensure auth is null on error
    }
  } else {
    app = getApps()[0]!;
    // It's possible getAuth could fail if the app instance is problematic,
    // though less likely if initializeApp succeeded or getApps()[0] is valid.
    try {
        auth = getAuth(app);
    } catch (e) {
        firebaseConfigError = `Firebase getAuth failed: ${e instanceof Error ? e.message : String(e)}`;
        console.error("Firebase getAuth Error:", firebaseConfigError);
        auth = null;
    }
  }
}

export { app, auth, firebaseConfigError };


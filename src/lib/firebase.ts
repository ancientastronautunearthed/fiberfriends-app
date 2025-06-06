
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

// Check if running in demo mode
const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

if (
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes("YOUR_API_KEY") || 
  firebaseConfig.apiKey.includes("NEXT_PUBLIC_") || 
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  firebaseConfigError =
    "Firebase configuration is missing or invalid. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
    "and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set correctly in your .env file and the server is restarted. " +
    "Authentication and Firebase-dependent features will not work.";
  
  if (!IS_DEMO_MODE) {
    // Only log the error to console if not in demo mode, to keep console cleaner during demo dev
    console.error("Firebase Init Error:", firebaseConfigError);
  }
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    } catch (e) {
      firebaseConfigError = `Firebase initialization failed: ${e instanceof Error ? e.message : String(e)}`;
      if (!IS_DEMO_MODE) {
        console.error("Firebase Caught Init Error:", firebaseConfigError);
      }
      app = null; 
      auth = null; 
    }
  } else {
    app = getApps()[0]!;
    try {
        auth = getAuth(app);
    } catch (e) {
        firebaseConfigError = `Firebase getAuth failed: ${e instanceof Error ? e.message : String(e)}`;
        if (!IS_DEMO_MODE) {
            console.error("Firebase getAuth Error:", firebaseConfigError);
        }
        auth = null;
    }
  }
}

export { app, auth, firebaseConfigError };

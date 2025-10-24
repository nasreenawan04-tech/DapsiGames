import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase config is complete
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Only initialize Firebase if configuration is available
if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase configuration is incomplete. Please set up Firebase environment variables.');
}

export { app, auth };

// Initialize Analytics only in production and in browser
let analytics = null;
if (typeof window !== 'undefined' && import.meta.env.PROD && app) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics not available:', error);
  }
}

export { analytics };

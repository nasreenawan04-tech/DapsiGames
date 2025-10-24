import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Note: For production, use a service account key JSON file
// For now, we'll use the simpler approach with project credentials
let firebaseAdmin: admin.app.App;

try {
  // Check if already initialized
  firebaseAdmin = admin.app();
} catch (error) {
  // Initialize with project credentials
  // In production, you would use a service account JSON:
  // const serviceAccount = require('./path/to/serviceAccountKey.json');
  // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  
  // For this setup, we'll use application default credentials
  // which requires GOOGLE_APPLICATION_CREDENTIALS env var or a service account
  firebaseAdmin = admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  });
}

export const auth = firebaseAdmin.auth();
export default firebaseAdmin;

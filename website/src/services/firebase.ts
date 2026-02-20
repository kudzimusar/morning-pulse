import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';

// ... (previous code)

let firebaseApp: FirebaseApp;

try {
    firebaseApp = getApp();
} catch (e) {
    const config = getFirebaseConfig();
    console.log(`🚀 [FIREBASE] Initializing with Project ID: ${config.projectId}`);
    firebaseApp = initializeApp(config);
}

export const app = firebaseApp;

// Create auth instance with consistent persistence to avoid iframe/extension errors
let authInstance: Auth;
try {
    authInstance = initializeAuth(app, {
        persistence: indexedDBLocalPersistence
    });
} catch (e) {
    // If already initialized (e.g. during HMR), use existing instance
    authInstance = getAuth(app);
}
export const auth = authInstance;
export const db = getFirestore(app);

// Initialize Firebase Functions
import { getFunctions } from 'firebase/functions';
// Region 'us-central1' is default, but good to be explicit if needed. 
// For now, let's use default to match deployment.
export const functions = getFunctions(app);

// Also export common helpers
export const APP_ID = (window as any).__app_id || 'morning-pulse-app';

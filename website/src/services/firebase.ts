import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';

// Reads Firebase config from the environment variable injected at build time
const getFirebaseConfig = (): any => {
    // Try VITE env variable first (set in .env or GitHub Actions)
    const envConfig = import.meta.env.VITE_FIREBASE_CONFIG;
    if (envConfig) {
        try {
            const parsed = JSON.parse(envConfig);
            console.log('[FIREBASE] Using config from VITE_FIREBASE_CONFIG');
            return parsed;
        } catch (e) {
            console.warn('[FIREBASE] Failed to parse VITE_FIREBASE_CONFIG, using fallback');
        }
    }
    // Fallback: hardcoded config for the project
    return {
        apiKey: "AIzaSyCAh6j7mhTtiQGN5855Tt-hCRVrNXbNxYE",
        authDomain: "gen-lang-client-0999441419.firebaseapp.com",
        projectId: "gen-lang-client-0999441419",
        storageBucket: "gen-lang-client-0999441419.firebasestorage.app",
        messagingSenderId: "328455476104",
        appId: "1:328455476104:web:396deccbc5613e353f603d",
        measurementId: "G-60S2YK429K"
    };
};

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
export const functions = getFunctions(app);

// Also export common helpers
export const APP_ID = (window as any).__app_id || 'morning-pulse-app';

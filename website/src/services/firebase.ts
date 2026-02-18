import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Hardcoded Firebase config for local development fallback
const HARDCODED_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCAh6j7mhTtiQGN5855Tt-hCRVrNXbNxYE",
    authDomain: "gen-lang-client-0999441419.firebaseapp.com",
    projectId: "gen-lang-client-0999441419",
    storageBucket: "gen-lang-client-0999441419.firebasestorage.app",
    messagingSenderId: "328455476104",
    appId: "1:328455476104:web:396deccbc5613e353f603d",
    measurementId: "G-60S2YK429K"
};

const getFirebaseConfig = (): any => {
    // Priority 1: Try to get from window (injected at runtime via firebase-config.js or meta tag)
    if (typeof window !== 'undefined' && (window as any).__firebase_config) {
        const config = (window as any).__firebase_config;
        if (typeof config === 'object' && config !== null && config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
            console.log('✅ [FIREBASE] Using config from window.__firebase_config');
            return config;
        }
    }

    // Priority 2: Try to get from environment variable (build time)
    const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
    if (configStr && typeof configStr === 'string' && configStr.trim() && configStr !== 'null') {
        try {
            let parsed = JSON.parse(configStr);
            if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
            }
            console.log('✅ [FIREBASE] Using config from VITE_FIREBASE_CONFIG');
            return parsed;
        } catch (e) {
            console.error('❌ [FIREBASE] Failed to parse VITE_FIREBASE_CONFIG:', e);
        }
    }

    // Fallback: Hardcoded for local development
    console.log('⚠️ [FIREBASE] Using hardcoded fallback config');
    return HARDCODED_FIREBASE_CONFIG;
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
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Functions
import { getFunctions } from 'firebase/functions';
// Region 'us-central1' is default, but good to be explicit if needed. 
// For now, let's use default to match deployment.
export const functions = getFunctions(app);

// Also export common helpers
export const APP_ID = (window as any).__app_id || 'morning-pulse-app';

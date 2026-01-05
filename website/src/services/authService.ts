/**
 * Authentication Service for Editorial Staff
 * Provides email/password authentication for editors and super admins
 * Does NOT interfere with anonymous authentication used for public submissions
 */

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';

// Reuse Firebase config pattern from opinionsService
const getFirebaseConfig = (): any => {
  // Priority 1: Try to get from window (injected at runtime via firebase-config.js)
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    const config = (window as any).__firebase_config;
    if (typeof config === 'object' && config !== null && config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
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
      return parsed;
    } catch (e) {
      console.error('Failed to parse VITE_FIREBASE_CONFIG:', e);
    }
  }
  
  // Priority 3: Hardcoded fallback for local development
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

// Get Firebase app instance (reuse if exists, create if not)
let app: FirebaseApp | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

const getAppInstance = (): FirebaseApp => {
  if (app) return app;
  
  const config = getFirebaseConfig();
  try {
    app = getApp();
  } catch {
    app = initializeApp(config);
  }
  return app;
};

const getAuthInstance = () => {
  if (auth) return auth;
  const appInstance = getAppInstance();
  auth = getAuth(appInstance);
  return auth;
};

const getDbInstance = () => {
  if (db) return db;
  const appInstance = getAppInstance();
  db = getFirestore(appInstance);
  return db;
};

// Staff role types
export type StaffRole = 'super_admin' | 'editor' | null;

const appId = 'morning-pulse-app';

/**
 * Sign in editor with email and password
 * This is separate from anonymous authentication used for public submissions
 */
export const signInEditor = async (email: string, password: string): Promise<User> => {
  const authInstance = getAuthInstance();
  const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
  return userCredential.user;
};

/**
 * Get staff role for a user UID
 * Checks Firestore: artifacts/morning-pulse-app/staff/{uid}
 */
export const getStaffRole = async (uid: string): Promise<StaffRole> => {
  try {
    const dbInstance = getDbInstance();
    const staffRef = doc(dbInstance, 'artifacts', appId, 'staff', uid);
    const snap = await getDoc(staffRef);
    
    if (!snap.exists()) {
      return null;
    }
    
    const role = snap.data()?.role;
    if (role === 'super_admin' || role === 'editor') {
      return role;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching staff role:', error);
    return null;
  }
};

/**
 * Check if user has editor or super_admin role
 */
export const requireEditor = (role: StaffRole): boolean => {
  return role === 'editor' || role === 'super_admin';
};

/**
 * Check if user has super_admin role
 */
export const requireSuperAdmin = (role: StaffRole): boolean => {
  return role === 'super_admin';
};

/**
 * Logout editor (signs out from email/password auth)
 * Does NOT affect anonymous authentication
 */
export const logoutEditor = async (): Promise<void> => {
  const authInstance = getAuthInstance();
  await signOut(authInstance);
};

/**
 * Get current authenticated user (for editors)
 */
export const getCurrentEditor = (): User | null => {
  const authInstance = getAuthInstance();
  return authInstance.currentUser;
};

/**
 * Subscribe to auth state changes
 * Useful for tracking editor login/logout
 */
export const onEditorAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  const authInstance = getAuthInstance();
  return onAuthStateChanged(authInstance, callback);
};

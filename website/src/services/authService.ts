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
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  Firestore
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
// Use a named app to avoid conflicts with other Firebase initializations
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

const getAppInstance = (): FirebaseApp => {
  if (app) return app;
  
  const config = getFirebaseConfig();
  try {
    // Try to get default app first (might be initialized by opinionsService)
    app = getApp();
  } catch (e) {
    // Default app doesn't exist, create it
    try {
      app = initializeApp(config);
    } catch (initError: any) {
      // App might already exist with a different name, try to get it again
      if (initError.code === 'app/duplicate-app') {
        app = getApp();
      } else {
        throw initError;
      }
    }
  }
  return app;
};

const getAuthInstance = (): Auth => {
  if (authInstance) return authInstance;
  
  // Lazy initialization - only when needed
  const appInstance = getAppInstance();
  authInstance = getAuth(appInstance);
  return authInstance;
};

const getDbInstance = (): Firestore => {
  if (dbInstance) return dbInstance;
  
  // Lazy initialization - only when needed
  const appInstance = getAppInstance();
  dbInstance = getFirestore(appInstance);
  return dbInstance;
};

// Staff role types
export type StaffRole = 'super_admin' | 'editor' | null;

const appId = 'morning-pulse-app';

/**
 * Sign in editor with email and password
 * This is separate from anonymous authentication used for public submissions
 */
export const signInEditor = async (email: string, password: string): Promise<User> => {
  try {
    const authInstance = getAuthInstance();
    
    // ✅ FIX: Sign out anonymous user if present before email/password login
    if (authInstance.currentUser && authInstance.currentUser.isAnonymous) {
      console.log('🔐 Signing out anonymous user before editor login...');
      await signOut(authInstance);
      // Wait a moment for sign out to complete
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    console.log('✅ Editor email/password login successful');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Editor sign in failed:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error(
        'Email/Password authentication is not enabled. ' +
        'Please enable it in Firebase Console > Authentication > Sign-in method > Email/Password. ' +
        'Visit: https://console.firebase.google.com/project/gen-lang-client-0999441419/authentication/providers'
      );
    }
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please check your credentials.');
    }
    
    if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    }
    
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    }
    
    // Generic error
    throw new Error(error.message || 'Failed to sign in. Please try again.');
  }
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
  try {
    const authInstance = getAuthInstance();
    return onAuthStateChanged(authInstance, callback);
  } catch (error) {
    console.error('Error setting up auth state listener:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

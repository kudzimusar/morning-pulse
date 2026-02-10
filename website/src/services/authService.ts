/**
 * Authentication Service for Editorial Staff
 * Provides email/password authentication and role-based access control.
 * Uses Firebase custom claims as the single source of truth for roles.
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

// --- Firebase Initialization (Singleton Pattern) ---

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

const getFirebaseConfig = (): any => {
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    const config = (window as any).__firebase_config;
    if (config && config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
      return config;
    }
  }
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configStr) {
    try {
      return JSON.parse(JSON.parse(configStr));
    } catch (e) {
      console.error('Failed to parse VITE_FIREBASE_CONFIG:', e);
    }
  }
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

const getAppInstance = (): FirebaseApp => {
  if (app) return app;
  const config = getFirebaseConfig();
  try {
    app = getApp();
  } catch (e) {
    app = initializeApp(config);
  }
  return app;
};

const getAuthInstance = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getAppInstance());
  }
  return authInstance;
};

const getDbInstance = (): Firestore => {
  if (!dbInstance) {
    dbInstance = getFirestore(getAppInstance());
  }
  return dbInstance;
};

const appId = (window as any).__app_id || 'morning-pulse-app';

// --- Role Management (Based on Custom Claims) ---

export type StaffRole = 'super_admin' | 'admin' | 'editor';
let userRolesCache: StaffRole[] | null = null;

/**
 * [NEW] Gets user roles from the Firebase ID token's custom claims.
 * This is the SINGLE SOURCE OF TRUTH for user permissions.
 * Caches roles to avoid re-parsing the token on every check.
 */
export const getUserRoles = async (forceRefresh: boolean = false): Promise<StaffRole[] | null> => {
  const user = getCurrentEditor();
  if (!user) {
    userRolesCache = null;
    return null;
  }

  if (userRolesCache && !forceRefresh) {
    return userRolesCache;
  }

  try {
    console.log('🔍 [AUTH] Getting ID token result for roles...');
    const idTokenResult = await user.getIdTokenResult(forceRefresh);
    const claims = idTokenResult.claims;
    
    const roles: StaffRole[] = [];
    if (claims.super_admin) roles.push('super_admin');
    if (claims.admin) roles.push('admin');
    if (claims.editor) roles.push('editor');

    console.log(`✅ [AUTH] Roles from token: ${roles.join(', ') || 'none'}`);
    userRolesCache = roles;
    return userRolesCache;
  } catch (error) {
    console.error('❌ [AUTH] Error getting user roles from token:', error);
    userRolesCache = null;
    return null;
  }
};

// Clear role cache on auth state change
onEditorAuthStateChanged(user => {
  if (!user) {
    userRolesCache = null;
  }
});


/**
 * [SIMPLIFIED] Signs in a user and verifies their account is active.
 * Role checking is now handled by the router guard using custom claims.
 */
export const signInEditor = async (email: string, password: string): Promise<User> => {
  const auth = getAuthInstance();
  
  if (auth.currentUser?.isAnonymous) {
    console.log('🔐 Signing out anonymous user before editor login...');
    await signOut(auth);
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`✅ [AUTH] Login successful for ${user.email}`);

    // Verify the account is not suspended. This is the only check needed here.
    const staffDoc = await getDoc(doc(getDbInstance(), 'artifacts', appId, 'public', 'data', 'staff', user.uid));
    if (staffDoc.exists() && staffDoc.data().isActive === false) {
      await signOut(auth);
      throw new Error('Your account has been suspended. Please contact the administrator.');
    }
    
    // Force refresh the token to get the latest custom claims after login.
    await getUserRoles(true); 

    return user;
  } catch (error: any) {
    console.error('❌ [AUTH] Sign in failed:', error.message);
    // Re-throw specific, user-friendly errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password.');
    }
    if (error.message.includes('suspended')) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred during sign-in.');
  }
};

/**
 * [REFACTORED] Checks if the user has at least 'editor' level privileges.
 * Now uses the reliable custom claims cache.
 */
export const requireEditor = async (): Promise<boolean> => {
  const roles = await getUserRoles();
  if (!roles) return false;
  return roles.includes('editor') || roles.includes('admin') || roles.includes('super_admin');
};

/**
 * [REFACTORED] Checks if the user has 'admin' or 'super_admin' privileges.
 * Now uses the reliable custom claims cache.
 */
export const requireSuperAdmin = async (): Promise<boolean> => {
  const roles = await getUserRoles();
  if (!roles) return false;
  return roles.includes('admin') || roles.includes('super_admin');
};

/**
 * Logs out the current user.
 */
export const logoutEditor = async (): Promise<void> => {
  const auth = getAuthInstance();
  await signOut(auth);
  userRolesCache = null; // Clear cache on logout
  console.log('✅ [AUTH] User signed out.');
};

/**
 * Gets the current authenticated user object.
 */
export const getCurrentEditor = (): User | null => {
  return getAuthInstance().currentUser;
};

/**
 * Subscribes to authentication state changes.
 */
export const onEditorAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(getAuthInstance(), (user) => {
    if (!user) {
      userRolesCache = null; // Ensure cache is cleared on logout
    }
    callback(user);
  });
};

// The getStaffRole and getReaderRole functions are no longer needed for client-side authorization
// and can be deprecated or removed if no other part of the app uses them for display purposes.
// For now, they will be left for potential other uses but are not part of the auth flow.

export const getStaffRole = async (uid: string): Promise<string[] | null> => {
    // This function is no longer authoritative for role checking.
    // It can be used for displaying role info if needed.
    return [];
}

export const getReaderRole = async (uid: string): Promise<string[] | null> => {
    return [];
}


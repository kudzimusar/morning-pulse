/**
 * Authentication Service for Editorial Staff
 * Provides email/password authentication and role-based access control using Firebase Custom Claims.
 */

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore'; // Keep for other services if needed

// --- Firebase Initialization (Singleton Pattern) ---

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

const getFirebaseConfig = (): any => {
    const configElement = document.getElementById('firebase-config');
    if (!configElement || !configElement.textContent) {
        console.error('Critical: Firebase config not found in the DOM.');
        return {}; // Return empty config to avoid crash, though app will fail
    }
    return JSON.parse(configElement.textContent);
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
  if (authInstance) return authInstance;
  authInstance = getAuth(getAppInstance());
  return authInstance;
};

const getDbInstance = (): Firestore => {
    if (dbInstance) return dbInstance;
    dbInstance = getFirestore(getAppInstance());
    return dbInstance;
};

// --- Core Authentication Functions ---

/**
 * Signs in a user and verifies they have a staff role via Custom Claims.
 */
export const signInEditor = async (email: string, password: string): Promise<User | null> => {
  const auth = getAuthInstance();
  try {
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      await signOut(auth);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ Claims-based auth check running...");
    const tokenResult = await user.getIdTokenResult(true);
    const claims = tokenResult.claims;

    const hasStaffRole = claims.super_admin || claims.bureau_chief || claims.admin || claims.editor || claims.writer;

    if (!hasStaffRole) {
        console.error("Access Denied: This account does not have staff privileges.");
        await signOut(auth);
        return null;
    }
    
    const role = Object.keys(claims).find(r =>['super_admin', 'bureau_chief', 'admin', 'editor', 'writer'].includes(r));
    console.log(`Login successful. Role: ${role || 'user'}`);
    return user;

  } catch (error: any) {
    console.error('❌ Editor sign-in failed:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password.');
    }
    throw new Error('An unexpected error occurred during sign-in.');
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentEditor = (): User | null => {
  const authInstance = getAuthInstance();
  return authInstance.currentUser;
};

/**
 * Logs out the current user.
 */
export const logoutEditor = async (): Promise<void> => {
  const auth = getAuthInstance();
  await signOut(auth);
};

/**
 * Subscribes to authentication state changes.
 */
export const onEditorAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  const auth = getAuthInstance();
  return onAuthStateChanged(auth, callback);
};

// --- Role and Permission Checks (using Custom Claims) ---

/**
 * Gets the roles of the current user from their ID token claims.
 */
export const getUserRoles = async (): Promise<string[]> => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    return [];
  }

  try {
    const tokenResult = await currentUser.getIdTokenResult(true);
    const claims = tokenResult.claims;
    
    const roles: string[] = [];
    if (claims.super_admin) roles.push('super_admin');
    if (claims.bureau_chief) roles.push('bureau_chief');
    if (claims.admin) roles.push('admin');
    if (claims.editor) roles.push('editor');
    if (claims.writer) roles.push('writer');
    
    return roles;
  } catch (error) {
    console.error("❌ Error getting user roles from token:", error);
    return [];
  }
};

/**
 * Checks if the user has a role that grants editor privileges.
 */
export const requireEditor = async (): Promise<boolean> => {
  const roles = await getUserRoles();
  return roles.some(role => ['editor', 'admin', 'bureau_chief', 'super_admin'].includes(role));
};

/**
 * Checks if the user has super_admin privileges.
 */
export const requireSuperAdmin = async (): Promise<boolean> => {
  const roles = await getUserRoles();
  return roles.includes('super_admin');
};

/**
 * Checks if the user has at least bureau_chief privileges.
 */
export const requireBureauChief = async (): Promise<boolean> => {
  const roles = await getUserRoles();
  return roles.some(role => ['bureau_chief', 'super_admin'].includes(role));
};

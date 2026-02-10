/**
 * Authentication Service for Editorial Staff
 * Provides email/password authentication and role-based access control using Firebase Custom Claims.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  doc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';


// --- Staff Role Types ---
export type StaffRole = string[] | null;

const appId = (window as any).__app_id || 'morning-pulse-app';

// --- Core Authentication Functions ---

/**
 * Signs in a user and verifies they have a staff role via Custom Claims.
 */
export const signInEditor = async (email: string, password: string): Promise<User | null> => {
  try {
    // 🔐 Sign out anonymous user if present before email/password login
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      await signOut(auth);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("✅ Claims-based auth check running...");
    const tokenResult = await user.getIdTokenResult(true);
    const claims = tokenResult.claims;

    // Check for ANY staff role via claims
    const hasStaffRole = claims.super_admin || claims.bureau_chief || claims.admin || claims.editor || claims.writer;

    // ✅ FIX: Allow bootstrap UIDs to bypass initial claims check to enable bootstrapping
    const BOOTSTRAP_UID = '2jnMK761RcMvag3Agj5Wx3HjwpJ2';
    const VAGWARISA_UID = 'VaGwarisa';
    const isBootstrapUser = user.uid === BOOTSTRAP_UID || user.uid === VAGWARISA_UID;

    if (!hasStaffRole && !isBootstrapUser) {
      console.error("Access Denied: This account does not have staff privileges.");
      await signOut(auth);
      throw new Error("Access Denied: Your account does not have required staff permissions.");
    }

    // Check if account is active in Firestore (safety check)
    try {
      const staffRef = doc(db, 'staff', user.uid);
      const staffSnap = await getDoc(staffRef);
      if (staffSnap.exists()) {
        const staffData = staffSnap.data();
        const isActive = staffData.isActive !== undefined ? staffData.isActive : true;
        if (!isActive) {
          console.warn(`🚫 [AUTH] Suspended account: ${user.uid}`);
          await signOut(auth);
          throw new Error('Your account has been suspended.');
        }
      }
    } catch (dbError) {
      console.warn('Account status check skipped:', dbError);
    }

    const role = Object.keys(claims).find(r => ['super_admin', 'bureau_chief', 'admin', 'editor', 'writer'].includes(r));
    console.log(`Login successful. Role: ${role || 'user'}`);

    return user;

  } catch (error: any) {
    console.error('❌ Editor sign-in failed:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password.');
    }
    throw error;
  }
};

/**
 * Get staff roles from Firestore (Legacy/Secondary check)
 * Returns string[] to support multi-role RBAC
 */
export const getStaffRole = async (uid: string): Promise<string[]> => {
  try {
    const isAnonymous = auth.currentUser?.isAnonymous || false;

    if (!isAnonymous) {
      console.log(`🔍 [AUTH] Checking staff role for UID: ${uid}`);
    }

    const BOOTSTRAP_UID = '2jnMK761RcMvag3Agj5Wx3HjwpJ2';
    const VAGWARISA_UID = 'VaGwarisa';

    const staffRef = doc(db, 'staff', uid);
    const snap = await getDoc(staffRef);

    if (!snap.exists()) {
      // ✅ FIX: Special case for bootstrap UIDs if doc doesn't exist yet
      if (uid === BOOTSTRAP_UID || uid === VAGWARISA_UID) {
        console.log('🚀 [AUTH] Providing bootstrap roles for missing staff doc');
        return ['super_admin', 'admin', 'editor'];
      }
      return [];
    }

    const data = snap.data();
    if (data?.roles) {
      return Array.isArray(data.roles) ? data.roles : [data.roles];
    }
    if (data?.role && typeof data.role === 'string') {
      return [data.role];
    }

    return [];
  } catch (error) {
    console.error('❌ Error fetching staff role:', error);
    return [];
  }
};

/**
 * Synchronous role check for UI rendering (legacy use in App.tsx)
 */
export const requireEditor = (roles: string[]): boolean => {
  if (!roles || !Array.isArray(roles)) {
    return false;
  }
  // ✅ FIX: Include all editor-level roles
  return roles.includes('editor') || roles.includes('admin') || roles.includes('bureau_chief') || roles.includes('super_admin');
};

/**
 * Synchronous super admin check
 */
export const requireSuperAdmin = (roles: string[]): boolean => {
  if (!roles || !Array.isArray(roles)) {
    return false;
  }
  return roles.includes('super_admin');
};

/**
 * Logs out the current editor.
 */
export const logoutEditor = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Subscribes to authentication state changes.
 */
export const onEditorAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get current authenticated user
 */
export const getCurrentEditor = (): User | null => {
  return auth.currentUser;
};

// --- Claims-based Role Logic ---

/**
 * Gets the roles of the current user from their ID token claims.
 */
export const getUserRoles = async (): Promise<string[]> => {
  const currentUser = auth.currentUser;

  if (!currentUser) return [];

  try {
    const BOOTSTRAP_UID = '2jnMK761RcMvag3Agj5Wx3HjwpJ2';
    const VAGWARISA_UID = 'VaGwarisa';

    const tokenResult = await currentUser.getIdTokenResult(true);
    const claims = tokenResult.claims;

    const roles: string[] = [];
    if (claims.super_admin) roles.push('super_admin');
    if (claims.bureau_chief) roles.push('bureau_chief');
    if (claims.admin) roles.push('admin');
    if (claims.editor) roles.push('editor');
    if (claims.writer) roles.push('writer');

    // ✅ FIX: Inject roles for bootstrap users if claims are missing
    if (roles.length === 0 && (currentUser.uid === BOOTSTRAP_UID || currentUser.uid === VAGWARISA_UID)) {
      console.log('🚀 [AUTH] Injecting bootstrap roles for admin UID');
      return ['super_admin', 'admin', 'editor'];
    }

    return roles;
  } catch (error) {
    console.error("❌ Error getting user roles from token:", error);
    return [];
  }
};

/**
 * Asynchronous check if the user has editor privileges (claims-based).
 */
export const requireEditorAsync = async (): Promise<boolean> => {
  const roles = await getUserRoles();
  return roles.some(role => ['editor', 'admin', 'bureau_chief', 'super_admin'].includes(role));
};

/**
 * Asynchronous check if the user has super_admin privileges (claims-based).
 */
export const requireSuperAdminAsync = async (): Promise<boolean> => {
  const roles = await getUserRoles();
  return roles.includes('super_admin');
};

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

// Staff role types - now supports multiple roles per user
// Backward compatible: can be array of roles or single role string
export type StaffRole = string[] | null;

const appId = (window as any).__app_id || 'morning-pulse-app';

/**
 * Sign in editor with email and password
 * This is separate from anonymous authentication used for public submissions
 * Checks if account is active before allowing login
 */
export const signInEditor = async (email: string, password: string): Promise<User> => {
  try {
    const authInstance = getAuthInstance();
    const dbInstance = getDbInstance();
    
    // ✅ FIX: Sign out anonymous user if present before email/password login
    if (authInstance.currentUser && authInstance.currentUser.isAnonymous) {
      console.log('🔐 Signing out anonymous user before editor login...');
      await signOut(authInstance);
      // Wait a moment for sign out to complete
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const user = userCredential.user;
    console.log('✅ Editor email/password login successful');
    
    // ✅ NEW: Check if account is active
    try {
      const staffRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'staff', user.uid);
      const staffSnap = await getDoc(staffRef);
      
      if (staffSnap.exists()) {
        const staffData = staffSnap.data();
        const isActive = staffData.isActive !== undefined ? staffData.isActive : true;
        
        if (!isActive) {
          // Account is suspended - sign them out immediately
          console.warn(`🚫 [AUTH] Suspended account attempted login: ${user.uid}`);
          await signOut(authInstance);
          
          throw new Error(
            'Your account has been suspended. Please contact the administrator for assistance.'
          );
        }
        
        console.log(`✅ [AUTH] Active account verified: ${user.uid}`);
      }
    } catch (error: any) {
      // If it's our suspension error, re-throw it
      if (error.message && error.message.includes('suspended')) {
        throw error;
      }
      // Otherwise, log but allow login (staff doc might not exist yet)
      console.warn('Could not verify account status:', error);
    }
    
    return user;
  } catch (error: any) {
    console.error('❌ Editor sign in failed:', error);
    
    // Check if it's our custom suspension error
    if (error.message && error.message.includes('suspended')) {
      throw error;
    }
    
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
 * Get staff roles for a user UID
 * Checks Firestore: staff/{uid} (top-level collection)
 * Returns array of roles, with backward compatibility for single role string
 */
export const getStaffRole = async (uid: string): Promise<StaffRole> => {
  try {
    const dbInstance = getDbInstance();
    const appId = (window as any).__app_id || 'morning-pulse-app';
    
    // ✅ FIX: Silence staff warning for anonymous users
    // Check if this is an anonymous user (anonymous UIDs are typically long random strings)
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const isAnonymous = currentUser?.isAnonymous || false;
    
    // Only log for authenticated (non-anonymous) users
    if (!isAnonymous) {
      console.log(`🔍 [AUTH] Checking staff role for UID: ${uid}, AppID: ${appId}`);
    }
    
    // ✅ FIX: Use mandatory path structure with logged appId
    const staffRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'staff', uid);
    const snap = await getDoc(staffRef);
    
    if (!snap.exists()) {
      // ✅ FIX: Only warn for authenticated users, not anonymous
      if (!isAnonymous) {
        console.warn(`⚠️ Staff record is missing in path: artifacts/${appId}/public/data/staff/${uid}`);
      }
      return null;
    }
    
    const data = snap.data();
    console.log('📋 Staff document data:', data);
    
    // ✅ FIX: Check for roles array first (new format)
    // Firestore arrays are already arrays, no conversion needed
    if (data?.roles) {
      // Handle both array and single value (Firestore might store as array even if single)
      const rolesArray = Array.isArray(data.roles) ? data.roles : [data.roles];
      
      // Filter to only valid roles
      const validRoles = rolesArray.filter((r: any) => 
        typeof r === 'string' && ['editor', 'super_admin', 'admin'].includes(r)
      );
      
      if (validRoles.length > 0) {
        console.log('✅ Found valid roles array:', validRoles);
        return validRoles;
      }
    }
    
    // ✅ BACKWARD COMPATIBILITY: Check for single role string (old format)
    if (data?.role && typeof data.role === 'string') {
      const role = data.role;
      if (role === 'super_admin' || role === 'editor' || role === 'admin') {
        console.log('✅ Found single role (backward compat):', role);
        // Convert single role to array for consistency
        return [role];
      }
    }
    
    console.log('⚠️ No valid roles found in staff document');
    return null;
  } catch (error) {
    console.error('❌ Error fetching staff role:', error);
    return null;
  }
};

/**
 * Check if user has editor, admin, or super_admin role
 * Supports roles array (new format) with backward compatibility
 */
export const requireEditor = (roles: StaffRole): boolean => {
  if (!roles || !Array.isArray(roles)) {
    return false;
  }
  // ✅ Check if roles array includes any editor-level permission
  return roles.includes('editor') || roles.includes('admin') || roles.includes('super_admin');
};

/**
 * Check if user has super_admin or admin role
 * Supports roles array (new format) with backward compatibility
 */
export const requireSuperAdmin = (roles: StaffRole): boolean => {
  if (!roles || !Array.isArray(roles)) {
    return false;
  }
  // ✅ Check if roles array includes admin or super_admin
  return roles.includes('super_admin') || roles.includes('admin');
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

/**
 * Reader Service
 * Handles regular reader registration, login, and profile management
 * Readers are stored at: artifacts/{appId}/public/data/readers/{uid}
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { auth, db } from './firebase';

const getDb = () => db;
const getAuthInstance = () => auth;
const APP_ID = (window as any).__app_id || 'morning-pulse-app';

export interface Reader {
  uid: string;
  email: string;
  name: string;
  role: 'reader';
  preferences: {
    categories: string[];
    newsletterSubscribed: boolean;
    newsletterTrialUsed: boolean;
    newsletterTrialEndDate?: Date;
  };
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Register a new reader
 * Creates Firebase Auth user and reader document
 */
export const registerReader = async (
  email: string,
  password: string,
  name: string
): Promise<string> => {
  const auth = getAuthInstance();
  const db = getDb();

  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. Create reader document
    const readerRef = doc(db, 'readers', uid);

    await setDoc(readerRef, {
      email,
      name: name.trim(),
      role: 'reader',
      preferences: {
        categories: [],
        newsletterSubscribed: false,
        newsletterTrialUsed: false
      },
      createdAt: serverTimestamp(),
    });

    console.log('✅ Reader registered:', uid);
    return uid;
  } catch (error: any) {
    console.error('❌ Reader registration failed:', error);
    throw new Error(`Failed to register reader: ${error.message}`);
  }
};

/**
 * Sign in reader with email and password
 */
export const signInReader = async (email: string, password: string): Promise<User> => {
  const auth = getAuthInstance();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Reader sign-in successful');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Reader sign-in failed:', error);
    throw new Error(`Failed to sign in: ${error.message}`);
  }
};

const toReader = (uid: string, data: Record<string, any>): Reader => ({
  uid,
  email: data.email || '',
  name: data.name || '',
  role: 'reader',
  preferences: {
    categories: data.preferences?.categories || [],
    newsletterSubscribed: data.preferences?.newsletterSubscribed || false,
    newsletterTrialUsed: data.preferences?.newsletterTrialUsed || false,
    newsletterTrialEndDate: data.preferences?.newsletterTrialEndDate?.toDate?.() || undefined,
  },
  createdAt: data.createdAt?.toDate?.() || new Date(),
  updatedAt: data.updatedAt?.toDate?.() || undefined,
});

/** Get doc ref where reader exists - artifacts path first (AuthPage), then readers/ */
const getReaderDocRef = async (uid: string) => {
  const db = getDb();
  const artifactsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'readers', uid);
  const readersRef = doc(db, 'readers', uid);
  try {
    const snap = await getDoc(artifactsRef);
    if (snap.exists()) return artifactsRef;
  } catch (_) {}
  try {
    const snap = await getDoc(readersRef);
    if (snap.exists()) return readersRef;
  } catch (_) {}
  return artifactsRef; // default for writes (AuthPage path)
};

/**
 * Get reader by UID - checks artifacts path first (AuthPage), then readers/ (legacy)
 */
export const getReader = async (uid: string): Promise<Reader | null> => {
  const db = getDb();
  const artifactsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'readers', uid);
  try {
    const snap = await getDoc(artifactsRef);
    if (snap.exists()) return toReader(uid, snap.data() || {});
  } catch (e: any) {
    if (e?.code !== 'permission-denied' && !e?.message?.includes('permissions')) {
      console.warn('Artifacts reader path failed:', e?.message);
    }
  }
  const readersRef = doc(db, 'readers', uid);
  try {
    const snap = await getDoc(readersRef);
    if (snap.exists()) return toReader(uid, snap.data() || {});
  } catch (error: any) {
    if (error.code === 'permission-denied' || error.message?.includes('permissions') || error.message?.includes('Missing or insufficient permissions')) {
      console.warn('⚠️ Reader document access denied for uid:', uid);
      return null;
    }
    console.error('Error fetching reader:', error);
  }
  return null;
};

/**
 * Get current reader data
 */
export const getCurrentReader = async (): Promise<Reader | null> => {
  const auth = getAuthInstance();
  const user = auth.currentUser;
  if (!user) {
    console.log('ℹ️ No current user found');
    return null;
  }

  // Skip if user is anonymous
  if (user.isAnonymous) {
    console.log('ℹ️ User is anonymous, skipping reader check');
    return null;
  }

  try {
    return await getReader(user.uid);
  } catch (error: any) {
    // Handle permission errors gracefully
    if (error.code === 'permission-denied' || error.message?.includes('permissions') || error.message?.includes('Missing or insufficient permissions')) {
      console.warn('⚠️ Reader document access denied - user may not have reader account yet');
      return null;
    }
    console.error('Error fetching reader:', error);
    return null; // Return null instead of throwing
  }
};

/**
 * Update reader profile (name)
 */
export const updateReaderProfile = async (
  uid: string,
  updates: { name?: string }
): Promise<void> => {
  const readerRef = await getReaderDocRef(uid);

  try {
    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.name !== undefined) updateData.name = updates.name.trim();

    await updateDoc(readerRef, updateData);
    console.log('✅ Reader profile updated');
  } catch (error: any) {
    console.error('❌ Failed to update reader profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

/**
 * Update reader preferences
 */
export const updateReaderPreferences = async (
  uid: string,
  preferences: { categories: string[] }
): Promise<void> => {
  const readerRef = await getReaderDocRef(uid);

  try {
    await updateDoc(readerRef, {
      'preferences.categories': preferences.categories,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Reader preferences updated');
  } catch (error: any) {
    console.error('❌ Failed to update reader preferences:', error);
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
};

/**
 * Load reader preferences from Firestore
 */
export const loadReaderPreferences = async (
  uid: string
): Promise<{ categories: string[] } | null> => {
  const reader = await getReader(uid);
  if (!reader) return null;
  return { categories: reader.preferences?.categories || [] };
};

/**
 * Activate newsletter trial (7 days free)
 */
export const activateNewsletterTrial = async (
  uid: string,
  email: string
): Promise<void> => {
  const readerRef = await getReaderDocRef(uid);

  try {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

    await updateDoc(readerRef, {
      'preferences.newsletterSubscribed': true,
      'preferences.newsletterTrialUsed': true,
      'preferences.newsletterTrialEndDate': trialEndDate,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Newsletter trial activated for reader:', uid);
  } catch (error: any) {
    console.error('❌ Failed to activate newsletter trial:', error);
    throw new Error(`Failed to activate trial: ${error.message}`);
  }
};

/**
 * Sign out the current reader
 */
export const signOutReader = async (): Promise<void> => {
  const auth = getAuthInstance();
  try {
    await signOut(auth);
    console.log('✅ Reader signed out');
  } catch (error: any) {
    console.error('❌ Sign out failed:', error);
    throw new Error(`Failed to sign out: ${error.message}`);
  }
};

/**
 * Check if email is already registered as a reader
 */
export const checkReaderExists = async (email: string): Promise<boolean> => {
  const db = getDb();

  try {
    // Query readers collection for matching email
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const readersRef = collection(db, 'readers');
    const q = query(readersRef, where('email', '==', email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error: any) {
    console.error('Error checking reader existence:', error);
    return false;
  }
};

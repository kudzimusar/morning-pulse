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

/**
 * Get reader by UID
 */
export const getReader = async (uid: string): Promise<Reader | null> => {
  const db = getDb();
  const readerRef = doc(db, 'readers', uid);

  try {
    const snap = await getDoc(readerRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: snap.id,
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
      };
    }
    return null;
  } catch (error: any) {
    // Handle permission errors gracefully
    if (error.code === 'permission-denied' || error.message?.includes('permissions') || error.message?.includes('Missing or insufficient permissions')) {
      console.warn('⚠️ Reader document access denied for uid:', uid);
      return null;
    }
    console.error('Error fetching reader:', error);
    return null; // Return null instead of throwing
  }
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
 * Update reader preferences
 */
export const updateReaderPreferences = async (
  uid: string,
  preferences: { categories: string[] }
): Promise<void> => {
  const db = getDb();
  const readerRef = doc(db, 'readers', uid);

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
  const db = getDb();
  const readerRef = doc(db, 'readers', uid);

  try {
    const snap = await getDoc(readerRef);
    if (snap.exists()) {
      const data = snap.data();
      const prefs = data.preferences || {};
      return { categories: prefs.categories || [] };
    }
    return null;
  } catch (error: any) {
    console.error('Error loading reader preferences:', error);
    return null;
  }
};

/**
 * Activate newsletter trial (7 days free)
 */
export const activateNewsletterTrial = async (
  uid: string,
  email: string
): Promise<void> => {
  const db = getDb();
  const readerRef = doc(db, 'readers', uid);

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

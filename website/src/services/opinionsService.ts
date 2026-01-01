import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { Opinion, OpinionSubmissionData } from '../../../types';

// Get Firebase config (same pattern as FirebaseConnector)
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

// Get Firestore instance
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const getDb = (): Firestore | null => {
  if (db) return db;
  
  try {
    const config = getFirebaseConfig();
    if (!config || Object.keys(config).length === 0) {
      console.warn('Firebase config not available');
      return null;
    }
    
    try {
      app = getApp();
    } catch (e) {
      app = initializeApp(config);
    }
    
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.error('Firebase initialization error:', e);
    return null;
  }
};

const OPINIONS_COLLECTION = 'artifacts/morning-pulse-app/public/data/opinions';

/**
 * Submit a new opinion for review
 */
export const submitOpinion = async (opinionData: OpinionSubmissionData): Promise<string> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // Create document path: artifacts/morning-pulse-app/public/data/opinions
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    
    const docData = {
      writerType: opinionData.writerType || 'Guest Essay',
      authorName: opinionData.authorName,
      authorTitle: opinionData.authorTitle || '',
      headline: opinionData.headline,
      subHeadline: opinionData.subHeadline,
      body: opinionData.body,
      category: opinionData.category || 'General',
      country: opinionData.country || 'Global',
      status: 'pending' as const,
      submittedAt: Timestamp.now(),
    };

    const docRef = await addDoc(opinionsRef, docData);
    console.log('✅ Opinion submitted with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error submitting opinion:', error);
    throw new Error(`Failed to submit opinion: ${error.message}`);
  }
};

/**
 * Get all published opinions, ordered by publishedAt (newest first)
 */
export const getPublishedOpinions = async (): Promise<Opinion[]> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    const q = query(
      opinionsRef,
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const opinions: Opinion[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      opinions.push({
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as Opinion);
    });

    return opinions;
  } catch (error: any) {
    console.error('❌ Error fetching published opinions:', error);
    throw new Error(`Failed to fetch opinions: ${error.message}`);
  }
};

/**
 * Subscribe to published opinions with real-time updates
 */
export const subscribeToPublishedOpinions = (
  callback: (opinions: Opinion[]) => void
): (() => void) => {
  const db = getDb();
  if (!db) {
    console.warn('Firebase not initialized, returning empty unsubscribe');
    return () => {};
  }

  try {
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    const q = query(
      opinionsRef,
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const opinions: Opinion[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          opinions.push({
            id: docSnap.id,
            ...data,
            submittedAt: data.submittedAt?.toDate?.() || new Date(),
            publishedAt: data.publishedAt?.toDate?.() || null,
          } as Opinion);
        });
        callback(opinions);
      },
      (error) => {
        console.error('❌ Error in published opinions subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('❌ Error setting up published opinions subscription:', error);
    return () => {};
  }
};

/**
 * Get all pending opinions (admin only)
 */
export const getPendingOpinions = async (): Promise<Opinion[]> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    const q = query(
      opinionsRef,
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const opinions: Opinion[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      opinions.push({
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as Opinion);
    });

    return opinions;
  } catch (error: any) {
    console.error('❌ Error fetching pending opinions:', error);
    throw new Error(`Failed to fetch pending opinions: ${error.message}`);
  }
};

/**
 * Subscribe to pending opinions with real-time updates (admin only)
 */
export const subscribeToPendingOpinions = (
  callback: (opinions: Opinion[]) => void
): (() => void) => {
  const db = getDb();
  if (!db) {
    console.warn('Firebase not initialized, returning empty unsubscribe');
    return () => {};
  }

  try {
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    const q = query(
      opinionsRef,
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const opinions: Opinion[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          opinions.push({
            id: docSnap.id,
            ...data,
            submittedAt: data.submittedAt?.toDate?.() || new Date(),
            publishedAt: data.publishedAt?.toDate?.() || null,
          } as Opinion);
        });
        callback(opinions);
      },
      (error) => {
        console.error('❌ Error in pending opinions subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('❌ Error setting up pending opinions subscription:', error);
    return () => {};
  }
};

/**
 * Approve an opinion (change status to 'published')
 */
export const approveOpinion = async (opinionId: string, reviewedBy?: string): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const opinionRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', opinionId);
    await updateDoc(opinionRef, {
      status: 'published',
      publishedAt: Timestamp.now(),
      reviewedBy: reviewedBy || 'admin',
    });
    console.log('✅ Opinion approved:', opinionId);
  } catch (error: any) {
    console.error('❌ Error approving opinion:', error);
    throw new Error(`Failed to approve opinion: ${error.message}`);
  }
};

/**
 * Reject an opinion (change status to 'rejected')
 */
export const rejectOpinion = async (opinionId: string, reviewedBy?: string): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const opinionRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', opinionId);
    await updateDoc(opinionRef, {
      status: 'rejected',
      reviewedBy: reviewedBy || 'admin',
    });
    console.log('✅ Opinion rejected:', opinionId);
  } catch (error: any) {
    console.error('❌ Error rejecting opinion:', error);
    throw new Error(`Failed to reject opinion: ${error.message}`);
  }
};

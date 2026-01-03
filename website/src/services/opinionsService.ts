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
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously,
  Auth
} from 'firebase/auth';
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
let auth: Auth | null = null;

const getDb = (): Firestore | null => {
  if (db && auth) return db;
  
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
    // CRITICAL: Initialize auth from the same app instance
    if (!auth) {
      auth = getAuth(app);
    }
    return db;
  } catch (e) {
    console.error('Firebase initialization error:', e);
    return null;
  }
};

/**
 * Ensure user is authenticated (anonymous auth for public submissions)
 */
export const ensureAuthenticated = async (): Promise<void> => {
  if (!auth) {
    const db = getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
  }
  
  if (auth) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('🔐 No user authenticated, signing in anonymously...');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5252e085-f66e-44ad-9210-7b45a5c6c499',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'opinionsService.ts:106',message:'Before signInAnonymously',data:{hasAuth:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      try {
        const userCredential = await signInAnonymously(auth);
        console.log('✅ Anonymous authentication successful');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5252e085-f66e-44ad-9210-7b45a5c6c499',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'opinionsService.ts:109',message:'After signInAnonymously success',data:{uid:userCredential.user.uid,isAnonymous:userCredential.user.isAnonymous,providerId:userCredential.user.providerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (error: any) {
        console.error('❌ Anonymous authentication failed:', error);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5252e085-f66e-44ad-9210-7b45a5c6c499',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'opinionsService.ts:112',message:'signInAnonymously error',data:{errorCode:error.code,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        if (error.code === 'auth/configuration-not-found') {
          const message = 'CRITICAL: Enable Anonymous Auth in Firebase Console > Authentication > Sign-in Method.';
          console.error(message);
          alert(message);
          throw new Error(message);
        }
        throw error;
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5252e085-f66e-44ad-9210-7b45a5c6c499',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'opinionsService.ts:121',message:'User already authenticated',data:{uid:currentUser.uid,isAnonymous:currentUser.isAnonymous,providerId:currentUser.providerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }
  }
};

const OPINIONS_COLLECTION = 'data/opinions';

/**
 * Get current auth user (for components to check auth state)
 */
export const getCurrentAuthUser = () => {
  return auth?.currentUser || null;
};

/**
 * Submit a new opinion for review
 */
export const submitOpinion = async (opinionData: OpinionSubmissionData): Promise<string> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // CRITICAL: Ensure anonymous authentication before writing to Firestore
    await ensureAuthenticated();
    
    console.log('📝 Attempting to submit opinion to path: data/opinions');
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    const opinionsRef = collection(db, 'data', 'opinions');
    
    const docData = {
      writerType: opinionData.writerType || 'Guest Essay',
      authorName: opinionData.authorName,
      authorTitle: opinionData.authorTitle || '',
      headline: opinionData.headline,
      subHeadline: opinionData.subHeadline,
      body: opinionData.body, // This will be HTML string from rich text editor
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
 * FIX: Fetch entire collection, filter in JavaScript to avoid permission/index issues
 */
export const getPublishedOpinions = async (): Promise<Opinion[]> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // CRITICAL: Ensure authentication before fetching
    await ensureAuthenticated();
    
    console.log('📝 Attempting to fetch published opinions from path: data/opinions');
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    const opinionsRef = collection(db, 'data', 'opinions');
    
    // FIX: Fetch entire collection without where/orderBy to avoid permission errors
    const snapshot = await getDocs(opinionsRef);
    const allOpinions: Opinion[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      allOpinions.push({
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as Opinion);
    });

    // Filter for published status in JavaScript memory
    const publishedOpinions = allOpinions
      .filter(opinion => opinion.status === 'published')
      .sort((a, b) => {
        const timeA = a.publishedAt?.getTime() || 0;
        const timeB = b.publishedAt?.getTime() || 0;
        return timeB - timeA; // Newest first
      });

    console.log(`✅ Fetched ${allOpinions.length} total opinions, ${publishedOpinions.length} published`);
    return publishedOpinions;
  } catch (error: any) {
    console.error('❌ Error fetching published opinions:', error);
    throw new Error(`Failed to fetch opinions: ${error.message}`);
  }
};

/**
 * Subscribe to published opinions with real-time updates
 * Reads directly from Firestore using onSnapshot
 */
export const subscribeToPublishedOpinions = (
  callback: (opinions: Opinion[]) => void,
  onError?: (error: string) => void
): (() => void) => {
  const db = getDb();
  if (!db) {
    console.warn('Firebase not initialized, returning empty unsubscribe');
    if (onError) onError('Firebase not initialized');
    return () => {};
  }

  try {
    console.log('📰 Subscribing to published opinions in Firestore...');
    
    const opinionsRef = collection(db, 'data', 'opinions');
    
    // Query for published opinions, ordered by publishedAt descending
    const q = query(
      opinionsRef,
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const opinions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate?.() || new Date(),
          publishedAt: doc.data().publishedAt?.toDate?.() || null,
        })) as Opinion[];
        
        console.log(`✅ Found ${opinions.length} published opinions`);
        callback(opinions);
      },
      (error) => {
        console.error('❌ Error in published opinions subscription:', error);
        if (onError) {
          onError(`Firestore error: ${error.message}`);
        }
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('❌ Failed to subscribe to published opinions:', error);
    if (onError) {
      onError(`Setup error: ${error.message}`);
    }
    return () => {};
  }
};

/**
 * Get all pending opinions (admin only)
 * FIX: Fetch entire collection, filter in JavaScript to avoid permission/index issues
 */
export const getPendingOpinions = async (): Promise<Opinion[]> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // CRITICAL: Ensure authentication before fetching
    await ensureAuthenticated();
    
    console.log('📝 Attempting to fetch pending opinions from path: data/opinions');
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    const opinionsRef = collection(db, 'data', 'opinions');
    
    // FIX: Fetch entire collection without where/orderBy to avoid permission errors
    const snapshot = await getDocs(opinionsRef);
    const allOpinions: Opinion[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      allOpinions.push({
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as Opinion);
    });

    // Filter for pending status in JavaScript memory
    const pendingOpinions = allOpinions
      .filter(opinion => opinion.status === 'pending')
      .sort((a, b) => {
        const timeA = a.submittedAt?.getTime() || 0;
        const timeB = b.submittedAt?.getTime() || 0;
        return timeB - timeA; // Newest first
      });

    console.log(`✅ Fetched ${allOpinions.length} total opinions, ${pendingOpinions.length} pending`);
    return pendingOpinions;
  } catch (error: any) {
    console.error('❌ Error fetching pending opinions:', error);
    throw new Error(`Failed to fetch pending opinions: ${error.message}`);
  }
};

/**
 * Subscribe to pending opinions with real-time updates (admin only)
 * Reads directly from Firestore using onSnapshot
 */
export const subscribeToPendingOpinions = (
  callback: (opinions: Opinion[]) => void,
  onError?: (error: string) => void
): (() => void) => {
  const db = getDb();
  if (!db) {
    console.warn('Firebase not initialized, returning empty unsubscribe');
    if (onError) onError('Firebase not initialized');
    return () => {};
  }

  try {
    console.log('📝 Subscribing to pending opinions in Firestore...');
    
    const opinionsRef = collection(db, 'data', 'opinions');
    
    // Query for pending opinions, ordered by submittedAt descending
    const q = query(
      opinionsRef,
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const opinions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate?.() || new Date(),
          publishedAt: doc.data().publishedAt?.toDate?.() || null,
        })) as Opinion[];
        
        console.log(`✅ Found ${opinions.length} pending opinions`);
        callback(opinions);
      },
      (error) => {
        console.error('❌ Error in pending opinions subscription:', error);
        if (onError) {
          onError(`Firestore error: ${error.message}`);
        }
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('❌ Failed to subscribe to pending opinions:', error);
    if (onError) {
      onError(`Setup error: ${error.message}`);
    }
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
    // Get app ID (same pattern as FirebaseConnector)
    const appId = (typeof window !== 'undefined' && (window as any).__app_id) || 'morning-pulse-app';
    const opinionRef = doc(db, 'artifacts', appId, 'public', 'data', 'opinions', opinionId);
    await updateDoc(opinionRef, {
      status: 'published',
      publishedAt: serverTimestamp(),
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
    // Get app ID (same pattern as FirebaseConnector)
    const appId = (typeof window !== 'undefined' && (window as any).__app_id) || 'morning-pulse-app';
    const opinionRef = doc(db, 'artifacts', appId, 'public', 'data', 'opinions', opinionId);
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

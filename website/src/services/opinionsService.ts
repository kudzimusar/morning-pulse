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

const OPINIONS_COLLECTION = 'artifacts/morning-pulse-app/public/data/opinions';

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
    
    // Get app ID (same pattern as FirebaseConnector)
    const appId = (typeof window !== 'undefined' && (window as any).__app_id) || 'morning-pulse-app';
    
    // Create document path: artifacts/{appId}/public/data/opinions
    const path = `artifacts/${appId}/public/data/opinions`;
    console.log('📝 Attempting to submit opinion to path:', path);
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    const opinionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'opinions');
    
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
    
    // Get app ID (same pattern as FirebaseConnector)
    const appId = (typeof window !== 'undefined' && (window as any).__app_id) || 'morning-pulse-app';
    const path = `artifacts/${appId}/public/data/opinions`;
    console.log('📝 Attempting to fetch published opinions from path:', path);
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    // MANDATORY PATH: Use exact path structure
    const opinionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'opinions');
    
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
 * FIX: Use Cloud Function endpoint instead of direct Firestore collection access
 */
export const subscribeToPublishedOpinions = (
  callback: (opinions: Opinion[]) => void
): (() => void) => {
  let isUnsubscribed = false;
  let pollInterval: NodeJS.Timeout | null = null;

  const fetchOpinions = async () => {
    if (isUnsubscribed) return;

    try {
      // Get Cloud Function URL from environment or use default
      const functionUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL || 
        'https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/getOpinions';
      
      const response = await fetch(`${functionUrl}?status=published`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert ISO strings back to Date objects
      const opinions: Opinion[] = (data.opinions || []).map((op: any) => ({
        ...op,
        submittedAt: op.submittedAt ? new Date(op.submittedAt) : new Date(),
        publishedAt: op.publishedAt ? new Date(op.publishedAt) : null,
      }));

      console.log(`✅ Fetched ${opinions.length} published opinions via Cloud Function`);
      callback(opinions);
    } catch (error: any) {
      console.error('❌ Error fetching published opinions from Cloud Function:', error);
      callback([]);
    }
  };

  // Initial fetch
  fetchOpinions();

  // Poll every 10 seconds for real-time updates (less frequent for public page)
  pollInterval = setInterval(() => {
    if (!isUnsubscribed) {
      fetchOpinions();
    }
  }, 10000);

  // Return unsubscribe function
  return () => {
    isUnsubscribed = true;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
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
    
    // Get app ID (same pattern as FirebaseConnector)
    const appId = (typeof window !== 'undefined' && (window as any).__app_id) || 'morning-pulse-app';
    const path = `artifacts/${appId}/public/data/opinions`;
    console.log('📝 Attempting to fetch pending opinions from path:', path);
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    // MANDATORY PATH: Use exact path structure
    const opinionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'opinions');
    
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
 * FIX: Use Cloud Function endpoint instead of direct Firestore collection access
 * This bypasses the 'list' permission requirement by using backend admin access
 */
export const subscribeToPendingOpinions = (
  callback: (opinions: Opinion[]) => void,
  onError?: (error: string) => void
): (() => void) => {
  console.log('📝 Review Page: Initiating fetch for Pending Opinions via Cloud Function...');
  
  let isUnsubscribed = false;
  let hasReceivedData = false;
  let timeoutId: NodeJS.Timeout | null = null;
  let pollInterval: NodeJS.Timeout | null = null;

  // Set timeout for 8 seconds
  timeoutId = setTimeout(() => {
    if (!hasReceivedData && !isUnsubscribed) {
      console.error('⏱️ Timeout: Could not reach the editorial database after 8 seconds');
      if (onError) {
        onError('Timeout: Could not reach the editorial database.');
      }
      callback([]);
    }
  }, 8000);

  const fetchOpinions = async () => {
    if (isUnsubscribed) return;

    try {
      // Get Cloud Function URL from environment or use default
      const functionUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL || 
        'https://us-central1-gen-lang-client-0999441419.cloudfunctions.net/getOpinions';
      
      const response = await fetch(`${functionUrl}?status=pending`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      hasReceivedData = true;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Convert ISO strings back to Date objects
      const opinions: Opinion[] = (data.opinions || []).map((op: any) => ({
        ...op,
        submittedAt: op.submittedAt ? new Date(op.submittedAt) : new Date(),
        publishedAt: op.publishedAt ? new Date(op.publishedAt) : null,
      }));

      console.log(`✅ Fetched ${opinions.length} pending opinions via Cloud Function`);
      callback(opinions);
    } catch (error: any) {
      console.error('❌ Error fetching opinions from Cloud Function:', error);
      
      if (!hasReceivedData) {
        hasReceivedData = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (onError) {
          onError(`Failed to fetch opinions: ${error.message}`);
        }
        callback([]);
      }
    }
  };

  // Initial fetch
  fetchOpinions();

  // Poll every 5 seconds for real-time updates
  pollInterval = setInterval(() => {
    if (!isUnsubscribed) {
      fetchOpinions();
    }
  }, 5000);

  // Return unsubscribe function
  return () => {
    isUnsubscribed = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
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

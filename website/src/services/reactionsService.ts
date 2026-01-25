/**
 * Public Reactions Service
 * Handles likes/reactions for published opinions and editorials
 */

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

export interface Reaction {
  id: string;
  opinionId: string;
  userId: string; // Anonymous user ID
  type: 'like' | 'love' | 'insightful' | 'disagree';
  createdAt: Date;
}

// Get Firebase config
const getFirebaseConfig = (): any => {
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    const config = (window as any).__firebase_config;
    if (typeof config === 'object' && config !== null && config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
      return config;
    }
  }
  
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

// Initialize Firebase if needed
const initializeFirebaseIfNeeded = async (): Promise<{ db: Firestore | null; auth: Auth | null }> => {
  try {
    const config = getFirebaseConfig();
    if (!config) {
      return { db: null, auth: null };
    }
    
    let app: FirebaseApp;
    try {
      app = getApp();
    } catch (e) {
      app = initializeApp(config);
    }
    
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Ensure anonymous auth
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.warn('Anonymous auth failed:', error);
      }
    }
    
    return { db, auth };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return { db: null, auth: null };
  }
};

/**
 * Get or create anonymous user ID
 */
const getUserId = async (): Promise<string | null> => {
  const { auth } = await initializeFirebaseIfNeeded();
  if (!auth || !auth.currentUser) {
    return null;
  }
  return auth.currentUser.uid;
};

/**
 * Add a reaction to an opinion
 */
export const addReaction = async (
  opinionId: string,
  type: Reaction['type']
): Promise<string | null> => {
  const { db } = await initializeFirebaseIfNeeded();
  if (!db) {
    console.warn('Firebase not initialized');
    return null;
  }
  
  const userId = await getUserId();
  if (!userId) {
    console.warn('User not authenticated');
    return null;
  }
  
  // Check if user already reacted
  const existingQuery = query(
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'reactions'),
    where('opinionId', '==', opinionId),
    where('userId', '==', userId)
  );
  
  const existingSnapshot = await getDocs(existingQuery);
  
  let action: 'add' | 'remove' = 'add';
  
  // If same reaction exists, remove it (toggle)
  if (!existingSnapshot.empty) {
    const existingDoc = existingSnapshot.docs[0];
    const existingData = existingDoc.data();
    if (existingData.type === type) {
      // Remove reaction (toggle off)
      await deleteDoc(existingDoc.ref);
      action = 'remove';
      
      // Track analytics
      try {
        const { trackReaction } = await import('./analyticsService');
        trackReaction(opinionId, type, 'remove');
      } catch (error) {
        // Silently fail analytics
      }
      
      return null;
    } else {
      // Update reaction type
      await deleteDoc(existingDoc.ref);
      action = 'add';
    }
  }
  
  // Add new reaction
  const reactionData = {
    opinionId,
    userId,
    type,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'reactions'),
    reactionData
  );
  
  // Track analytics
  try {
    const { trackReaction } = await import('./analyticsService');
    trackReaction(opinionId, type, 'add');
  } catch (error) {
    // Silently fail analytics
  }
  
  return docRef.id;
};

/**
 * Remove a reaction
 */
export const removeReaction = async (reactionId: string): Promise<void> => {
  const { db } = await initializeFirebaseIfNeeded();
  if (!db) {
    console.warn('Firebase not initialized');
    return;
  }
  
  const reactionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'reactions', reactionId);
  await deleteDoc(reactionRef);
};

/**
 * Get reactions for an opinion
 */
export const getOpinionReactions = async (opinionId: string): Promise<Reaction[]> => {
  const { db } = await initializeFirebaseIfNeeded();
  if (!db) {
    console.warn('Firebase not initialized');
    return [];
  }
  
  const reactionsQuery = query(
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'reactions'),
    where('opinionId', '==', opinionId)
  );
  
  const snapshot = await getDocs(reactionsQuery);
  const reactions: Reaction[] = [];
  
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    reactions.push({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date()
    } as Reaction);
  });
  
  return reactions;
};

/**
 * Get reaction counts for an opinion
 */
export const getOpinionReactionCounts = async (opinionId: string): Promise<Record<string, number>> => {
  const reactions = await getOpinionReactions(opinionId);
  const counts: Record<string, number> = {
    like: 0,
    love: 0,
    insightful: 0,
    disagree: 0,
    total: 0
  };
  
  reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
    counts.total += 1;
  });
  
  return counts;
};

/**
 * Check if current user has reacted to an opinion
 */
export const getUserReaction = async (opinionId: string): Promise<Reaction | null> => {
  const { db } = await initializeFirebaseIfNeeded();
  if (!db) {
    return null;
  }
  
  const userId = await getUserId();
  if (!userId) {
    return null;
  }
  
  const reactionsQuery = query(
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'reactions'),
    where('opinionId', '==', opinionId),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(reactionsQuery);
  if (snapshot.empty) {
    return null;
  }
  
  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date()
  } as Reaction;
};

/**
 * Subscribe to real-time reaction updates for an opinion
 */
export const subscribeToOpinionReactions = (
  opinionId: string,
  callback: (reactions: Reaction[], counts: Record<string, number>) => void
): (() => void) => {
  let unsubscribe: (() => void) | null = null;
  
  const setup = async () => {
    const { db } = await initializeFirebaseIfNeeded();
    if (!db) {
      console.warn('Firebase not initialized');
      return () => {};
    }
    
    const reactionsQuery = query(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'reactions'),
      where('opinionId', '==', opinionId)
    );
    
    unsubscribe = onSnapshot(reactionsQuery, (snapshot) => {
      const reactions: Reaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        reactions.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        } as Reaction);
      });
      
      // Calculate counts
      const counts: Record<string, number> = {
        like: 0,
        love: 0,
        insightful: 0,
        disagree: 0,
        total: 0
      };
      
      reactions.forEach(reaction => {
        counts[reaction.type] = (counts[reaction.type] || 0) + 1;
        counts.total += 1;
      });
      
      callback(reactions, counts);
    });
  };
  
  setup();
  
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

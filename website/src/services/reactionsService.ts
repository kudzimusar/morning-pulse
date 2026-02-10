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
import { auth, db } from './firebase';

export interface Reaction {
  id: string;
  opinionId: string;
  userId: string; // Anonymous user ID
  type: 'like' | 'love' | 'insightful' | 'disagree';
  createdAt: Date;
}

const initializeFirebaseIfNeeded = async () => ({ db, auth });
const APP_ID = (window as any).__app_id || 'morning-pulse-app';

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
      return () => { };
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

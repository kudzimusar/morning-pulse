/**
 * Public Comments Service
 * Handles public comments/replies on published opinions and editorials
 * Separate from editor inline comments (commentsService.ts)
 */

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  orderBy,
  Firestore
} from 'firebase/firestore';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

export interface PublicComment {
  id: string;
  opinionId: string;
  userId: string; // Anonymous user ID
  authorName: string; // Display name (can be "Anonymous" or user-provided)
  content: string;
  parentId?: string; // For threaded replies
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  likes: number; // Simple like count for comments
  status: 'active' | 'deleted' | 'moderated';
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
 * Add a public comment to an opinion
 */
export const addPublicComment = async (
  opinionId: string,
  content: string,
  authorName: string = 'Anonymous',
  parentId?: string
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
  
  if (!content.trim()) {
    console.warn('Comment content is empty');
    return null;
  }
  
  const commentData = {
    opinionId,
    userId,
    authorName: authorName.trim() || 'Anonymous',
    content: content.trim(),
    parentId: parentId || null,
    likes: 0,
    isEdited: false,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'publicComments'),
    commentData
  );
  
  return docRef.id;
};

/**
 * Update a public comment
 */
export const updatePublicComment = async (
  commentId: string,
  content: string
): Promise<void> => {
  const { db } = await initializeFirebaseIfNeeded();
  if (!db) {
    console.warn('Firebase not initialized');
    return;
  }
  
  const userId = await getUserId();
  if (!userId) {
    console.warn('User not authenticated');
    return;
  }
  
  // Verify user owns the comment
  const commentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'publicComments', commentId);
  const commentSnap = await getDoc(commentRef);
  
  if (!commentSnap.exists()) {
    throw new Error('Comment not found');
  }
  
  const commentData = commentSnap.data();
  if (commentData.userId !== userId) {
    throw new Error('User does not have permission to edit this comment');
  }
  
  await updateDoc(commentRef, {
    content: content.trim(),
    isEdited: true,
    updatedAt: serverTimestamp()
  });
};

/**
 * Delete a public comment (soft delete)
 */
export const deletePublicComment = async (commentId: string): Promise<void> => {
  const { db } = await initializeFirebaseIfNeeded();
  if (!db) {
    console.warn('Firebase not initialized');
    return;
  }
  
  const userId = await getUserId();
  if (!userId) {
    console.warn('User not authenticated');
    return;
  }
  
  // Verify user owns the comment
  const commentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'publicComments', commentId);
  const commentSnap = await getDoc(commentRef);
  
  if (!commentSnap.exists()) {
    throw new Error('Comment not found');
  }
  
  const commentData = commentSnap.data();
  if (commentData.userId !== userId) {
    throw new Error('User does not have permission to delete this comment');
  }
  
  await updateDoc(commentRef, {
    status: 'deleted',
    updatedAt: serverTimestamp()
  });
};

/**
 * Like a comment
 */
export const likeComment = async (commentId: string): Promise<void> => {
  const { db } = await initializeFirebaseIfNeeded();
  if (!db) {
    console.warn('Firebase not initialized');
    return;
  }
  
  const commentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'publicComments', commentId);
  const commentSnap = await getDoc(commentRef);
  
  if (!commentSnap.exists()) {
    throw new Error('Comment not found');
  }
  
  const currentLikes = commentSnap.data().likes || 0;
  
  await updateDoc(commentRef, {
    likes: currentLikes + 1
  });
};

/**
 * Get all public comments for an opinion
 */
export const getOpinionComments = async (opinionId: string): Promise<PublicComment[]> => {
  const { db } = await initializeFirebaseIfNeeded();
  if (!db) {
    console.warn('Firebase not initialized');
    return [];
  }
  
  const commentsQuery = query(
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'publicComments'),
    where('opinionId', '==', opinionId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(commentsQuery);
  const comments: PublicComment[] = [];
  
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    comments.push({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date()
    } as PublicComment);
  });
  
  return comments;
};

/**
 * Subscribe to real-time comment updates for an opinion
 */
export const subscribeToOpinionComments = (
  opinionId: string,
  callback: (comments: PublicComment[]) => void
): (() => void) => {
  let unsubscribe: (() => void) | null = null;
  
  const setup = async () => {
    const { db } = await initializeFirebaseIfNeeded();
    if (!db) {
      console.warn('Firebase not initialized');
      return () => {};
    }
    
    const commentsQuery = query(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'publicComments'),
      where('opinionId', '==', opinionId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const comments: PublicComment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        comments.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        } as PublicComment);
      });
      
      callback(comments);
    });
  };
  
  setup();
  
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

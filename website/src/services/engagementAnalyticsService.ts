/**
 * Engagement Analytics Service
 * Tracks and aggregates reactions and comments data for dashboard
 */

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Firestore
} from 'firebase/firestore';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

export interface OpinionEngagement {
  opinionId: string;
  headline: string;
  slug?: string;
  reactions: {
    like: number;
    love: number;
    insightful: number;
    disagree: number;
    total: number;
  };
  comments: number;
  replies: number;
  totalEngagement: number;
}

export interface EngagementSummary {
  totalReactions: number;
  totalComments: number;
  totalReplies: number;
  topOpinions: OpinionEngagement[];
  reactionBreakdown: {
    like: number;
    love: number;
    insightful: number;
    disagree: number;
  };
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
const initializeFirebaseIfNeeded = (): Firestore | null => {
  try {
    const config = getFirebaseConfig();
    if (!config) {
      return null;
    }
    
    let app: FirebaseApp;
    try {
      app = getApp();
    } catch (e) {
      app = initializeApp(config);
    }
    
    return getFirestore(app);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
};

/**
 * Get engagement summary for all opinions
 */
export const getEngagementSummary = async (): Promise<EngagementSummary> => {
  const db = initializeFirebaseIfNeeded();
  if (!db) {
    console.warn('Firebase not initialized');
    return {
      totalReactions: 0,
      totalComments: 0,
      totalReplies: 0,
      topOpinions: [],
      reactionBreakdown: { like: 0, love: 0, insightful: 0, disagree: 0 }
    };
  }

  try {
    // Get all reactions
    const reactionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'reactions');
    const reactionsSnapshot = await getDocs(reactionsRef);
    
    // Get all comments
    const commentsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'publicComments');
    const commentsQuery = query(commentsRef, where('status', '==', 'active'));
    const commentsSnapshot = await getDocs(commentsQuery);
    
    // Aggregate by opinion
    const opinionMap = new Map<string, OpinionEngagement>();
    
    // Process reactions
    reactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      const opinionId = data.opinionId;
      
      if (!opinionMap.has(opinionId)) {
        opinionMap.set(opinionId, {
          opinionId,
          headline: '',
          reactions: { like: 0, love: 0, insightful: 0, disagree: 0, total: 0 },
          comments: 0,
          replies: 0,
          totalEngagement: 0
        });
      }
      
      const engagement = opinionMap.get(opinionId)!;
      engagement.reactions[data.type as keyof typeof engagement.reactions]++;
      engagement.reactions.total++;
    });
    
    // Process comments
    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const opinionId = data.opinionId;
      
      if (!opinionMap.has(opinionId)) {
        opinionMap.set(opinionId, {
          opinionId,
          headline: '',
          reactions: { like: 0, love: 0, insightful: 0, disagree: 0, total: 0 },
          comments: 0,
          replies: 0,
          totalEngagement: 0
        });
      }
      
      const engagement = opinionMap.get(opinionId)!;
      if (data.parentId) {
        engagement.replies++;
      } else {
        engagement.comments++;
      }
    });
    
    // Get opinion details
    const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
    const publishedQuery = query(opinionsRef, where('status', '==', 'published'));
    const opinionsSnapshot = await getDocs(publishedQuery);
    
    opinionsSnapshot.forEach((doc) => {
      const data = doc.data();
      const opinionId = doc.id;
      
      if (opinionMap.has(opinionId)) {
        const engagement = opinionMap.get(opinionId)!;
        engagement.headline = data.headline || '';
        engagement.slug = data.slug;
        engagement.totalEngagement = engagement.reactions.total + engagement.comments + engagement.replies;
      }
    });
    
    // Convert to array and sort by total engagement
    const topOpinions = Array.from(opinionMap.values())
      .filter(op => op.headline) // Only include opinions we found
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 10); // Top 10
    
    // Calculate totals
    const totalReactions = Array.from(opinionMap.values()).reduce((sum, op) => sum + op.reactions.total, 0);
    const totalComments = Array.from(opinionMap.values()).reduce((sum, op) => sum + op.comments, 0);
    const totalReplies = Array.from(opinionMap.values()).reduce((sum, op) => sum + op.replies, 0);
    
    // Calculate reaction breakdown
    const reactionBreakdown = {
      like: Array.from(opinionMap.values()).reduce((sum, op) => sum + op.reactions.like, 0),
      love: Array.from(opinionMap.values()).reduce((sum, op) => sum + op.reactions.love, 0),
      insightful: Array.from(opinionMap.values()).reduce((sum, op) => sum + op.reactions.insightful, 0),
      disagree: Array.from(opinionMap.values()).reduce((sum, op) => sum + op.reactions.disagree, 0)
    };
    
    return {
      totalReactions,
      totalComments,
      totalReplies,
      topOpinions,
      reactionBreakdown
    };
  } catch (error) {
    console.error('Error fetching engagement summary:', error);
    return {
      totalReactions: 0,
      totalComments: 0,
      totalReplies: 0,
      topOpinions: [],
      reactionBreakdown: { like: 0, love: 0, insightful: 0, disagree: 0 }
    };
  }
};

/**
 * Get engagement for a specific opinion
 */
export const getOpinionEngagement = async (opinionId: string): Promise<OpinionEngagement | null> => {
  const db = initializeFirebaseIfNeeded();
  if (!db) {
    return null;
  }

  try {
    // Get reactions for this opinion
    const reactionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'reactions');
    const reactionsQuery = query(reactionsRef, where('opinionId', '==', opinionId));
    const reactionsSnapshot = await getDocs(reactionsQuery);
    
    // Get comments for this opinion
    const commentsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'publicComments');
    const commentsQuery = query(
      commentsRef, 
      where('opinionId', '==', opinionId),
      where('status', '==', 'active')
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    
    // Aggregate
    const engagement: OpinionEngagement = {
      opinionId,
      headline: '',
      reactions: { like: 0, love: 0, insightful: 0, disagree: 0, total: 0 },
      comments: 0,
      replies: 0,
      totalEngagement: 0
    };
    
    reactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      engagement.reactions[data.type as keyof typeof engagement.reactions]++;
      engagement.reactions.total++;
    });
    
    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.parentId) {
        engagement.replies++;
      } else {
        engagement.comments++;
      }
    });
    
    // Get opinion details
    const { getDoc, doc } = await import('firebase/firestore');
    const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', opinionId);
    const opinionSnap = await getDoc(opinionRef);
    
    if (opinionSnap.exists()) {
      const data = opinionSnap.data();
      engagement.headline = data.headline || '';
      engagement.slug = data.slug;
    }
    
    engagement.totalEngagement = engagement.reactions.total + engagement.comments + engagement.replies;
    
    return engagement;
  } catch (error) {
    console.error('Error fetching opinion engagement:', error);
    return null;
  }
};

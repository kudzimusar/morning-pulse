/**
 * Analytics Service
 * Tracks and aggregates statistics for the editorial platform
 */

import { 
  getFirestore, 
  collection, 
  query, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

const APP_ID = "morning-pulse-app";

// Get Firestore instance
const getDb = (): Firestore => {
  try {
    const app = getApp();
    return getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

export interface ArticleStats {
  articleId: string;
  views: number;
  lastViewed?: Date;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalViews: number;
  publishedCount: number;
  submittedCount: number;
  rejectedCount: number;
}

export interface AnalyticsSummary {
  totalPublished: number;
  totalSubmissions: number;
  totalRejected: number;
  viewsToday: number;
  viewsThisWeek: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{
    action: string;
    timestamp: Date;
    articleId?: string;
  }>;
}

/**
 * Get analytics summary
 */
export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const db = getDb();
  const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
  
  const snapshot = await getDocs(opinionsRef);
  const opinions: any[] = [];
  
  snapshot.forEach((docSnap) => {
    opinions.push({
      id: docSnap.id,
      ...docSnap.data(),
      submittedAt: docSnap.data().submittedAt?.toDate?.() || null,
      publishedAt: docSnap.data().publishedAt?.toDate?.() || null,
    });
  });
  
  // Calculate statistics
  const totalPublished = opinions.filter(op => op.status === 'published').length;
  const totalSubmissions = opinions.length;
  const totalRejected = opinions.filter(op => op.status === 'rejected').length;
  
  // Category counts
  const categoryCounts: Record<string, number> = {};
  opinions.forEach(op => {
    if (op.category) {
      categoryCounts[op.category] = (categoryCounts[op.category] || 0) + 1;
    }
  });
  
  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  // For now, views are simulated (would need view tracking in production)
  const viewsToday = 0; // TODO: Implement view tracking
  const viewsThisWeek = 0; // TODO: Implement view tracking
  
  // Recent activity (from published articles)
  const recentActivity = opinions
    .filter(op => op.publishedAt)
    .sort((a, b) => {
      const timeA = a.publishedAt?.getTime() || 0;
      const timeB = b.publishedAt?.getTime() || 0;
      return timeB - timeA;
    })
    .slice(0, 10)
    .map(op => ({
      action: 'Published',
      timestamp: op.publishedAt || new Date(),
      articleId: op.id,
    }));
  
  return {
    totalPublished,
    totalSubmissions,
    totalRejected,
    viewsToday,
    viewsThisWeek,
    topCategories,
    recentActivity,
  };
};

/**
 * Increment article view count
 */
export const incrementArticleView = async (articleId: string): Promise<void> => {
  const db = getDb();
  const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'analytics', 'articles', articleId);
  
  try {
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      await updateDoc(statsRef, {
        views: increment(1),
        lastViewed: serverTimestamp(),
      });
    } else {
      // Create new stats document
      await updateDoc(statsRef, {
        views: 1,
        lastViewed: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error incrementing article view:', error);
    // Fail silently - analytics shouldn't break the app
  }
};

/**
 * Get article statistics
 */
export const getArticleStats = async (articleId: string): Promise<ArticleStats | null> => {
  const db = getDb();
  const statsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'analytics', 'articles', articleId);
  
  try {
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        articleId,
        views: data.views || 0,
        lastViewed: data.lastViewed?.toDate?.() || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting article stats:', error);
    return null;
  }
};

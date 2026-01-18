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
  // NEW: Opinion Performance
  topOpinions?: Array<{
    id: string;
    headline: string;
    authorName: string;
    slug?: string;
    views: number;
    publishedAt: Date;
  }>;
  // NEW: Author Analytics
  topAuthors?: Array<{
    authorName: string;
    publishedCount: number;
    totalViews: number;
    avgViewsPerArticle: number;
  }>;
  // NEW: Workflow Metrics
  avgTimeToPublish?: number; // Average hours from submission to publish
  totalDrafts?: number;
  totalPending?: number;
  totalInReview?: number;
  totalScheduled?: number;
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
  
  // NEW: Calculate workflow metrics
  const totalDrafts = opinions.filter(op => op.status === 'draft').length;
  const totalPending = opinions.filter(op => op.status === 'pending').length;
  const totalInReview = opinions.filter(op => op.status === 'in-review').length;
  const totalScheduled = opinions.filter(op => op.status === 'scheduled').length;
  
  // NEW: Calculate avg time to publish
  const publishedWithTimes = opinions.filter(op => op.publishedAt && op.submittedAt);
  const avgTimeToPublish = publishedWithTimes.length > 0
    ? publishedWithTimes.reduce((sum, op) => {
        const diff = op.publishedAt!.getTime() - op.submittedAt.getTime();
        return sum + diff;
      }, 0) / publishedWithTimes.length / (1000 * 60 * 60) // Convert to hours
    : 0;
  
  // NEW: Get article view stats for top opinions
  const topOpinions = await getTopOpinions(5);
  
  // NEW: Calculate author analytics
  const authorStats: Record<string, { publishedCount: number; totalViews: number }> = {};
  const publishedOpinions = opinions.filter(op => op.status === 'published');
  
  publishedOpinions.forEach(op => {
    const author = op.authorName || 'Unknown';
    if (!authorStats[author]) {
      authorStats[author] = { publishedCount: 0, totalViews: 0 };
    }
    authorStats[author].publishedCount++;
  });
  
  // Get view counts for each author
  for (const opinion of publishedOpinions) {
    const author = opinion.authorName || 'Unknown';
    const stats = await getArticleStats(opinion.id);
    if (stats) {
      authorStats[author].totalViews += stats.views;
    }
  }
  
  const topAuthors = Object.entries(authorStats)
    .map(([authorName, stats]) => ({
      authorName,
      publishedCount: stats.publishedCount,
      totalViews: stats.totalViews,
      avgViewsPerArticle: stats.publishedCount > 0 ? Math.round(stats.totalViews / stats.publishedCount) : 0,
    }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 10);
  
  return {
    totalPublished,
    totalSubmissions,
    totalRejected,
    viewsToday,
    viewsThisWeek,
    topCategories,
    recentActivity,
    // NEW: Enhanced analytics
    topOpinions,
    topAuthors,
    avgTimeToPublish: Math.round(avgTimeToPublish * 10) / 10, // Round to 1 decimal
    totalDrafts,
    totalPending,
    totalInReview,
    totalScheduled,
  };
};

/**
 * NEW: Get top performing opinions by view count
 */
export const getTopOpinions = async (limit: number = 10): Promise<Array<{
  id: string;
  headline: string;
  authorName: string;
  slug?: string;
  views: number;
  publishedAt: Date;
}>> => {
  const db = getDb();
  const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
  const opinionsSnapshot = await getDocs(opinionsRef);
  
  const opinionStats: Array<{
    id: string;
    headline: string;
    authorName: string;
    slug?: string;
    views: number;
    publishedAt: Date;
  }> = [];
  
  for (const docSnap of opinionsSnapshot.docs) {
    const data = docSnap.data();
    if (data.status === 'published') {
      const stats = await getArticleStats(docSnap.id);
      opinionStats.push({
        id: docSnap.id,
        headline: data.headline || 'Untitled',
        authorName: data.authorName || 'Unknown',
        slug: data.slug,
        views: stats?.views || 0,
        publishedAt: data.publishedAt?.toDate?.() || new Date(),
      });
    }
  }
  
  // Sort by views descending
  return opinionStats
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
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

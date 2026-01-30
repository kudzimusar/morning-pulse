/**
 * Writer Metrics Service (Sprint 3)
 * Provides functions to read and manage writer performance analytics
 */

import { 
  getFirestore,
  collection, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { WriterMetrics } from '../../types';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

// Get Firestore instance
let db: Firestore | null = null;

const getDb = (): Firestore | null => {
  if (db) return db;
  
  try {
    const app = getApp();
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.error('Firebase initialization error in writerMetricsService:', e);
    return null;
  }
};

/**
 * Get writer metrics for a specific writer
 * Reads from: artifacts/{appId}/public/data/writerMetrics/{writerId}
 */
export const getWriterMetrics = async (writerId: string): Promise<WriterMetrics | null> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const metricsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writerMetrics', writerId);
    const metricsSnap = await getDoc(metricsRef);
    
    if (!metricsSnap.exists()) {
      console.log(`No metrics found for writer ${writerId}`);
      return null;
    }
    
    const data = metricsSnap.data();
    return {
      writerId: data.writerId,
      writerName: data.writerName || 'Unknown',
      rolling30d: {
        submitted: data.rolling30d?.submitted || 0,
        published: data.rolling30d?.published || 0,
        rejected: data.rolling30d?.rejected || 0,
        avgReviewHours: data.rolling30d?.avgReviewHours || 0,
        rejectionRate: data.rolling30d?.rejectionRate || 0,
        totalViews: data.rolling30d?.totalViews || 0,
        avgViewsPerArticle: data.rolling30d?.avgViewsPerArticle || 0,
      },
      lifetime: {
        totalSubmitted: data.lifetime?.totalSubmitted || 0,
        totalPublished: data.lifetime?.totalPublished || 0,
        totalRejected: data.lifetime?.totalRejected || 0,
        totalViews: data.lifetime?.totalViews || 0,
        avgViewsPerArticle: data.lifetime?.avgViewsPerArticle || 0,
        firstPublishedAt: data.lifetime?.firstPublishedAt?.toDate?.() || undefined,
        lastPublishedAt: data.lifetime?.lastPublishedAt?.toDate?.() || undefined,
      },
      lastComputed: data.lastComputed?.toDate?.() || new Date(),
      categoryBreakdown: data.categoryBreakdown || undefined,
    } as WriterMetrics;
  } catch (error: any) {
    console.error('Error fetching writer metrics:', error);
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }
};

/**
 * Get all writer metrics (for admin leaderboard)
 * Reads from: artifacts/{appId}/public/data/writerMetrics
 */
export const getAllWriterMetrics = async (): Promise<WriterMetrics[]> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    const metricsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writerMetrics');
    const metricsSnap = await getDocs(metricsRef);
    
    const allMetrics: WriterMetrics[] = [];
    
    metricsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      allMetrics.push({
        writerId: data.writerId || docSnap.id,
        writerName: data.writerName || 'Unknown',
        rolling30d: {
          submitted: data.rolling30d?.submitted || 0,
          published: data.rolling30d?.published || 0,
          rejected: data.rolling30d?.rejected || 0,
          avgReviewHours: data.rolling30d?.avgReviewHours || 0,
          rejectionRate: data.rolling30d?.rejectionRate || 0,
          totalViews: data.rolling30d?.totalViews || 0,
          avgViewsPerArticle: data.rolling30d?.avgViewsPerArticle || 0,
        },
        lifetime: {
          totalSubmitted: data.lifetime?.totalSubmitted || 0,
          totalPublished: data.lifetime?.totalPublished || 0,
          totalRejected: data.lifetime?.totalRejected || 0,
          totalViews: data.lifetime?.totalViews || 0,
          avgViewsPerArticle: data.lifetime?.avgViewsPerArticle || 0,
          firstPublishedAt: data.lifetime?.firstPublishedAt?.toDate?.() || undefined,
          lastPublishedAt: data.lifetime?.lastPublishedAt?.toDate?.() || undefined,
        },
        lastComputed: data.lastComputed?.toDate?.() || new Date(),
        categoryBreakdown: data.categoryBreakdown || undefined,
      });
    });
    
    // Sort by published articles in last 30 days (most active first)
    allMetrics.sort((a, b) => b.rolling30d.published - a.rolling30d.published);
    
    console.log(`✅ Loaded metrics for ${allMetrics.length} writers`);
    return allMetrics;
  } catch (error: any) {
    console.error('Error fetching all writer metrics:', error);
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }
};

/**
 * Calculate on-the-fly metrics for a writer (when pre-computed metrics don't exist)
 * This is a fallback - Cloud Function should handle regular computation
 */
export const calculateWriterMetricsOnTheFly = async (writerId: string): Promise<WriterMetrics | null> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // Fetch all opinions by this author
    const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
    const q = query(opinionsRef, where('authorId', '==', writerId));
    const opinionsSnap = await getDocs(q);
    
    if (opinionsSnap.empty) {
      console.log(`No articles found for writer ${writerId}`);
      return null;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let totalSubmitted = 0;
    let totalPublished = 0;
    let totalRejected = 0;
    let submitted30d = 0;
    let published30d = 0;
    let rejected30d = 0;
    let totalReviewHours = 0;
    let reviewedCount = 0;
    let firstPublishedAt: Date | undefined;
    let lastPublishedAt: Date | undefined;
    let writerName = 'Unknown';
    const categoryStats: Record<string, { published: number; views: number }> = {};

    opinionsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const submittedAt = data.submittedAt?.toDate?.() || new Date();
      const publishedAt = data.publishedAt?.toDate?.();
      const status = data.status;
      const category = data.category || 'general';
      
      // Capture writer name
      if (data.authorName) writerName = data.authorName;
      
      // Lifetime stats
      totalSubmitted++;
      if (status === 'published') {
        totalPublished++;
        if (!firstPublishedAt || publishedAt < firstPublishedAt) {
          firstPublishedAt = publishedAt;
        }
        if (!lastPublishedAt || publishedAt > lastPublishedAt) {
          lastPublishedAt = publishedAt;
        }
        
        // Category breakdown
        if (!categoryStats[category]) {
          categoryStats[category] = { published: 0, views: 0 };
        }
        categoryStats[category].published++;
        
        // Review time calculation
        if (publishedAt && submittedAt) {
          const reviewHours = (publishedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
          totalReviewHours += reviewHours;
          reviewedCount++;
        }
      } else if (status === 'rejected') {
        totalRejected++;
      }
      
      // 30-day stats
      if (submittedAt >= thirtyDaysAgo) {
        submitted30d++;
        if (status === 'published') published30d++;
        if (status === 'rejected') rejected30d++;
      }
    });

    const avgReviewHours = reviewedCount > 0 ? totalReviewHours / reviewedCount : 0;
    const rejectionRate = totalSubmitted > 0 ? (totalRejected / totalSubmitted) * 100 : 0;

    return {
      writerId,
      writerName,
      rolling30d: {
        submitted: submitted30d,
        published: published30d,
        rejected: rejected30d,
        avgReviewHours: Math.round(avgReviewHours * 10) / 10,
        rejectionRate: Math.round(rejectionRate * 10) / 10,
        totalViews: 0, // Views not tracked in opinions collection
        avgViewsPerArticle: 0,
      },
      lifetime: {
        totalSubmitted,
        totalPublished,
        totalRejected,
        totalViews: 0,
        avgViewsPerArticle: 0,
        firstPublishedAt,
        lastPublishedAt,
      },
      lastComputed: now,
      categoryBreakdown: categoryStats,
    };
  } catch (error: any) {
    console.error('Error calculating writer metrics on-the-fly:', error);
    throw new Error(`Failed to calculate metrics: ${error.message}`);
  }
};

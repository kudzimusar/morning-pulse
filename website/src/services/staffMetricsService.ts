import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from './firebase';

export interface StaffMetrics {
    staffId: string;
    articlesPublished: number;
    totalViews: number;
    avgViewsPerArticle: number;
    totalEngagement: number;
    lastPublishedAt: any;
    trend: any[];
}

/**
 * Fetch performance metrics for a specific staff member
 */
export const getStaffMetrics = async (staffId: string): Promise<StaffMetrics | null> => {
    try {
        const metricsRef = doc(db, 'analytics', 'staff', 'data', staffId);
        const snap = await getDoc(metricsRef);

        if (snap.exists()) {
            return { staffId, ...snap.data() } as StaffMetrics;
        }

        // Fallback if aggregate not yet created by Cloud Functions
        return null;
    } catch (error) {
        console.error("Error fetching staff metrics:", error);
        return null;
    }
};

/**
 * Fetch leaderboard or comparison of staff performance
 */
export const getStaffLeaderboard = async (sortBy: 'views' | 'articles' = 'views'): Promise<any[]> => {
    try {
        const staffRef = collection(db, 'analytics', 'staff', 'data');
        const q = query(
            staffRef,
            orderBy(sortBy === 'views' ? 'totalViews' : 'articlesPublished', 'desc'),
            limit(10)
        );

        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching staff leaderboard:", error);
        return [];
    }
};

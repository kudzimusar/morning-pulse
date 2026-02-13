import {
    collection,
    query,
    where,
    getCountFromServer,
    getDocs
} from 'firebase/firestore';
import { db } from './firebase';

const APP_ID = (typeof window !== 'undefined' && (window as any).__app_id) ? (window as any).__app_id : 'morning-pulse-app';

export interface DashboardStats {
    totalUsers: number;
    activeStaff: number;
    onlineStaff: number;
    publishedContent: number;
    pendingContent: number;
    totalSubscribers: number;
    revenueMTD: number;
    growthRate: number;
}

export interface PriorityCounts {
    scheduledCount: number;
    imageIssuesCount: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const usersCount = await getCountFromServer(collection(db, 'users'));
        const staffCount = await getCountFromServer(collection(db, 'staff'));

        // Use artifacts path for opinions and subscribers (matches rest of app)
        const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
        const subscribersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers');

        const [publishedSnap, pendingSnap, subscribersSnap] = await Promise.all([
            getCountFromServer(query(opinionsRef, where('status', '==', 'published'))),
            getCountFromServer(query(opinionsRef, where('status', '==', 'pending'))),
            getCountFromServer(query(subscribersRef, where('status', '==', 'active'))),
        ]);

        const publishedContent = publishedSnap.data().count;
        const pendingContent = pendingSnap.data().count;
        const totalSubscribers = subscribersSnap.data().count;

        // Revenue: derive from subscribers * est ARPU when no payment data, or 0
        const revenueMTD = totalSubscribers > 0 ? totalSubscribers * 7.99 : 0; // placeholder ARPU
        const growthRate = 0; // TODO: compute from historical aggregates when available

        return {
            totalUsers: usersCount.data().count,
            activeStaff: staffCount.data().count,
            onlineStaff: 0,
            publishedContent,
            pendingContent,
            totalSubscribers: subscribersSnap.data().count,
            revenueMTD,
            growthRate
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            totalUsers: 0,
            activeStaff: 0,
            onlineStaff: 0,
            publishedContent: 0,
            pendingContent: 0,
            totalSubscribers: 0,
            revenueMTD: 0,
            growthRate: 0
        };
    }
};

export const fetchPriorityCounts = async (): Promise<PriorityCounts> => {
    try {
        const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
        const [scheduledSnap, opinionsSnap] = await Promise.all([
            getCountFromServer(query(opinionsRef, where('status', '==', 'scheduled'))),
            getDocs(query(opinionsRef, where('status', 'in', ['pending', 'published', 'in-review']))),
        ]);

        let imageIssuesCount = 0;
        opinionsSnap.forEach((doc) => {
            const d = doc.data();
            if (!d.finalImageUrl && !d.imageUrl) imageIssuesCount++;
        });

        return {
            scheduledCount: scheduledSnap.data().count,
            imageIssuesCount,
        };
    } catch (error) {
        console.error('Error fetching priority counts:', error);
        return { scheduledCount: 0, imageIssuesCount: 0 };
    }
};

/**
 * Fetch trend data from analytics when available; otherwise single-point from current stats.
 */
export const fetchTrendData = async (metric: string): Promise<{ name: string; value: number }[]> => {
    try {
        const { getAnalyticsSummary } = await import('./analyticsService');
        const summary = await getAnalyticsSummary(db);
        if (summary.dailyTraffic && summary.dailyTraffic.length > 0) {
            const sorted = [...summary.dailyTraffic].sort((a, b) => a.date.localeCompare(b.date));
            return sorted.map((d) => {
                const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                const views = d.views || 0;
                const adImps = d.adImpressions || views * 3;
                return {
                    name: dayName,
                    value: metric === 'revenue' ? Math.round(adImps * 0.01) : views,
                };
            });
        }
    } catch (e) {
        console.warn('Analytics fetch for trend failed:', e);
    }

    const stats = await fetchDashboardStats();
    const now = new Date();
    const label = now.toLocaleDateString('en-US', { month: 'short' });
    if (metric === 'revenue') return [{ name: label, value: stats.revenueMTD }];
    if (metric === 'users') return [{ name: label, value: stats.totalUsers }];
    if (metric === 'subscribers') return [{ name: label, value: stats.totalSubscribers }];
    return [];
};

/** Content pipeline counts by status from artifacts/{APP_ID}/public/data/opinions */
export interface ContentPipelineCount {
    name: string;
    count: number;
}

const CONTENT_STATUSES: { key: string; label: string }[] = [
    { key: 'draft', label: 'Draft' },
    { key: 'pending', label: 'Pending' },
    { key: 'in-review', label: 'In Review' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'published', label: 'Published' },
    { key: 'rejected', label: 'Rejected' },
];

export const fetchContentPipelineCounts = async (): Promise<ContentPipelineCount[]> => {
    try {
        const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
        const counts = await Promise.all(
            CONTENT_STATUSES.map(async ({ key, label }) => {
                const q = query(opinionsRef, where('status', '==', key));
                const snap = await getCountFromServer(q);
                return { name: label, count: snap.data().count };
            })
        );
        return counts;
    } catch (error) {
        console.error('Error fetching content pipeline counts:', error);
        return CONTENT_STATUSES.map(({ label }) => ({ name: label, count: 0 }));
    }
};

export interface RevenueMetrics {
    mtdRevenue: number;
    activeSubs: number;
    adImpressions: number;
    adClicks: number;
    adRevenue: number;
    revenueTrend: { month: string; revenue: number }[];
    subscriptionMix: { name: string; count: number; color: string }[];
}

export const fetchRevenueMetrics = async (): Promise<RevenueMetrics> => {
    try {
        const { Timestamp } = await import('firebase/firestore');
        const subscribersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'subscribers');
        const impressionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adImpressions');
        const clicksRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'adClicks');

        const now = new Date();
        const startOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));

        const [subsSnap, impsSnap, clicksSnap] = await Promise.all([
            getDocs(query(subscribersRef, where('status', '==', 'active'))),
            getDocs(query(impressionsRef, where('timestamp', '>=', startOfMonth))),
            getDocs(query(clicksRef, where('timestamp', '>=', startOfMonth))),
        ]);

        const activeSubs = subsSnap.size;
        const adImpressions = impsSnap.size;
        const adClicks = clicksSnap.size;
        const adRevenue = adClicks * 0.5;
        const subRevenue = activeSubs * 7.99;
        const mtdRevenue = subRevenue + adRevenue;

        const { getAnalyticsSummary } = await import('./analyticsService');
        const summary = await getAnalyticsSummary(db);
        const revenueTrend = (summary.dailyTraffic || []).map((d) => ({
            month: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
            revenue: Math.round((d.adImpressions || d.views) * 0.01) + Math.round((d.views || 0) * 0.001),
        }));

        const subscriptionMix = activeSubs > 0
            ? [{ name: 'Active', count: activeSubs, color: '#10b981' }]
            : [{ name: 'No subscribers', count: 1, color: '#9ca3af' }];

        return { mtdRevenue, activeSubs, adImpressions, adClicks, adRevenue, revenueTrend, subscriptionMix };
    } catch (error) {
        console.error('Error fetching revenue metrics:', error);
        return {
            mtdRevenue: 0,
            activeSubs: 0,
            adImpressions: 0,
            adClicks: 0,
            adRevenue: 0,
            revenueTrend: [],
            subscriptionMix: [{ name: 'No data', count: 1, color: '#9ca3af' }],
        };
    }
};

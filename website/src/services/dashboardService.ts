import {
    collection,
    query,
    where,
    getCountFromServer
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

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    try {
        // We use getCountFromServer for performance on large collections
        const usersCount = await getCountFromServer(collection(db, 'users'));
        const subscribersCount = await getCountFromServer(query(collection(db, 'subscribers'), where('status', '==', 'active')));
        const staffCount = await getCountFromServer(collection(db, 'staff'));
        const publishedCount = await getCountFromServer(query(collection(db, 'opinions'), where('status', '==', 'published')));
        const pendingCount = await getCountFromServer(query(collection(db, 'opinions'), where('status', '==', 'pending_approval')));

        // Mock revenue for now until payment systems are fully integrated
        // In production, this would fetch from a 'revenue' collection or payment provider API
        const mockRevenue = 45230.50;
        const mockGrowth = 12.5;

        return {
            totalUsers: usersCount.data().count,
            activeStaff: staffCount.data().count,
            onlineStaff: 0, // Calculated client-side in widget
            publishedContent: publishedCount.data().count,
            pendingContent: pendingCount.data().count,
            totalSubscribers: subscribersCount.data().count,
            revenueMTD: mockRevenue,
            growthRate: mockGrowth
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

/**
 * Mock performance data for charts
 */
export const fetchTrendData = async (metric: string) => {
    // In a real app, this fetches from /analytics/daily
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

    if (metric === 'revenue') {
        return [
            { name: 'Jan', value: 12000 },
            { name: 'Feb', value: 18000 },
            { name: 'Mar', value: 15000 },
            { name: 'Apr', value: 22000 },
            { name: 'May', value: 31000 },
            { name: 'Jun', value: 38000 },
            { name: 'Jul', value: 45230 },
        ];
    }

    if (metric === 'users') {
        return [
            { name: 'Jan', value: 5000 },
            { name: 'Feb', value: 6200 },
            { name: 'Mar', value: 7800 },
            { name: 'Apr', value: 8900 },
            { name: 'May', value: 10500 },
            { name: 'Jun', value: 11800 },
            { name: 'Jul', value: 12847 },
        ];
    }

    if (metric === 'subscribers') {
        return [
            { name: 'Jan', value: 1200 },
            { name: 'Feb', value: 1450 },
            { name: 'Mar', value: 1680 },
            { name: 'Apr', value: 1920 },
            { name: 'May', value: 2100 },
            { name: 'Jun', value: 2350 },
            { name: 'Jul', value: 2580 },
        ];
    }

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

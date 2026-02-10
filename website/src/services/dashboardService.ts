import {
    collection,
    getDocs,
    query,
    where,
    limit,
    orderBy,
    getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';

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

    return [];
};

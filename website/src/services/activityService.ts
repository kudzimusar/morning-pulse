import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface ActivityLog {
    id?: string;
    timestamp: any;
    userId: string;
    userName: string;
    action: string;
    details: Record<string, any>;
    icon?: string;
}

/**
 * Log a new activity
 */
export const logActivity = async (activity: Omit<ActivityLog, 'timestamp'>) => {
    try {
        const activityRef = collection(db, 'auditLog'); // Using centralized auditLog
        await addDoc(activityRef, {
            ...activity,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.warn("Activity logging failed:", error);
    }
};

/**
 * Subscribe to the activity feed
 */
export const subscribeToActivity = (callback: (activities: ActivityLog[]) => void, limitCount: number = 20) => {
    const q = query(
        collection(db, 'auditLog'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ActivityLog[];
        callback(activities);
    });
};

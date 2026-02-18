import {
    collection,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { LiveEvent } from '../types';

const LIVE_EVENTS_COLLECTION = 'liveEvents';

/**
 * Subscribe to the currently active live event (if any)
 */
export const subscribeToActiveLiveEvent = (
    onUpdate: (event: LiveEvent | null) => void,
    onError: (error: Error) => void
): Unsubscribe => {
    try {
        const q = query(
            collection(db, LIVE_EVENTS_COLLECTION),
            where('isActive', '==', true),
            orderBy('startedAt', 'desc'),
            limit(1)
        );

        return onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                onUpdate(null);
                return;
            }
            const data = snapshot.docs[0].data();
            const event: LiveEvent = {
                id: snapshot.docs[0].id,
                ...data
            } as LiveEvent;
            onUpdate(event);
        }, (error) => {
            console.error('Error subscribing to live event:', error);
            onError(error);
        });
    } catch (error) {
        console.error('Error setting up live event subscription:', error);
        onError(error as Error);
        return () => { };
    }
};

/**
 * Get a live event by ID (once)
 */
export const getLiveEventById = async (id: string): Promise<LiveEvent | null> => {
    // Implementation...
    return null; // Placeholder
};

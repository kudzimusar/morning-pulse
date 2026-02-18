import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Firestore,
    Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { TopicHub, NewsStory, Opinion } from '../types';

// Constants
const TOPICS_COLLECTION = 'topics';
const NEWS_COLLECTION = 'news'; // Assuming root collection, or adjusted per your schema
const OPINIONS_PATH = 'artifacts/morning-pulse-app/public/data/opinions';

// Cache
let topicsCache: TopicHub[] = [];
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all active topics
 */
export const getAllTopics = async (): Promise<TopicHub[]> => {
    const now = Date.now();
    if (topicsCache.length > 0 && (now - lastFetch < CACHE_TTL)) {
        return topicsCache;
    }

    try {
        const q = query(
            collection(db, TOPICS_COLLECTION),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        );

        const snapshot = await getDocs(q);
        const topics = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TopicHub));

        topicsCache = topics;
        lastFetch = now;
        return topics;
    } catch (error) {
        console.error('Error fetching topics:', error);
        return [];
    }
};

/**
 * Get a specific topic by slug
 */
export const getTopicBySlug = async (slug: string): Promise<TopicHub | null> => {
    // Check cache first
    const cached = topicsCache.find(t => t.slug === slug);
    if (cached) return cached;

    try {
        const q = query(
            collection(db, TOPICS_COLLECTION),
            where('slug', '==', slug),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TopicHub;
    } catch (error) {
        console.error(`Error fetching topic ${slug}:`, error);
        return null;
    }
};

/**
 * Helper to fetch content for a topic
 * Combines manually featured articles with dynamic queries
 */
export const getTopicContent = async (topic: TopicHub): Promise<{
    featured: (NewsStory | Opinion)[];
    latest: (NewsStory | Opinion)[];
}> => {
    try {
        const contentByTag: (NewsStory | Opinion)[] = [];

        // 1. Fetch featured articles by ID (if any)
        const featured: (NewsStory | Opinion)[] = [];
        if (topic.featuredArticleIds && topic.featuredArticleIds.length > 0) {
            // In a real app, you'd batch fetch these. 
            // For now, let's assume we might need to query the news/opinions collections
            // This part is tricky if "news" are in a JSON file or mixed sources.
            // We will skip strict ID fetching for now and rely on category/tag queries
        }

        // 2. Query Opinions for this topic
        // Match by category or tag
        // Note: This requires appropriate indexes
        // We'll use a basic query on Opinions for now as they are in Firestore
        const opinionsRef = collection(db, OPINIONS_PATH);
        const q = query(
            opinionsRef,
            where('category', '==', topic.title), // Simplistic matching
            where('isPublished', '==', true),
            orderBy('publishedAt', 'desc'),
            limit(10)
        );

        const snapshot = await getDocs(q);
        const opinions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Opinion));

        // 3. We also need "News" (external stories).
        // Accessing `newsData` from App.tsx via a passed prop or context is better,
        // but here we are in a service.
        // We might need to fetch from `news` collection if we migrated.
        // For Phase 1/2, we might primarily rely on Opinions + curated News items in Firestore.

        return {
            featured: opinions.slice(0, 1), // Top story
            latest: opinions.slice(1)
        };
    } catch (error) {
        console.error('Error fetching topic content:', error);
        return { featured: [], latest: [] };
    }
};

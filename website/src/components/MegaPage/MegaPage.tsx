import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Opinion, NewsStory } from '../../types';
import { ZoneA } from './ZoneA';
import { ZoneB } from './ZoneB';
import { ZoneC } from './ZoneC';
import { Loader2 } from 'lucide-react';

interface MegaPageProps {
    onArticleClick: (id: string, slug?: string) => void;
    user?: any;
}

/**
 * MEGA-PAGE (Morning Pulse 2.0)
 * Main controller that fetches data and orchestrates the Zones.
 */
export const MegaPage: React.FC<MegaPageProps> = ({ onArticleClick, user }) => {
    const [loading, setLoading] = useState(true);

    // Data State
    const [heroStory, setHeroStory] = useState<Opinion | null>(null);
    const [zoneCArticles, setZoneCArticles] = useState<Opinion[]>([]);
    const [breakingNews, setBreakingNews] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');

                // 1. Fetch "Mega-Page Zone A" assignments specifically
                const heroQuery = query(
                    opinionsRef,
                    where('zoneAssignment', '==', 'A_Hero'),
                    where('status', '==', 'published'),
                    limit(1)
                );
                const heroSnap = await getDocs(heroQuery);

                if (!heroSnap.empty) {
                    setHeroStory({ id: heroSnap.docs[0].id, ...heroSnap.docs[0].data() } as Opinion);
                } else {
                    // Fallback: Get most recent published editorial if no manual assignment
                    const fallbackQuery = query(
                        opinionsRef,
                        where('status', '==', 'published'), // removed type check for broader fallback
                        orderBy('publishedAt', 'desc'),
                        limit(1)
                    );
                    const fallbackSnap = await getDocs(fallbackQuery);
                    if (!fallbackSnap.empty) {
                        setHeroStory({ id: fallbackSnap.docs[0].id, ...fallbackSnap.docs[0].data() } as Opinion);
                    }
                }

                // 2. Fetch General Content for Zone C (Deep Dive)
                // Exclude the hero ID if possible, but simplest is just fetch recent 20
                const feedQuery = query(
                    opinionsRef,
                    where('status', '==', 'published'),
                    orderBy('publishedAt', 'desc'),
                    limit(20)
                );
                const feedSnap = await getDocs(feedQuery);
                const feedDocs = feedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Opinion));

                // Filter out hero if it exists in feed
                const filteredFeed = heroSnap.empty ? feedDocs.slice(1) : feedDocs.filter(d => d.id !== heroSnap.docs[0]?.id);

                setZoneCArticles(filteredFeed);

                // Mock Breaking News (could come from 'live_events' collection)
                setBreakingNews([
                    "Tech Sector Rallies on AI Chips Earnings",
                    "Global Climate Summit Reaches Tentative Agreement",
                    "Morning Pulse Launches New 2.0 Design"
                ]);

            } catch (error) {
                console.error("MegaPage Data Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={32} color="#000" />
            </div>
        );
    }

    return (
        <main style={{ paddingBottom: '80px' }}>
            {/* ZONE A: HERO */}
            <ZoneA
                heroStory={heroStory || undefined}
                onArticleClick={onArticleClick}
            />

            {/* ZONE B: BREAKING */}
            <ZoneB
                breakingNews={breakingNews}
                liveEventActive={false} // Hook up to real live coverage later
            />

            {/* ZONE C: DEEP DIVE */}
            <ZoneC
                articles={zoneCArticles}
                onArticleClick={onArticleClick}
            />
        </main>
    );
};

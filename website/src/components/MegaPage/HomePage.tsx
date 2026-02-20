import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { NewsStory, Opinion } from '../../types';
import ZoneA from './ZoneA';
import LoadingSkeleton from '../LoadingSkeleton';
import '../../styles/megapage.css';

const MegaHomePage: React.FC = () => {
    const [news, setNews] = useState<NewsStory[]>([]);
    const [opinions, setOpinions] = useState<Opinion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEditorialData = async () => {
            try {
                // 1. Fetch Latest News
                const newsQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(10));
                const newsSnap = await getDocs(newsQuery);
                const fetchedNews = newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsStory));

                // 2. Fetch Latest Opinions
                const opinionsQuery = query(collection(db, 'opinions'), orderBy('createdAt', 'desc'), limit(4));
                const opinionsSnap = await getDocs(opinionsQuery);
                const fetchedOpinions = opinionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opinion));

                setNews(fetchedNews);
                setOpinions(fetchedOpinions);
            } catch (error) {
                console.error("Error fetching homepage data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEditorialData();
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (!news.length) return <div className="p-8 text-center">No news available.</div>;

    // --- THE TRAFFIC CONTROLLER LOGIC ---
    // Algorithmic assignment based on position in array
    const heroArticle = news[0];
    const leftRailArticles = news.slice(1, 5); // Items 2-5 for Left Rail

    return (
        <div className="max-w-[1200px] mx-auto px-4 mt-8">

            {/* ZONE A: The NYT 1-2-1 Editorial Grid */}
            <ZoneA
                hero={heroArticle}
                leftRail={leftRailArticles}
                rightRail={opinions}
            />

            {/* Future Zones (Multimedia, Deep Dive) go here */}

        </div>
    );
};

export default MegaHomePage;

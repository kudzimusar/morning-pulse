import React, { useEffect, useState } from 'react';
import { TopicHub, Opinion, NewsStory } from '../types';
import { getTopicBySlug, getTopicContent } from '../services/topicsService';
import ArticleCard from './ArticleCard';
import LoadingSkeleton from './LoadingSkeleton';

interface TopicPageProps {
    slug: string;
}

const TopicPage: React.FC<TopicPageProps> = ({ slug }) => {
    const [topic, setTopic] = useState<TopicHub | null>(null);
    const [content, setContent] = useState<{ featured: (NewsStory | Opinion)[]; latest: (NewsStory | Opinion)[] }>({ featured: [], latest: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadTopic = async () => {
            setLoading(true);
            setError(null);
            try {
                const topicData = await getTopicBySlug(slug);
                if (!topicData) {
                    if (isMounted) setError('Topic not found');
                    return;
                }

                if (isMounted) setTopic(topicData);

                const contentData = await getTopicContent(topicData);
                if (isMounted) setContent(contentData);

            } catch (err) {
                if (isMounted) setError('Failed to load topic');
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadTopic();

        return () => { isMounted = false; };
    }, [slug]);

    if (loading) return <LoadingSkeleton />;
    if (error || !topic) return <div className="error-message">{error || 'Topic not found'}</div>;

    return (
        <div className="topic-page">
            {/* Header */}
            <div className="topic-header" style={{
                padding: '40px 20px',
                backgroundColor: '#f3f4f6',
                marginBottom: '32px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    marginBottom: '12px'
                }}>
                    {topic.title}
                </h1>
                <p style={{
                    fontSize: '1.2rem',
                    color: '#4b5563',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    {topic.description}
                </p>
            </div>

            <div className="topic-content container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Featured Story */}
                {content.featured.length > 0 && (
                    <section className="featured-section" style={{ marginBottom: '60px' }}>
                        {/* We cast to fit ArticleCard props - standardizing might be needed */}
                        {/* For now, we assume standard NewsStory shape or map it */}
                        {content.featured.map((item: any) => (
                            <ArticleCard
                                key={item.id}
                                article={{
                                    ...item,
                                    category: topic.title, // Override category for visuals
                                    source: item.authorName || item.source || 'Morning Pulse'
                                }}
                                variant="grid"
                                isEditorial={true} // Assuming predominantly internal content for Hubs
                                opinionSlug={item.slug}
                            />
                        ))}
                    </section>
                )}

                {/* Latest Stories Grid */}
                <section className="latest-section">
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        borderBottom: '2px solid #000',
                        paddingBottom: '12px',
                        marginBottom: '24px'
                    }}>
                        Latest in {topic.title}
                    </h3>
                    <div className="news-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
                        {content.latest.map((item: any) => (
                            <ArticleCard
                                key={item.id}
                                article={{
                                    ...item,
                                    category: topic.title,
                                    source: item.authorName || item.source || 'Morning Pulse'
                                }}
                                variant="grid"
                                isEditorial={true}
                                opinionSlug={item.slug}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TopicPage;

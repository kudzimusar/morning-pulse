import React, { useState, useEffect } from 'react';
import { NewsStory } from '../types';
import ArticleCard from './ArticleCard';
import { Bookmark, ArrowLeft } from 'lucide-react';

interface SavedArticlesPageProps {
    allNews: NewsStory[];
    onBack?: () => void;
}

const SavedArticlesPage: React.FC<SavedArticlesPageProps> = ({ allNews, onBack }) => {
    const [savedArticles, setSavedArticles] = useState<NewsStory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSavedArticles = () => {
            const savedIds = JSON.parse(localStorage.getItem('savedArticles') || '[]');
            // Filter news to find saved ones
            // Note: In a real app with pagination, we'd need to fetch these by ID from the backend
            // if they aren't in the current 'allNews' slice.
            const found = allNews.filter(story => savedIds.includes(story.id));
            setSavedArticles(found);
            setLoading(false);
        };

        loadSavedArticles();

        // Listen for updates in case user unsaves from within the list
        const handleUpdate = () => loadSavedArticles();
        window.addEventListener('savedArticlesUpdated', handleUpdate);

        return () => {
            window.removeEventListener('savedArticlesUpdated', handleUpdate);
        };
    }, [allNews]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            window.location.hash = '';
        }
    };

    return (
        <div className="saved-articles-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '32px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '16px'
            }}>
                <button
                    onClick={handleBack}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginRight: '16px',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <ArrowLeft size={24} color="#374151" />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        backgroundColor: '#e0e7ff',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex'
                    }}>
                        <Bookmark size={24} color="#4f46e5" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>Saved Articles</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                            {savedArticles.length} stories saved for later
                        </p>
                    </div>
                </div>
            </header>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading saved stories...</div>
            ) : savedArticles.length > 0 ? (
                <div className="news-grid-container" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {savedArticles.map(article => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '16px',
                    border: '1px dashed #d1d5db'
                }}>
                    <Bookmark size={48} color="#9ca3af" style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No saved articles yet</h3>
                    <p style={{ margin: 0, color: '#6b7280', maxWidth: '400px', marginInline: 'auto' }}>
                        Tap the bookmark icon on any story to save it here for later reading.
                    </p>
                    <button
                        onClick={handleBack}
                        style={{
                            marginTop: '24px',
                            padding: '10px 20px',
                            backgroundColor: '#111827',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Browse News
                    </button>
                </div>
            )}
        </div>
    );
};

export default SavedArticlesPage;

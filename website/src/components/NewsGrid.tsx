import React, { useMemo, useState, useEffect } from 'react';
import { NewsStory, Opinion } from '../../types';
import HeroCard from './HeroCard';
import ArticleCard from './ArticleCard';
import AdSlot from './AdSlot';
import { CountryInfo } from '../services/locationService';
import { subscribeToPublishedOpinions } from '../services/opinionsService';

/* Category mapping for 3-zone layout */
const HERO_CATEGORIES = ['Zimbabwe', 'Local (Zim)', 'Politics', 'World'];
const TEXT_CATEGORIES = ['Politics', 'Crime & Justice', 'Education'];
const FEATURE_CATEGORIES = ['Zimbabwe', 'Local (Zim)', 'Opinion/Editorial', 'Finance & Economy'];
const IMAGE_CATEGORIES = ['Sports', 'Entertainment', 'Lifestyle', 'Health'];

interface NewsGridProps {
  newsData: {
    [category: string]: NewsStory[];
  };
  selectedCategory?: string | null;
  userCountry?: CountryInfo;
}

const editorialToNewsStory = (op: Opinion): NewsStory => ({
  id: op.id,
  headline: op.headline || op.title,
  detail: op.subHeadline || (op.body?.substring(0, 150) + '...') || '',
  category: 'Editorial',
  source: op.authorName || 'Editorial Team',
  timestamp: op.publishedAt?.getTime() || op.submittedAt?.getTime() || Date.now(),
  imageUrl: op.finalImageUrl || op.suggestedImageUrl || op.imageUrl,
  url: '',
  fetchedAt: '',
  date: '',
});

const getSlug = (op: Opinion): string =>
  op.slug || (op.headline
    ? op.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100)
    : op.id);

const NewsGrid: React.FC<NewsGridProps> = ({ newsData, selectedCategory, userCountry }) => {
  const [editorials, setEditorials] = useState<Opinion[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  useEffect(() => {
    const unsub = subscribeToPublishedOpinions(
      (fetched) => {
        const editorialArticles = fetched.filter(
          op => op.type === 'editorial' && op.isPublished === true
        );
        const sorted = editorialArticles.sort((a, b) => {
          const dateA = a.publishedAt?.getTime() || a.submittedAt.getTime();
          const dateB = b.publishedAt?.getTime() || b.submittedAt.getTime();
          return dateB - dateA;
        });
        setEditorials(sorted.slice(0, 3));
      },
      (err) => console.error("Editorial fetch error:", err)
    );
    return () => { if (unsub) unsub(); };
  }, []);

  const preferredOrder = [
    'Zimbabwe', 'Politics', 'Finance & Economy', 'Technology', 'Science',
    'Health', 'Sports', 'Entertainment', 'Crime & Justice', 'Education',
    'Lifestyle', 'Opinion/Editorial', 'World',
    'Local (Zim)', 'Business (Zim)', 'African Focus', 'Global', 'Tech', 'General News'
  ];

  const availableCategories = Object.keys(newsData);
  const categoryOrder = useMemo(() =>
    [...availableCategories].sort((a, b) => {
      const iA = preferredOrder.indexOf(a);
      const iB = preferredOrder.indexOf(b);
      if (iA !== -1 && iB !== -1) return iA - iB;
      if (iA !== -1) return -1;
      if (iB !== -1) return 1;
      return a.localeCompare(b);
    }),
    [availableCategories]
  );

  const allArticles = useMemo(() => {
    const articles: NewsStory[] = [];
    Object.values(newsData).forEach(arr => articles.push(...arr));
    return articles.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [newsData]);

  const heroArticle = useMemo(() => {
    if (selectedCategory) {
      const arr = newsData[selectedCategory] || [];
      return arr.length > 0 ? arr[0] : null;
    }
    for (const cat of HERO_CATEGORIES) {
      const arr = newsData[cat];
      if (arr?.length) return arr[0];
    }
    if (categoryOrder.length) {
      const arr = newsData[categoryOrder[0]];
      if (arr?.length) return arr[0];
    }
    return allArticles[0] || null;
  }, [newsData, selectedCategory, categoryOrder, allArticles]);

  const gridArticles = useMemo(() => {
    let articles: NewsStory[] = [];
    if (selectedCategory) {
      const arr = newsData[selectedCategory] || [];
      articles = arr.filter(a => a.id !== heroArticle?.id);
    } else {
      categoryOrder.forEach(cat => {
        (newsData[cat] || []).forEach(a => articles.push(a));
      });
      if (heroArticle) articles = articles.filter(a => a.id !== heroArticle.id);
    }
    return articles.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [newsData, selectedCategory, heroArticle, categoryOrder]);

  useEffect(() => { setVisibleCount(10); }, [selectedCategory, userCountry]);

  const topHeadlines = useMemo(() => allArticles.slice(0, 5).map(a => a.headline), [allArticles]);

  /* Zone 2: Split by category */
  const zone2Left = useMemo(() =>
    gridArticles.filter(a => TEXT_CATEGORIES.some(c => a.category?.includes(c) || a.category === c)).slice(0, 3),
    [gridArticles]
  );
  const zone2Center = useMemo(() => {
    const feature = gridArticles.find(a =>
      FEATURE_CATEGORIES.some(c => a.category?.includes(c) || a.category === c)
    );
    return feature ? [feature] : gridArticles.slice(0, 1);
  }, [gridArticles]);
  const zone2Right = useMemo(() =>
    gridArticles.filter(a => IMAGE_CATEGORIES.some(c => a.category?.includes(c) || a.category === c)).slice(0, 3),
    [gridArticles]
  );

  const usedIds = useMemo(() => {
    const ids = new Set<string>();
    zone2Left.forEach(a => ids.add(a.id));
    zone2Center.forEach(a => ids.add(a.id));
    zone2Right.forEach(a => ids.add(a.id));
    return ids;
  }, [zone2Left, zone2Center, zone2Right]);

  const zone3Articles = useMemo(() =>
    gridArticles.filter(a => !usedIds.has(a.id)).slice(0, 8),
    [gridArticles, usedIds]
  );

  const zone1SideItems = useMemo(() => {
    if (editorials.length >= 2) {
      return editorials.slice(0, 2).map(op => ({ type: 'editorial' as const, op }));
    }
    return gridArticles.slice(0, 2).map(a => ({ type: 'news' as const, article: a }));
  }, [editorials, gridArticles]);

  if (Object.keys(newsData).length === 0) return null;

  return (
    <main className="home-layout news-grid mobile-content-with-nav">
      {/* Zone 1: Hero Row */}
      <section className="home-zone-1 desktop-only">
        {heroArticle && (
          <div className="zone-1-hero">
            <HeroCard article={heroArticle} userCountry={userCountry} />
          </div>
        )}
        {zone1SideItems.map((item, i) => (
          <div key={item.type === 'editorial' ? item.op.id : item.article.id} className="zone-1-side">
            {item.type === 'editorial' ? (
              <ArticleCard
                article={editorialToNewsStory(item.op)}
                variant="feature"
                userCountry={userCountry}
                opinionSlug={getSlug(item.op)}
                isEditorial
              />
            ) : (
              <ArticleCard article={item.article} variant="feature" userCountry={userCountry} />
            )}
          </div>
        ))}
      </section>

      {/* Mobile: Stack hero + side cards */}
      <section className="mobile-only" style={{ marginBottom: 24 }}>
        {heroArticle && (
          <div style={{ marginBottom: 24 }}>
            <HeroCard article={heroArticle} userCountry={userCountry} />
          </div>
        )}
        {zone1SideItems.slice(0, 2).map((item) => (
          <div key={item.type === 'editorial' ? item.op.id : item.article.id} style={{ marginBottom: 16 }}>
            {item.type === 'editorial' ? (
              <ArticleCard
                article={editorialToNewsStory(item.op)}
                variant="compact"
                userCountry={userCountry}
                opinionSlug={getSlug(item.op)}
                isEditorial
              />
            ) : (
              <ArticleCard article={item.article} variant="compact" userCountry={userCountry} />
            )}
          </div>
        ))}
      </section>

      {/* Ad: Inline */}
      <div className="home-ad-inline">
        <AdSlot slotId="homepage_sidebar_1" userCountry={userCountry} />
      </div>

      {/* Zone 2: Main 3-Column */}
      <section className="home-zone-2 desktop-only">
        <div className="zone-2-left">
          <div className="home-section-header">
            <h3 className="home-section-title">The Wire</h3>
          </div>
          {zone2Left.map((article, i) => (
            <ArticleCard key={`${article.id}-${i}`} article={article} variant="text" userCountry={userCountry} />
          ))}
        </div>
        <div className="zone-2-center">
          <div className="home-section-header">
            <h3 className="home-section-title">Featured</h3>
            <a href="#opinion" className="home-section-link">View All →</a>
          </div>
          {zone2Center.map((article, i) => (
            <ArticleCard key={`${article.id}-${i}`} article={article} variant="feature" userCountry={userCountry} />
          ))}
        </div>
        <div className="zone-2-right">
          <div className="home-section-header">
            <h3 className="home-section-title">Latest</h3>
          </div>
          {zone2Right.map((article, i) => (
            <ArticleCard key={`${article.id}-${i}`} article={article} variant="grid" userCountry={userCountry} />
          ))}
        </div>
      </section>

      {/* Zone 3: Bottom Strip */}
      <section className="home-zone-3 desktop-only">
        {zone3Articles.map((article, i) => (
          <ArticleCard key={`${article.id}-${i}`} article={article} variant="compact" userCountry={userCountry} />
        ))}
      </section>

      {/* Mobile: Card stack with Load More */}
      <div className="mobile-card-stack mobile-only">
        {gridArticles.slice(0, visibleCount).map((article, i) => (
          <ArticleCard
            key={`${userCountry || 'default'}-${article.id}-${i}`}
            article={article}
            variant="compact"
            userCountry={userCountry}
          />
        ))}
        {visibleCount < gridArticles.length && (
          <button
            onClick={() => setVisibleCount(p => p + 6)}
            className="mobile-load-more-button"
            style={{
              width: '100%', padding: 16, marginTop: 16, background: 'transparent',
              border: '1px solid #e0e0e0', borderRadius: 8, fontSize: '1rem',
              fontWeight: 600, color: '#1a1a1a', cursor: 'pointer',
            }}
          >
            View More Stories ({gridArticles.length - visibleCount} remaining) →
          </button>
        )}
      </div>
    </main>
  );
};

export default NewsGrid;

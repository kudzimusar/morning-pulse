import React, { useMemo } from 'react';
import { NewsStory } from '../../../types';
import HeroCard from './HeroCard';
import ArticleCard from './ArticleCard';
import AdSlot from './AdSlot';

interface NewsGridProps {
  newsData: {
    [category: string]: NewsStory[];
  };
  selectedCategory?: string | null;
  userCountry?: string; // Country name for dynamic Local category
}

const NewsGrid: React.FC<NewsGridProps> = ({ newsData, selectedCategory, userCountry }) => {
  // Define category order for display - Local category will be dynamic
  const baseCategoryOrder = [
    'Local', // Will be replaced with actual Local category name
    'Business (Zim)',
    'African Focus',
    'Global',
    'Sports',
    'Tech',
    'General News'
  ];
  
  // Get the actual Local category name from newsData
  const localCategoryKey = Object.keys(newsData).find(key => 
    key.startsWith('Local')
  ) || 'Local (Zim)';
  
  const categoryOrder = baseCategoryOrder.map(cat => 
    cat === 'Local' ? localCategoryKey : cat
  );

  // Get all articles, sorted by timestamp (most recent first)
  const allArticles = useMemo(() => {
    const articles: NewsStory[] = [];
    Object.values(newsData).forEach(categoryArticles => {
      articles.push(...categoryArticles);
    });
    // Sort by timestamp (most recent first)
    return articles.sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });
  }, [newsData]);

  // Get hero article (top story from Local category or first article)
  const heroArticle = useMemo(() => {
    if (selectedCategory) {
      // If a category is selected, use first article from that category
      const categoryArticles = newsData[selectedCategory] || [];
      return categoryArticles.length > 0 ? categoryArticles[0] : null;
    }
    // Otherwise, use top story from Local category (dynamic)
    const localCategoryKey = Object.keys(newsData).find(key => 
      key.startsWith('Local')
    ) || 'Local (Zim)';
    const localArticles = newsData[localCategoryKey] || [];
    if (localArticles.length > 0) {
      return localArticles[0];
    }
    // Fallback to first article overall
    return allArticles.length > 0 ? allArticles[0] : null;
  }, [newsData, selectedCategory, allArticles]);

  // Get grid articles (excluding hero article)
  const gridArticles = useMemo(() => {
    let articles: NewsStory[] = [];
    
    if (selectedCategory) {
      // Filter by selected category, exclude hero
      const categoryArticles = newsData[selectedCategory] || [];
      articles = categoryArticles.filter(article => article.id !== heroArticle?.id);
    } else {
      // Get articles from all categories except the hero's category
      categoryOrder.forEach(category => {
        const categoryArticles = newsData[category] || [];
        const heroCategory = heroArticle?.category || '';
        if (category !== heroCategory) {
          articles.push(...categoryArticles);
        } else {
          // Include all but the first (hero) from this category
          articles.push(...categoryArticles.slice(1));
        }
      });
    }

    // Sort by timestamp (most recent first)
    return articles.sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });
  }, [newsData, selectedCategory, heroArticle, categoryOrder]);

  // Get top headlines for ticker
  const topHeadlines = useMemo(() => {
    return allArticles.slice(0, 5).map(article => article.headline);
  }, [allArticles]);

  if (Object.keys(newsData).length === 0) {
    return null;
  }

  return (
    <main className="premium-news-grid">
      {/* Hero Section */}
      {heroArticle && (
        <section className="hero-section">
          <HeroCard article={heroArticle} />
        </section>
      )}

      {/* Advertising Slot */}
      <AdSlot />

      {/* Grid Section */}
      <section className="news-grid-section">
        {selectedCategory && (
          <div className="section-header">
            <h2 className="section-title">{selectedCategory}</h2>
          </div>
        )}
        <div className="news-grid-container">
          {gridArticles.map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              variant="grid"
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default NewsGrid;

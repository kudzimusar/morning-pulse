import React from 'react';
import { NewsStory } from '../../../types';
import NewsSection from './NewsSection';

interface NewsGridProps {
  newsData: {
    [category: string]: NewsStory[];
  };
}

const NewsGrid: React.FC<NewsGridProps> = ({ newsData }) => {
  // Define category order for display
  const categoryOrder = [
    'Local (Zim)',
    'Business (Zim)',
    'African Focus',
    'Global',
    'Sports',
    'Tech',
    'General News'
  ];

  // Sort categories by predefined order, then add any others
  const sortedCategories = [
    ...categoryOrder.filter(cat => newsData[cat]),
    ...Object.keys(newsData).filter(cat => !categoryOrder.includes(cat))
  ];

  return (
    <main className="news-grid">
      {sortedCategories.map((category) => (
        <NewsSection
          key={category}
          category={category}
          articles={newsData[category]}
        />
      ))}
    </main>
  );
};

export default NewsGrid;


import React from 'react';
import { NewsStory } from '../../../types';
import ArticleCard from './ArticleCard';

interface NewsSectionProps {
  category: string;
  articles: NewsStory[];
}

const NewsSection: React.FC<NewsSectionProps> = ({ category, articles }) => {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="news-section">
      <h2 className="section-title" data-category={category}>{category}</h2>
      <div className="articles-container">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

export default NewsSection;


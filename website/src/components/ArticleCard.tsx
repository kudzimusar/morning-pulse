import React from 'react';
import { NewsStory } from '../../../types';

interface ArticleCardProps {
  article: NewsStory;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const handleClick = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article 
      className={`article-card ${article.url ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      <h3 className="article-headline">{article.headline}</h3>
      <p className="article-detail">{article.detail}</p>
      <div className="article-footer">
        <span className="article-source">{article.source}</span>
        {article.url && (
          <span className="article-link">Read more →</span>
        )}
      </div>
    </article>
  );
};

export default ArticleCard;


import React from 'react';
import { NewsStory } from '../../types';

interface ArticleFooterProps {
  article: NewsStory;
  relatedArticles?: NewsStory[];
  authorBio?: string;
}

const ArticleFooter: React.FC<ArticleFooterProps> = ({
  article,
  relatedArticles = [],
  authorBio,
}) => {
  return (
    <footer className="mobile-article-footer">
      {/* Author Bio */}
      {authorBio && (
        <div className="mobile-article-author-bio">
          <div className="mobile-article-author-name">
            {article.source || 'Editorial Team'}
          </div>
          <div className="mobile-article-author-bio-text">
            {authorBio}
          </div>
        </div>
      )}
      
      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mobile-article-related">
          <div className="mobile-article-related-title">
            Continue Reading
          </div>
          {relatedArticles.slice(0, 3).map((related) => (
            <a
              key={related.id}
              href={related.url || '#'}
              className="mobile-article-related-link"
              onClick={(e) => {
                if (related.url) {
                  e.preventDefault();
                  window.open(related.url, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {related.headline}
            </a>
          ))}
        </div>
      )}
    </footer>
  );
};

export default ArticleFooter;

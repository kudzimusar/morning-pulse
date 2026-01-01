import React from 'react';
import { Opinion } from '../../../types';

interface OpinionCardProps {
  opinion: Opinion;
  onClick?: () => void;
}

const OpinionCard: React.FC<OpinionCardProps> = ({ opinion, onClick }) => {
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins > 0 ? `${diffMins}m ago` : 'Just now';
    }
  };

  const timeAgo = formatTimeAgo(opinion.publishedAt || opinion.submittedAt);

  return (
    <div 
      className="opinion-card"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="opinion-card-content">
        <p className="opinion-tag">
          {opinion.writerType || 'Guest Essay'}
        </p>
        <h2 className="opinion-headline">
          {opinion.headline}
        </h2>
        <p className="opinion-subheadline">
          {opinion.subHeadline}
        </p>
        <div className="opinion-byline">
          <span className="opinion-author">
            By {opinion.authorName}
            {opinion.authorTitle && `, ${opinion.authorTitle}`}
          </span>
          {timeAgo && (
            <>
              <span className="opinion-separator">•</span>
              <span className="opinion-time">{timeAgo}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpinionCard;

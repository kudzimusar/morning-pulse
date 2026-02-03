import React from 'react';

interface MobileSkeletonProps {
  variant?: 'article' | 'list' | 'hero';
  count?: number;
}

const MobileSkeleton: React.FC<MobileSkeletonProps> = ({
  variant = 'article',
  count = 1,
}) => {
  if (variant === 'hero') {
    return (
      <div className="mobile-skeleton-container">
        <div className="mobile-skeleton-image mobile-skeleton" />
        <div className="mobile-skeleton-headline mobile-skeleton" />
        <div className="mobile-skeleton-text mobile-skeleton" />
        <div className="mobile-skeleton-text mobile-skeleton" />
        <div className="mobile-skeleton-text mobile-skeleton" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="mobile-skeleton-container">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} style={{ marginBottom: '24px' }}>
            <div className="mobile-skeleton-image mobile-skeleton" />
            <div className="mobile-skeleton-headline mobile-skeleton" />
            <div className="mobile-skeleton-text mobile-skeleton" />
            <div className="mobile-skeleton-text mobile-skeleton" />
          </div>
        ))}
      </div>
    );
  }

  // Default: article variant
  return (
    <div className="mobile-skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ marginBottom: '16px' }}>
          <div className="mobile-skeleton-image mobile-skeleton" />
          <div className="mobile-skeleton-headline mobile-skeleton" />
          <div className="mobile-skeleton-text mobile-skeleton" />
          <div className="mobile-skeleton-text mobile-skeleton" />
          <div className="mobile-skeleton-text mobile-skeleton" />
        </div>
      ))}
    </div>
  );
};

export default MobileSkeleton;

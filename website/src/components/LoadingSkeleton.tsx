import React from 'react';

/**
 * LoadingSkeleton Component
 * Displays skeleton loaders while content is being fetched
 */

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="loading-skeleton">
      {/* Hero skeleton */}
      <div className="skeleton-hero">
        <div className="skeleton-image" style={{
          width: '100%',
          height: '400px',
          backgroundColor: '#e0e0e0',
          borderRadius: '8px',
          marginBottom: '16px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
        <div className="skeleton-text" style={{
          width: '80%',
          height: '32px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '12px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
        <div className="skeleton-text" style={{
          width: '60%',
          height: '20px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '8px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </div>

      {/* Grid skeletons */}
      <div className="skeleton-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        marginTop: '32px'
      }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-image" style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#e0e0e0',
              borderRadius: '8px',
              marginBottom: '12px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }} />
            <div className="skeleton-text" style={{
              width: '90%',
              height: '24px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              marginBottom: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }} />
            <div className="skeleton-text" style={{
              width: '70%',
              height: '16px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;

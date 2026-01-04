import React from 'react';
import OpinionFeed from './OpinionFeed';

interface OpinionPageProps {
  onBack?: () => void;
  onNavigateToSubmit?: () => void;
}

const OpinionPage: React.FC<OpinionPageProps> = ({ onBack, onNavigateToSubmit }) => {
  return (
    <div className="opinion-page">
      <div className="opinion-page-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #e7e5e4',
        backgroundColor: '#fffdfa'
      }}>
        {onBack && (
          <button 
            onClick={onBack} 
            className="back-button"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'Georgia, serif',
              color: '#44403c',
              padding: '8px 0'
            }}
          >
            ← Back to News
          </button>
        )}
        <h1 className="opinion-page-title" style={{
          fontSize: '14px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          OPINION
        </h1>
        {onNavigateToSubmit && (
          <a 
            href="#opinion/submit" 
            onClick={(e) => {
              e.preventDefault();
              onNavigateToSubmit();
            }}
            className="opinion-submit-link"
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#dc2626',
              textDecoration: 'none',
              padding: '8px 16px',
              border: '1px solid #dc2626',
              borderRadius: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            Submit a Guest Essay
          </a>
        )}
      </div>
      <div className="opinion-page-content">
        <OpinionFeed />
      </div>
    </div>
  );
};

export default OpinionPage;

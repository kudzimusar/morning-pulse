import React, { useState } from 'react';
import OpinionFeed from './OpinionFeed';
import { Opinion } from '../../../types';

interface OpinionPageProps {
  onBack?: () => void;
  onNavigateToSubmit?: () => void;
}

const OpinionPage: React.FC<OpinionPageProps> = ({ onBack, onNavigateToSubmit }) => {
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);

  const handleOpinionClick = (opinion: Opinion) => {
    setSelectedOpinion(opinion);
  };

  const handleBackToList = () => {
    setSelectedOpinion(null);
  };

  if (selectedOpinion) {
    return (
      <div className="opinion-page">
        <div className="opinion-page-header">
          {onBack && (
            <button onClick={onBack} className="back-button">
              ← Back to News
            </button>
          )}
          <button onClick={handleBackToList} className="back-button">
            ← Back to Opinions
          </button>
        </div>
        <div className="opinion-detail-page">
          <div className="opinion-detail-content">
            <p className="opinion-tag">{selectedOpinion.writerType || 'Guest Essay'}</p>
            <h1 className="opinion-detail-headline">{selectedOpinion.headline}</h1>
            <p className="opinion-detail-subheadline">{selectedOpinion.subHeadline}</p>
            <div className="opinion-detail-byline">
              <span className="opinion-author">
                By {selectedOpinion.authorName}
                {selectedOpinion.authorTitle && `, ${selectedOpinion.authorTitle}`}
              </span>
            </div>
            <div 
              className="opinion-detail-body"
              dangerouslySetInnerHTML={{ __html: selectedOpinion.body }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="opinion-page">
      <div className="opinion-page-header">
        {onBack && (
          <button onClick={onBack} className="back-button">
            ← Back to News
          </button>
        )}
        <h1 className="opinion-page-title">OPINION</h1>
        {onNavigateToSubmit && (
          <a 
            href="#opinion/submit" 
            onClick={(e) => {
              e.preventDefault();
              onNavigateToSubmit();
            }}
            className="opinion-submit-link"
          >
            Submit a Guest Essay
          </a>
        )}
      </div>
      <div className="opinion-page-content">
        <OpinionFeed onOpinionClick={handleOpinionClick} />
      </div>
    </div>
  );
};

export default OpinionPage;

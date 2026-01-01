import React, { useEffect, useState } from 'react';
import { Opinion } from '../../../types';
import { subscribeToPublishedOpinions } from '../services/opinionsService';
import OpinionCard from './OpinionCard';

interface OpinionFeedProps {
  onOpinionClick?: (opinion: Opinion) => void;
}

const OpinionFeed: React.FC<OpinionFeedProps> = ({ onOpinionClick }) => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPublishedOpinions((fetchedOpinions) => {
      setOpinions(fetchedOpinions);
      setLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="opinion-feed-loading">
        <div className="loading-spinner"></div>
        <p>Loading opinions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="opinion-feed-error">
        <p>{error}</p>
      </div>
    );
  }

  if (opinions.length === 0) {
    return (
      <div className="opinion-feed-empty">
        <p>No published opinions yet. Check back soon for guest essays and editorials.</p>
      </div>
    );
  }

  return (
    <div className="opinion-feed">
      {opinions.map((opinion) => (
        <OpinionCard
          key={opinion.id}
          opinion={opinion}
          onClick={onOpinionClick ? () => onOpinionClick(opinion) : undefined}
        />
      ))}
    </div>
  );
};

export default OpinionFeed;

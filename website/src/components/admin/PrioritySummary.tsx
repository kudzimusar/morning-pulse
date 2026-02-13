/**
 * Priority Summary Component
 * Shows what must be done first - the first thing editors see
 */

import React from 'react';
import { Opinion } from '../../../types';

interface PrioritySummaryProps {
  pendingCount: number;
  imageIssuesCount: number;
  scheduledCount: number;
  recentlyPublishedCount: number;
  onNavigate: (tab: string) => void;
}

const PrioritySummary: React.FC<PrioritySummaryProps> = ({
  pendingCount,
  imageIssuesCount,
  scheduledCount,
  recentlyPublishedCount,
  onNavigate,
}) => {
  const priorities = [
    {
      id: 'pending',
      label: 'Pending Approval',
      count: pendingCount,
      color: '#ef4444',
      icon: '🔴',
      description: 'Blocking publication',
      onClick: () => onNavigate('editorial-queue'),
    },
    {
      id: 'images',
      label: 'Image Issues',
      count: imageIssuesCount,
      color: '#f97316',
      icon: '🟠',
      description: 'Awaiting image replacement',
      onClick: () => onNavigate('image-compliance'),
    },
    {
      id: 'scheduled',
      label: 'Scheduled Today',
      count: scheduledCount,
      color: '#eab308',
      icon: '🟡',
      description: 'Ready to publish',
      onClick: () => onNavigate('editorial-queue'),
    },
    {
      id: 'published',
      label: 'Recently Published',
      count: recentlyPublishedCount,
      color: '#10b981',
      icon: '🟢',
      description: 'Last 24 hours',
      onClick: () => onNavigate('published-content'),
    },
  ];

  return (
    <div className="admin-card" style={{
      marginBottom: 0,
      backgroundColor: '#f9fafb'
    }}>
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '20px',
        fontWeight: '600',
        color: '#111827'
      }}>
        Priority Summary
      </h2>
      
      <div className="priority-summary-grid">
        {priorities.map((priority) => (
          <div
            key={priority.id}
            onClick={priority.onClick}
            className="priority-summary-card"
            style={{
              backgroundColor: 'white',
              border: `2px solid ${priority.color}`,
              borderRadius: '6px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: priority.count > 0 ? `0 2px 4px rgba(0,0,0,0.1)` : 'none'
            }}
            onMouseEnter={(e) => {
              if (priority.count > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 8px rgba(0,0,0,0.15)`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = priority.count > 0 ? `0 2px 4px rgba(0,0,0,0.1)` : 'none';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              minWidth: 0
            }}>
              <span style={{ fontSize: '24px', marginRight: '8px', flexShrink: 0 }}>
                {priority.icon}
              </span>
              <span className="priority-label" style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827'
              }}>
                {priority.label}
              </span>
            </div>
            
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: priority.color,
              marginBottom: '4px'
            }}>
              {priority.count}
            </div>
            
            <div className="priority-description" style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {priority.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrioritySummary;

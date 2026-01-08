/**
 * Image Preview Component
 * Shows current image vs new suggested image for comparison
 * Used in Editorial Queue for image replacement workflow
 */

import React from 'react';

interface ImagePreviewProps {
  currentImageUrl: string | null;
  newImageUrl: string | null;
  currentImageLabel?: string;
  newImageLabel?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  currentImageUrl,
  newImageUrl,
  currentImageLabel = 'Current Image',
  newImageLabel = 'New Image',
}) => {
  if (!currentImageUrl && !newImageUrl) {
    return null;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: currentImageUrl && newImageUrl ? '1fr 1fr' : '1fr',
      gap: '16px',
      marginBottom: '16px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      {currentImageUrl && (
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            {currentImageLabel}
          </div>
          <img
            src={currentImageUrl}
            alt="Current"
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              borderRadius: '4px',
              border: '2px solid #d1d5db',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
      
      {newImageUrl && (
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#16a34a',
            marginBottom: '8px'
          }}>
            {newImageLabel} {currentImageUrl && '(Will Replace)'}
          </div>
          <img
            src={newImageUrl}
            alt="New"
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              borderRadius: '4px',
              border: '2px solid #16a34a',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImagePreview;

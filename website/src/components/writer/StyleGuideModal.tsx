/**
 * StyleGuideModal - Editorial Style Guide Acknowledgement
 * Sprint 6: Compliance & Style
 * 
 * Displays the editorial style guide and requires writers to acknowledge
 * before submitting articles. Tracks compliance.lastStyleGuideAck timestamp.
 */

import React, { useState } from 'react';

interface StyleGuideModalProps {
  isOpen: boolean;
  onAccept: () => Promise<void>;
  onClose?: () => void;
  writerName?: string;
  isRequired?: boolean; // If true, cannot close without accepting
}

const StyleGuideModal: React.FC<StyleGuideModalProps> = ({
  isOpen,
  onAccept,
  onClose,
  writerName,
  isRequired = false
}) => {
  const [accepting, setAccepting] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept();
    } catch (error: any) {
      console.error('Error accepting style guide:', error);
      alert(`Failed to save acknowledgement: ${error.message}`);
    } finally {
      setAccepting(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: '#1f2937',
              marginBottom: '0.25rem'
            }}>
              📝 Editorial Style Guide
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {writerName ? `Welcome, ${writerName}!` : ''} Please review and acknowledge our editorial standards.
            </p>
          </div>
          {!isRequired && onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: '#9ca3af'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div 
          onScroll={handleScroll}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            fontSize: '0.9375rem',
            lineHeight: '1.7',
            color: '#374151'
          }}
        >
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
              1. Writing Standards
            </h3>
            <ul style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
              <li><strong>Accuracy:</strong> All facts must be verified from reliable sources. Attribution is required.</li>
              <li><strong>Clarity:</strong> Write clearly and concisely. Avoid jargon unless necessary for the topic.</li>
              <li><strong>Objectivity:</strong> News articles must be balanced. Opinion pieces should be clearly labeled.</li>
              <li><strong>Headlines:</strong> Must be accurate, specific, and at least 5 characters long.</li>
              <li><strong>Body:</strong> Articles must be substantive with at least 50 characters of content.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
              2. Formatting Guidelines
            </h3>
            <ul style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
              <li><strong>Paragraphs:</strong> Keep paragraphs focused on a single idea. 3-5 sentences is ideal.</li>
              <li><strong>Subheadings:</strong> Use subheadings for articles over 500 words to improve readability.</li>
              <li><strong>Quotes:</strong> Direct quotes should be attributed with the speaker's full name and title on first reference.</li>
              <li><strong>Numbers:</strong> Spell out numbers one through nine; use numerals for 10 and above.</li>
              <li><strong>Dates:</strong> Use format: January 30, 2026 (not 1/30/26 or 30/01/2026).</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
              3. Ethical Standards
            </h3>
            <ul style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
              <li><strong>Plagiarism:</strong> All work must be original. Properly cite all sources and quotes.</li>
              <li><strong>Conflicts of Interest:</strong> Disclose any personal or financial relationships with subjects.</li>
              <li><strong>Privacy:</strong> Respect individuals' privacy. Do not publish personal information without consent.</li>
              <li><strong>Corrections:</strong> Report errors immediately. We correct mistakes transparently.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
              4. Image Guidelines
            </h3>
            <ul style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
              <li><strong>Rights:</strong> Only use images you have rights to use (owned, licensed, or Creative Commons).</li>
              <li><strong>Attribution:</strong> Credit photographers and sources for all images.</li>
              <li><strong>Quality:</strong> Images should be high resolution (minimum 800px wide).</li>
              <li><strong>Relevance:</strong> Images must be relevant to the article content.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
              5. Submission Process
            </h3>
            <ul style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
              <li><strong>Deadlines:</strong> Respect editorial deadlines. Notify editors early if you cannot meet a deadline.</li>
              <li><strong>Revisions:</strong> Be responsive to editor feedback and revision requests.</li>
              <li><strong>Communication:</strong> Maintain professional communication with the editorial team.</li>
            </ul>
          </section>

          <div style={{
            padding: '1rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fcd34d',
            marginTop: '1rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '500', margin: 0 }}>
              ⚠️ <strong>Important:</strong> Violations of these guidelines may result in article rejection, 
              editorial review, or in serious cases, suspension of writing privileges.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '0 0 12px 12px'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            {!hasScrolledToBottom && isRequired && (
              <span style={{ color: '#dc2626' }}>
                ↓ Please scroll to read the complete guide
              </span>
            )}
            {hasScrolledToBottom && (
              <span style={{ color: '#059669' }}>
                ✓ You've reviewed the guide
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!isRequired && onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Review Later
              </button>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting || (isRequired && !hasScrolledToBottom)}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: (accepting || (isRequired && !hasScrolledToBottom)) ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: (accepting || (isRequired && !hasScrolledToBottom)) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {accepting ? (
                <>
                  <span style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    border: '2px solid white', 
                    borderTopColor: 'transparent', 
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block'
                  }} />
                  Saving...
                </>
              ) : (
                <>✓ I Accept &amp; Acknowledge</>
              )}
            </button>
          </div>
        </div>

        {/* Inline CSS for spinner */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default StyleGuideModal;

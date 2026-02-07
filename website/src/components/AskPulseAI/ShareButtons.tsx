// ShareButtons.tsx
// Social sharing component with analytics tracking - Site-wide component

import React, { useState } from 'react';
import { Share2, Twitter, Facebook, MessageCircle, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { trackShare } from '../../services/analyticsService';

interface ShareButtonsProps {
  article: {
    id: string;
    title: string;
    url: string;
    excerpt?: string;
  };
  onShare?: (platform: string, articleId: string) => void;
  compact?: boolean;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ 
  article, 
  onShare,
  compact = false 
}) => {
  const [showCopied, setShowCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Construct full URL based on article URL pattern
  const getFullUrl = (): string => {
    // If URL is already absolute, use it
    if (article.url.startsWith('http')) {
      return article.url;
    }
    
    // If URL starts with #, it's a hash route
    if (article.url.startsWith('#')) {
      return `https://kudzimusar.github.io/morning-pulse${article.url}`;
    }
    
    // If URL starts with /, it's a path
    if (article.url.startsWith('/')) {
      return `https://kudzimusar.github.io/morning-pulse${article.url}`;
    }
    
    // Default: construct from article ID
    return `https://kudzimusar.github.io/morning-pulse/article/${article.id}`;
  };

  const fullUrl = getFullUrl();
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(article.title);
  const encodedText = encodeURIComponent(article.excerpt || article.title);

  const handleShare = (platform: string, url: string, e?: React.MouseEvent) => {
    // Stop event propagation to prevent parent click handlers
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Track analytics
    trackShare({
      articleId: article.id,
      platform,
    });

    // Callback
    if (onShare) {
      onShare(platform, article.id);
    }

    // Open share window
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      url,
      'share',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    setShowMenu(false);
  };

  const handleCopyLink = async (e?: React.MouseEvent) => {
    // Stop event propagation to prevent parent click handlers
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      setShowCopied(true);
      
      // Track analytics
      trackShare({
        articleId: article.id,
        platform: 'copy',
      });
      
      if (onShare) {
        onShare('copy', article.id);
      }

      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (clipboardErr) {
        console.error('Clipboard copy failed:', clipboardErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };

  if (compact) {
    return (
      <div style={{ position: 'relative' }}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          aria-label="Share article"
          style={{
            padding: '0.5rem 1rem',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e0e0e0';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>

        {showMenu && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                padding: '0.5rem',
                zIndex: 100,
                minWidth: '150px',
              }}
            >
              <button
                onClick={(e) => handleShare('twitter', shareLinks.twitter, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <Twitter size={16} />
                Twitter
              </button>
              <button
                onClick={(e) => handleShare('whatsapp', shareLinks.whatsapp, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <MessageCircle size={16} />
                WhatsApp
              </button>
              <button
                onClick={(e) => handleShare('facebook', shareLinks.facebook, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <Facebook size={16} />
                Facebook
              </button>
              <button
                onClick={(e) => handleCopyLink(e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                {showCopied ? <Check size={16} /> : <LinkIcon size={16} />}
                {showCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button
        onClick={(e) => handleShare('twitter', shareLinks.twitter, e)}
        className="share-btn twitter"
        aria-label="Share on Twitter"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '2px solid #e0e0e0',
          borderRadius: '20px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 500,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = '#1DA1F2';
          e.currentTarget.style.color = '#1DA1F2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.color = 'inherit';
        }}
      >
        <Twitter size={16} />
        <span>Tweet</span>
      </button>

      <button
        onClick={(e) => handleShare('facebook', shareLinks.facebook, e)}
        className="share-btn facebook"
        aria-label="Share on Facebook"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '2px solid #e0e0e0',
          borderRadius: '20px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 500,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = '#4267B2';
          e.currentTarget.style.color = '#4267B2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.color = 'inherit';
        }}
      >
        <Facebook size={16} />
        <span>Share</span>
      </button>

      <button
        onClick={(e) => handleShare('whatsapp', shareLinks.whatsapp, e)}
        className="share-btn whatsapp"
        aria-label="Share on WhatsApp"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '2px solid #e0e0e0',
          borderRadius: '20px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 500,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = '#25D366';
          e.currentTarget.style.color = '#25D366';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.color = 'inherit';
        }}
      >
        <MessageCircle size={16} />
        <span>WhatsApp</span>
      </button>

      <button
        onClick={(e) => handleShare('linkedin', shareLinks.linkedin, e)}
        className="share-btn linkedin"
        aria-label="Share on LinkedIn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '2px solid #e0e0e0',
          borderRadius: '20px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 500,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = '#0077B5';
          e.currentTarget.style.color = '#0077B5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.color = 'inherit';
        }}
      >
        <Linkedin size={16} />
        <span>LinkedIn</span>
      </button>

      <button
        onClick={(e) => handleCopyLink(e)}
        className="share-btn copy"
        aria-label="Copy link"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '2px solid #e0e0e0',
          borderRadius: '20px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 500,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = 'var(--primary-color)';
          e.currentTarget.style.color = 'var(--primary-color)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.color = 'inherit';
        }}
      >
        {showCopied ? <Check size={16} /> : <LinkIcon size={16} />}
        <span>{showCopied ? 'Copied!' : 'Copy'}</span>
      </button>
    </div>
  );
};

export default ShareButtons;

// BookmarksPage.tsx
// Page to display all saved bookmarks

import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, ExternalLink, Clock } from 'lucide-react';
import { getBookmarks, removeBookmark, Bookmark as BookmarkType } from './AskPulseAI/BookmarkButton';
import { ShareButtons } from './AskPulseAI/ShareButtons';

interface BookmarksPageProps {
  onBack?: () => void;
}

const BookmarksPage: React.FC<BookmarksPageProps> = ({ onBack }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    const saved = getBookmarks();
    setBookmarks(saved);
  };

  const handleRemove = (id: string) => {
    removeBookmark(id);
    loadBookmarks();
  };

  const handleArticleClick = (bookmark: BookmarkType) => {
    if (bookmark.url) {
      if (bookmark.url.startsWith('#')) {
        window.location.hash = bookmark.url.substring(1);
      } else if (bookmark.url.startsWith('http')) {
        window.open(bookmark.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = bookmark.url;
      }
    }
  };

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Get unique categories
  const categories = Array.from(new Set(bookmarks.map(b => b.category).filter(Boolean))) as string[];
  const filteredBookmarks = selectedCategory
    ? bookmarks.filter(b => b.category === selectedCategory)
    : bookmarks;

  return (
    <div className="mobile-content-with-nav" style={{ minHeight: 'calc(100vh - 200px)', padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              marginBottom: '12px',
              color: 'var(--text-color)',
            }}
          >
            ← Back
          </button>
        )}
        <h1 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
          fontWeight: 700,
          color: 'var(--text-color)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Bookmark size={28} fill="currentColor" />
          Saved Articles
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--light-text)',
        }}>
          {bookmarks.length} {bookmarks.length === 1 ? 'article' : 'articles'} saved
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '8px 16px',
              background: selectedCategory === null ? 'var(--primary-color)' : '#f0f0f0',
              color: selectedCategory === null ? 'white' : 'var(--text-color)',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                background: selectedCategory === category ? 'var(--primary-color)' : '#f0f0f0',
                color: selectedCategory === category ? 'white' : 'var(--text-color)',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: 'var(--light-text)',
        }}>
          <Bookmark size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
            {selectedCategory ? 'No bookmarks in this category' : 'No bookmarks yet'}
          </h2>
          <p>
            {selectedCategory
              ? 'Try selecting a different category or save some articles first.'
              : 'Start saving articles you want to read later!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookmarks.map(bookmark => (
            <div
              key={bookmark.id}
              onClick={() => handleArticleClick(bookmark)}
              style={{
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.2s',
                cursor: bookmark.url ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#111827',
                      lineHeight: 1.4,
                    }}
                  >
                    {bookmark.title}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginBottom: '12px',
                  }}>
                    {bookmark.category && (
                      <span style={{
                        background: 'var(--primary-color)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {bookmark.category}
                      </span>
                    )}
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <Clock size={12} />
                      {getTimeAgo(bookmark.timestamp)}
                    </span>
                  </div>

                  {/* Share Button */}
                  {bookmark.url && (
                    <div style={{ marginTop: '12px' }}>
                      <ShareButtons
                        article={{
                          id: bookmark.id,
                          title: bookmark.title,
                          url: bookmark.url,
                        }}
                        compact
                      />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(bookmark.id);
                  }}
                  aria-label="Remove bookmark"
                  style={{
                    padding: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;

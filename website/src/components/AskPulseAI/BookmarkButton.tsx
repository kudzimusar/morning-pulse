// BookmarkButton.tsx
// Bookmark/save for later functionality with local storage

import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { trackBookmark } from '../../services/analyticsService';

interface BookmarkButtonProps {
  articleId: string;
  articleTitle: string;
  onBookmark?: (articleId: string, isBookmarked: boolean) => void;
  compact?: boolean;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  articleId,
  articleTitle,
  onBookmark,
  compact = false,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Check if article is bookmarked on mount
  useEffect(() => {
    const bookmarks = getBookmarks();
    setIsBookmarked(bookmarks.some(b => b.id === articleId));
  }, [articleId]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);

    if (newBookmarkedState) {
      addBookmark(articleId, articleTitle);
      showToastMessage('Saved for later!');
    } else {
      removeBookmark(articleId);
      showToastMessage('Removed from saved');
    }

    // Track analytics
    trackBookmark({
      articleId,
      action: newBookmarkedState ? 'add' : 'remove',
    });

    // Callback
    if (onBookmark) {
      onBookmark(articleId, newBookmarkedState);
    }
  };

  const showToastMessage = (message: string) => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={toggleBookmark}
          className={`bookmark-btn-compact ${isBookmarked ? 'bookmarked' : ''}`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          style={{
            padding: '0.5rem',
            background: isBookmarked ? 'var(--primary-color)' : 'none',
            border: `2px solid ${isBookmarked ? 'var(--primary-color)' : '#e0e0e0'}`,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.2rem',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            color: isBookmarked ? 'white' : 'inherit',
          }}
          onMouseEnter={(e) => {
            if (!isBookmarked) {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.background = '#f0f4ff';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isBookmarked) {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>

        {showToast && (
          <div
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#333',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '24px',
              fontSize: '0.9rem',
              zIndex: 1000,
              animation: 'slideUp 0.3s ease',
            }}
          >
            {isBookmarked ? '✅ Saved!' : '❌ Removed'}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={toggleBookmark}
        className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: isBookmarked ? 'var(--primary-color)' : 'white',
          border: `2px solid ${isBookmarked ? 'var(--primary-color)' : '#e0e0e0'}`,
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 500,
          transition: 'all 0.2s',
          color: isBookmarked ? 'white' : 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!isBookmarked) {
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.background = '#f0f4ff';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isBookmarked) {
            e.currentTarget.style.borderColor = '#e0e0e0';
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        <span>{isBookmarked ? 'Saved' : 'Save for later'}</span>
      </button>

      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '24px',
            fontSize: '0.9rem',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease',
          }}
        >
          {isBookmarked ? '✅ Saved for later!' : '❌ Removed from saved'}
        </div>
      )}
    </>
  );
};

// Bookmark Storage Utilities
interface Bookmark {
  id: string;
  title: string;
  timestamp: number;
  url?: string;
  category?: string;
}

const STORAGE_KEY = 'morning-pulse-bookmarks';

export const getBookmarks = (): Bookmark[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading bookmarks:', error);
    return [];
  }
};

export const addBookmark = (id: string, title: string, url?: string, category?: string): void => {
  try {
    const bookmarks = getBookmarks();
    const newBookmark: Bookmark = {
      id,
      title,
      timestamp: Date.now(),
      url,
      category,
    };
    
    // Add to beginning (most recent first)
    const updated = [newBookmark, ...bookmarks.filter(b => b.id !== id)];
    
    // Keep only last 100 bookmarks
    const trimmed = updated.slice(0, 100);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving bookmark:', error);
  }
};

export const removeBookmark = (id: string): void => {
  try {
    const bookmarks = getBookmarks();
    const updated = bookmarks.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing bookmark:', error);
  }
};

export const isBookmarked = (id: string): boolean => {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.id === id);
};

export const getBookmarkCount = (): number => {
  return getBookmarks().length;
};

// React hook for bookmark management
export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const refresh = () => {
    setBookmarks(getBookmarks());
  };

  return {
    bookmarks,
    refresh,
    count: bookmarks.length,
  };
};

export default BookmarkButton;

import React, { useState, useCallback } from 'react';
import { NEWS_DATA } from '../constants';
import { NewsStory } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const estimateReadTime = (text?: string): number => {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

const getTimeAgo = (timestamp?: number): string => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ─── Bookmark helpers (localStorage) ────────────────────────────────────────

const BOOKMARK_KEY = 'morning-pulse-bookmarks';

interface Bookmark {
  id: string;
  title: string;
  timestamp: number;
  url?: string;
  category?: string;
}

const getBookmarks = (): Bookmark[] => {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
  } catch {
    return [];
  }
};

const toggleBookmarkStorage = (story: NewsStory): boolean => {
  const bookmarks = getBookmarks();
  const exists = bookmarks.some(b => b.id === story.id);
  if (exists) {
    const updated = bookmarks.filter(b => b.id !== story.id);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('savedArticlesUpdated'));
    return false; // now un-bookmarked
  } else {
    const updated = [
      { id: story.id, title: story.headline, timestamp: Date.now(), category: story.category },
      ...bookmarks.filter(b => b.id !== story.id),
    ].slice(0, 100);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('savedArticlesUpdated'));
    return true; // now bookmarked
  }
};

// ─── Toast ───────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      position: 'fixed',
      bottom: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#333',
      color: 'white',
      padding: '0.6rem 1.4rem',
      borderRadius: '24px',
      fontSize: '0.85rem',
      zIndex: 9999,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}
  >
    {message}
  </div>
);

// ─── Icons (inline SVG — no extra dependency) ─────────────────────────────────

const BookOpenIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── Article Card (matches AskPulseAI ArticleListItem exactly) ───────────────

interface ArticleCardProps {
  story: NewsStory;
  isLast?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ story, isLast = false }) => {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() =>
    getBookmarks().some(b => b.id === story.id)
  );
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowSaved = toggleBookmarkStorage(story);
    setIsBookmarked(nowSaved);
    showToast(nowSaved ? '✅ Saved!' : '❌ Removed from saved');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = story.url || `https://kudzimusar.github.io/morning-pulse/#article/${story.id}`;
    const shareData = {
      title: story.headline,
      text: story.detail || story.headline,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        showToast('🔗 Link copied!');
      }
    } catch {
      // user cancelled share — do nothing
    }
  };

  const handleCardClick = () => {
    if (story.url) {
      window.open(story.url, '_blank', 'noopener,noreferrer');
    }
  };

  const timeAgo = getTimeAgo((story as any).timestamp);

  return (
    <>
      <div
        onClick={handleCardClick}
        style={{
          padding: '14px 0',
          borderBottom: isLast ? 'none' : '1px solid #e5e7eb',
          cursor: story.url ? 'pointer' : 'default',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (story.url) e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Row 1: Category badge + optional timestamp */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '7px',
            gap: '10px',
          }}
        >
          <span
            style={{
              background: '#111827',
              color: '#ffffff',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              flexShrink: 0,
            }}
          >
            {story.category}
          </span>

          {timeAgo && (
            <span
              style={{
                fontSize: '0.68rem',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0,
              }}
            >
              <ClockIcon />
              {timeAgo}
            </span>
          )}
        </div>

        {/* Row 2: Bold headline */}
        <h4
          style={{
            margin: '0 0 6px 0',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.4,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {story.headline}
        </h4>

        {/* Row 3: Summary (2-line clamp) */}
        {story.detail && (
          <p
            style={{
              margin: '0 0 10px 0',
              fontSize: '0.85rem',
              color: '#6b7280',
              lineHeight: 1.55,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {story.detail}
          </p>
        )}

        {/* Row 4: Read time + actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Read time */}
          <span
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <BookOpenIcon />
            {estimateReadTime(story.detail)} min read
          </span>

          {/* Bookmark + Share */}
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
            {/* Bookmark button — circular */}
            <button
              onClick={handleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
              title={isBookmarked ? 'Remove from saved' : 'Save article'}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: isBookmarked ? '2px solid #111827' : '2px solid #e0e0e0',
                background: isBookmarked ? '#111827' : 'white',
                color: isBookmarked ? 'white' : '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isBookmarked) {
                  e.currentTarget.style.borderColor = '#111827';
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isBookmarked) {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <BookmarkIcon filled={isBookmarked} />
            </button>

            {/* Share button — pill */}
            <button
              onClick={handleShare}
              aria-label="Share article"
              style={{
                padding: '0 14px',
                height: '38px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 500,
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0f0f0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <ShareIcon />
              Share
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </>
  );
};

// ─── NewsFeed (renders all categories and cards) ─────────────────────────────

const NewsFeed: React.FC = () => {
  return (
    <div style={{ width: '100%' }}>
      {Object.entries(NEWS_DATA).map(([category, stories]) => (
        <div key={category} style={{ marginBottom: '8px' }}>
          {stories.map((story, index) => (
            <ArticleCard
              key={story.id}
              story={story}
              isLast={index === stories.length - 1}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;

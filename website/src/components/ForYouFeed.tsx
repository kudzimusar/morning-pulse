import React, { useState, useEffect, useMemo } from 'react';
import { NewsStory } from '../../types';
import LoadingSkeleton from './LoadingSkeleton';
import { CountryInfo } from '../services/locationService';
import { getAuth } from 'firebase/auth';
import { getCurrentEditor } from '../services/authService';

interface ForYouFeedProps {
  newsData: {
    [category: string]: NewsStory[];
  };
  userCountry?: CountryInfo;
  userId?: string | null;
  isAuthenticated?: boolean;
  userRole?: string[] | null;
}

// ─── Category SVG Icon System ──────────────────────────────────────────────
// Each returns a small inline SVG respecting the brand palette (#000033 navy,
// accompanied by category-specific accent colours).

const CategoryIcon: React.FC<{ category: string; size?: number }> = ({
  category,
  size = 20,
}) => {
  const normalised = category.toLowerCase();

  // Local / Zimbabwe
  if (normalised.includes('local') || normalised.includes('zim')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
          fill="#000033"
        />
      </svg>
    );
  }

  // Business / Finance & Economy
  if (normalised.includes('business') || normalised.includes('finance') || normalised.includes('economy')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 12H4V9h16v10zm-8-1c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM7 5h10V3H7v2z"
          fill="#065f46"
        />
      </svg>
    );
  }

  // World News / Global
  if (normalised.includes('world') || normalised.includes('global')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
          fill="#991b1b"
        />
      </svg>
    );
  }

  // Sports
  if (normalised.includes('sport')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4.18 11h2.05c.1-1.58.61-3.04 1.43-4.28L6.2 5.36C4.96 6.75 4.2 8.54 4.18 11zm1.99 2H4.18c.02 2.46.78 4.25 2.02 5.64l1.45-1.36C6.79 16.04 6.28 14.58 6.17 13zm1.9-6.66A7.974 7.974 0 0 1 11 5.18V3.11C8.54 3.35 6.37 4.7 5 6.71l1.43 1.35c.41-.56.9-1.06 1.44-1.49C7.91 6.52 7.99 6.43 8.07 6.34zm7.2-1.26C13.99 3.36 12.53 3.07 11 3v2.16c1.22.1 2.38.51 3.36 1.17.57.5 1.08 1.01 1.52 1.61L17.35 6.6c-.63-.6-1.33-1.13-2.08-1.52zm2.91 5.92h-2.05c-.1 1.58-.61 3.04-1.43 4.28l1.46 1.36c1.24-1.39 2-3.18 2.02-5.64zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
          fill="#1e40af"
        />
      </svg>
    );
  }

  // Tech & AI
  if (normalised.includes('tech') || normalised.includes('ai') || normalised.includes('technology')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
          fill="#6b21a8"
        />
      </svg>
    );
  }

  // African Focus
  if (normalised.includes('african') || normalised.includes('africa')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5h2v2h-2v-2zm1-10c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"
          fill="#b45309"
        />
      </svg>
    );
  }

  // Politics
  if (normalised.includes('politic')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 10v7h3v-7H4zm6.5 0v7h3v-7h-3zM2 22h19v-3H2v3zm15-12v7h3v-7h-3zM11.5 1L2 6v2h19V6l-9.5-5z"
          fill="#334155"
        />
      </svg>
    );
  }

  // Health
  if (normalised.includes('health')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
          fill="#9f1239"
        />
      </svg>
    );
  }

  // Opinion / Editorial
  if (normalised.includes('opinion') || normalised.includes('editorial')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
          fill="#374151"
        />
      </svg>
    );
  }

  // Culture
  if (normalised.includes('culture')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
          fill="#c2410c"
        />
      </svg>
    );
  }

  // Default — newspaper icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4v-2z"
        fill="#374151"
      />
    </svg>
  );
};

// ─── Category accent colour helper ─────────────────────────────────────────
const getCategoryAccent = (category: string): string => {
  const n = category.toLowerCase();
  if (n.includes('local') || n.includes('zim')) return '#000033';
  if (n.includes('business') || n.includes('finance') || n.includes('economy')) return '#065f46';
  if (n.includes('world') || n.includes('global')) return '#991b1b';
  if (n.includes('sport')) return '#1e40af';
  if (n.includes('tech') || n.includes('ai')) return '#6b21a8';
  if (n.includes('african') || n.includes('africa')) return '#b45309';
  if (n.includes('politic')) return '#334155';
  if (n.includes('health')) return '#9f1239';
  if (n.includes('opinion') || n.includes('editorial')) return '#374151';
  if (n.includes('culture')) return '#c2410c';
  return '#374151';
};

// ─── Single article row (mobile + desktop) ─────────────────────────────────
const ArticleRow: React.FC<{
  article: NewsStory;
  userCountry?: CountryInfo;
}> = ({ article }) => {
  const accent = getCategoryAccent(article.category);

  const handleClick = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <article
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-color, #e0e0e0)',
        cursor: article.url ? 'pointer' : 'default',
        backgroundColor: 'var(--card-bg, #ffffff)',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={e => {
        if (article.url) (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-bg, #ffffff)';
      }}
    >
      {/* Category icon badge */}
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: `${accent}12`,
          border: `1px solid ${accent}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
        aria-label={article.category}
      >
        <CategoryIcon category={article.category} size={18} />
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Category label */}
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: accent,
            marginBottom: 4,
          }}
        >
          {article.category}
        </span>

        {/* Headline */}
        <h3
          style={{
            margin: 0,
            fontSize: '0.9375rem',
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'var(--text-color, #1a1a1a)',
            fontFamily: 'var(--font-heading, Georgia, serif)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {article.headline}
        </h3>

        {/* Meta row: source + time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 6,
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--light-text, #666)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {article.source}
          </span>
          {article.timestamp ? (
            <>
              <span style={{ fontSize: '0.6875rem', color: '#bbb' }}>·</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--light-text, #666)' }}>
                {formatTime(article.timestamp)}
              </span>
            </>
          ) : null}
          {article.url && (
            <>
              <span style={{ fontSize: '0.6875rem', color: '#bbb' }}>·</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: accent,
                  fontWeight: 600,
                }}
              >
                Read more
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

// ─── Main ForYouFeed component ──────────────────────────────────────────────

const ForYouFeed: React.FC<ForYouFeedProps> = ({
  newsData,
  userCountry,
  userId = null,
  isAuthenticated = false,
  userRole = null,
}) => {
  const [loading, setLoading] = useState(true);
  const [personalizedArticles, setPersonalizedArticles] = useState<NewsStory[]>([]);
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    userId: string | null;
  }>({ isAuthenticated: false, userId: null });

  // Resolve auth state from Firebase directly (single source of truth)
  useEffect(() => {
    const auth = getAuth();

    const resolveAuth = (user: any) => {
      const editor = getCurrentEditor();
      const resolvedUser = user || editor;
      if (resolvedUser) {
        setAuthState({
          isAuthenticated: true,
          userId: resolvedUser.uid || null,
        });
      } else {
        // Fall back to props if Firebase hasn't resolved yet
        setAuthState({
          isAuthenticated: isAuthenticated || false,
          userId: userId || null,
        });
      }
    };

    resolveAuth(auth.currentUser);
    const unsubscribe = auth.onAuthStateChanged(resolveAuth);
    return () => unsubscribe();
  }, [isAuthenticated, userId]);

  // ─── Load preferred categories from Firestore reader profile ─────────────
  // Uses readerService.getReader() which checks both artifact and legacy paths,
  // so it matches exactly what ReaderProfilePage saves.
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      if (!authState.isAuthenticated || !authState.userId) {
        // Guest: editorial fallback
        setPreferredCategories(['Local (Zim)', 'World News', 'Sports', 'Tech & AI', 'Business (Zim)']);
        return;
      }

      try {
        // Import inline to avoid circular dep issues
        const { getReader } = await import('../services/readerService');
        const reader = await getReader(authState.userId);

        if (!cancelled && reader?.preferences?.categories?.length) {
          setPreferredCategories(reader.preferences.categories);
          console.log('[ForYouFeed] Loaded categories from profile:', reader.preferences.categories);
          return;
        }
      } catch (e) {
        console.warn('[ForYouFeed] Could not load reader preferences:', e);
      }

      // Fallback: try userCategoryPreferences localStorage (interaction-based)
      if (!cancelled) {
        try {
          const stored = localStorage.getItem('userCategoryPreferences');
          if (stored) {
            const prefs = JSON.parse(stored);
            const cats = Object.entries(prefs)
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 5)
              .map(([cat]) => cat as string);
            if (cats.length > 0) {
              setPreferredCategories(cats);
              return;
            }
          }
        } catch (_) { }

        // Final fallback
        setPreferredCategories(['Local (Zim)', 'World News', 'Business (Zim)']);
      }
    };

    loadCategories();
    return () => { cancelled = true; };
  }, [authState.isAuthenticated, authState.userId]);

  // ─── Build the personalised article list ─────────────────────────────────
  useEffect(() => {
    setLoading(true);

    const build = () => {
      const articles: NewsStory[] = [];

      if (preferredCategories.length > 0) {
        preferredCategories.forEach(cat => {
          const catArticles = newsData[cat] || [];
          articles.push(...catArticles.slice(0, 5));
        });
      }

      // Pad with remaining categories (2 each)
      Object.keys(newsData).forEach(cat => {
        if (!preferredCategories.includes(cat)) {
          articles.push(...(newsData[cat] || []).slice(0, 2));
        }
      });

      // Deduplicate by id
      const seen = new Set<string>();
      const unique = articles.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });

      const sorted = unique.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setPersonalizedArticles(sorted.slice(0, 30));
      setLoading(false);
    };

    if (Object.keys(newsData).length > 0) {
      build();
    } else {
      setLoading(false);
    }
  }, [newsData, preferredCategories]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Empty state
  if (personalizedArticles.length === 0) {
    return (
      <div
        style={{
          padding: '48px 16px',
          textAlign: 'center',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-color)',
            marginBottom: 12,
          }}
        >
          {authState.isAuthenticated ? 'Your Personalised Feed' : 'Trending Stories'}
        </h2>
        <p style={{ color: 'var(--light-text)', marginBottom: 24, lineHeight: 1.6 }}>
          {authState.isAuthenticated
            ? 'Your feed will fill up as we load the latest news. Try adjusting your interests in your profile.'
            : 'Sign in to personalise your news feed based on topics you care about.'}
        </p>
        {!authState.isAuthenticated && (
          <button
            onClick={() => { window.location.hash = 'auth'; }}
            style={{
              padding: '10px 24px',
              background: 'var(--primary-color, #000033)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign in to personalise
          </button>
        )}
      </div>
    );
  }

  return (
    <main
      // mobile-content-with-nav adds bottom padding for mobile bottom nav
      className="mobile-content-with-nav"
      style={{ maxWidth: 860, margin: '0 auto' }}
    >
      {/* Section header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '2px solid var(--primary-color, #000033)',
          marginBottom: 0,
        }}
      >
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-color, #0a0a0a)',
            fontFamily: 'var(--font-heading, Georgia, serif)',
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          {authState.isAuthenticated ? 'For You' : 'Trending'}
        </h2>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--light-text, #666)',
            marginTop: 3,
            marginBottom: 0,
          }}
        >
          {authState.isAuthenticated
            ? 'Personalised stories based on your interests'
            : 'Top stories across categories'}
        </p>

        {!authState.isAuthenticated && (
          <button
            onClick={() => { window.location.hash = 'auth'; }}
            style={{
              marginTop: 10,
              padding: '6px 14px',
              background: 'transparent',
              color: 'var(--primary-color, #000033)',
              border: '1px solid var(--primary-color, #000033)',
              borderRadius: 4,
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign in to personalise
          </button>
        )}
      </div>

      {/* Article list — works on mobile and desktop */}
      <div>
        {personalizedArticles.map((article, idx) => (
          <ArticleRow
            key={`foryou-${article.id}-${idx}`}
            article={article}
            userCountry={userCountry}
          />
        ))}
      </div>
    </main>
  );
};

export default ForYouFeed;

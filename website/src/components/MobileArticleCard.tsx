import React, { useState } from 'react';
import { NewsStory } from '../types';
import { Clock, BookOpen, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';

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

interface LocalBookmark {
    id: string;
    title: string;
    timestamp: number;
    url?: string;
    category?: string;
}

const getBookmarks = (): LocalBookmark[] => {
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
            bottom: '100px', // Above mobile nav
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

// ─── Mobile Article Card ─────────────────────────────────────────────────────

interface MobileArticleCardProps {
    story: NewsStory;
    isLast?: boolean;
}

const MobileArticleCard: React.FC<MobileArticleCardProps> = ({ story, isLast = false }) => {
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

        // Ensure we use the correct website hash routing format
        const baseUrl = window.location.origin + window.location.pathname;
        const url = story.url || `${baseUrl}#news`;

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
                className="mobile-article-card"
                style={{
                    padding: '16px 0',
                    borderBottom: isLast ? 'none' : '1px solid #e5e7eb',
                    cursor: story.url ? 'pointer' : 'default',
                    transition: 'background-color 0.15s',
                    display: 'block', // Ensuring it displays properly
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
                        marginBottom: '8px',
                        gap: '10px',
                    }}
                >
                    <span
                        style={{
                            background: '#111827',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
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
                                fontSize: '0.7rem',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0,
                            }}
                        >
                            <Clock size={12} />
                            {timeAgo}
                        </span>
                    )}
                </div>

                {/* Row 2: Bold headline */}
                <h4
                    style={{
                        margin: '0 0 6px 0',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#111827',
                        lineHeight: 1.35,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                >
                    {story.headline}
                </h4>

                {/* Row 3: Summary (2-line clamp) */}
                {story.detail && (
                    <p
                        style={{
                            margin: '0 0 12px 0',
                            fontSize: '0.9rem',
                            color: '#4b5563',
                            lineHeight: 1.5,
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
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <BookOpen size={14} />
                        {estimateReadTime(story.detail)} min read
                    </span>

                    {/* Bookmark + Share */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                        >
                            {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>

                        {/* Share button — pill */}
                        <button
                            onClick={handleShare}
                            aria-label="Share article"
                            style={{
                                padding: '0 14px',
                                height: '38px',
                                background: '#f3f4f6',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#111827',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                                flexShrink: 0,
                            }}
                        >
                            <Share2 size={16} />
                            Share
                        </button>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast} />}
        </>
    );
};

export default MobileArticleCard;

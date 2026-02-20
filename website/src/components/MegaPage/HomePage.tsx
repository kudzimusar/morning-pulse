import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import '../../styles/homepage.css';

// ─────────────────────────────────────────────
// Types (inline to avoid import issues)
// ─────────────────────────────────────────────
interface Article {
    id: string;
    headline: string;
    subHeadline?: string;
    summary?: string;
    body?: string;
    author?: string;
    authorName?: string;
    category?: string;
    type?: string;                // 'editorial' | 'opinion' | 'news' | etc.
    finalImageUrl?: string;
    imageUrl?: string;
    publishedAt?: any;
    slug?: string;
    source?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function isOpinion(article: Article): boolean {
    const t = (article.type || '').toLowerCase();
    return t === 'editorial' || t === 'opinion' || t === 'column';
}

function hasImage(article: Article): boolean {
    return !!(article.finalImageUrl || article.imageUrl);
}

function getImage(article: Article): string {
    return article.finalImageUrl || article.imageUrl || '';
}

function getExcerpt(article: Article): string {
    if (article.summary) return article.summary;
    if (article.body) {
        return article.body.replace(/<[^>]*>/g, '').substring(0, 180) + '…';
    }
    return article.subHeadline || '';
}

function formatDate(ts: any): string {
    if (!ts) return '';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
        return '';
    }
}

// ─────────────────────────────────────────────
// Breaking Bar
// ─────────────────────────────────────────────
const BreakingBar: React.FC<{ headlines: string[] }> = ({ headlines }) => {
    if (!headlines.length) return null;
    return (
        <div className="hp-breaking-bar">
            <span className="hp-breaking-label">Breaking</span>
            <div className="hp-breaking-ticker">
                <span className="hp-breaking-ticker-inner">
                    {headlines.map((h, i) => (
                        <span key={i}>
                            {h}
                            {i < headlines.length - 1 && <span style={{ margin: '0 32px', opacity: 0.4 }}>•</span>}
                        </span>
                    ))}
                </span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Opinion Card  (with editorial image)
// ─────────────────────────────────────────────
const OpinionCard: React.FC<{ article: Article; onClick: () => void }> = ({ article, onClick }) => (
    <div className="hp-opinion-card" onClick={onClick}>
        {hasImage(article) && (
            <div className="hp-card-img">
                <img src={getImage(article)} alt={article.headline} loading="lazy" />
            </div>
        )}
        <div className="hp-card-kicker">{article.type || 'Editorial'}</div>
        <h3 className="hp-card-headline">{article.headline}</h3>
        <p className="hp-card-excerpt">{getExcerpt(article)}</p>
        <div className="hp-card-meta">
            {article.author || article.authorName || 'Editorial Team'}
            {article.publishedAt && <span style={{ marginLeft: 8 }}>· {formatDate(article.publishedAt)}</span>}
        </div>
    </div>
);

// ─────────────────────────────────────────────
// News Card  (no image — category badge instead)
// ─────────────────────────────────────────────
const NewsCard: React.FC<{ article: Article; onClick: () => void }> = ({ article, onClick }) => {
    const cat = article.category || 'World';
    return (
        <div className="hp-news-card" onClick={onClick}>
            <span className="hp-cat-badge" data-cat={cat}>
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                    <circle cx="3" cy="3" r="3" />
                </svg>
                {cat}
            </span>
            <h3 className="hp-card-headline">{article.headline}</h3>
            <p className="hp-card-excerpt">{getExcerpt(article)}</p>
            <div className="hp-news-footer">
                <span>{article.source || article.author || article.authorName || 'Wire'}</span>
                <span>{formatDate(article.publishedAt)}</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────
const HeroSection: React.FC<{
    hero: Article | null;
    sidebarArticles: Article[];
    onArticleClick: (id: string, slug?: string) => void;
}> = ({ hero, sidebarArticles, onArticleClick }) => {
    const title = hero?.headline || 'Global Markets Rally as Tech Sector Rebounds';
    const sub = hero?.subHeadline || hero?.summary || 'Major indices hit record highs following positive earnings reports.';
    const author = hero?.author || hero?.authorName || 'Editorial Team';
    const img = hero ? getImage(hero) : '';
    const date = hero ? formatDate(hero.publishedAt) : 'Today';

    return (
        <div className="hp-hero-grid">
            {/* LEFT: Big hero story */}
            <div
                className="hp-hero-story"
                onClick={() => hero && onArticleClick(hero.id, hero.slug)}
                role="article"
                aria-label={`Hero story: ${title}`}
            >
                {img && (
                    <div className="hp-hero-img">
                        <img src={img} alt={title} />
                    </div>
                )}
                <div className="hp-hero-kicker">{hero?.type || 'Editorial'}</div>
                <h1 className="hp-hero-headline">{title}</h1>
                <p className="hp-hero-subheadline">{sub}</p>
                <div className="hp-hero-meta">
                    <strong>{author}</strong>
                    <span className="hp-dot">|</span>
                    <span>{date}</span>
                    <span className="hp-dot">|</span>
                    <span>4 min read</span>
                </div>
            </div>

            {/* RIGHT: Sidebar */}
            <aside className="hp-sidebar">
                <div className="hp-brief-card">
                    <div className="hp-brief-card-title">
                        <span>⚡</span> Your Briefing
                    </div>
                    <div className="hp-brief-card-body">
                        <strong>Good morning.</strong> Markets are rallying on tech earnings,
                        while global climate talks reach a pivotal moment.
                    </div>
                </div>

                <p className="hp-sidebar-title">Also in the news</p>
                {sidebarArticles.map(a => (
                    <div
                        key={a.id}
                        className="hp-trending-item"
                        onClick={() => onArticleClick(a.id, a.slug)}
                        role="button"
                        tabIndex={0}
                    >
                        <div>
                            <div className="hp-trending-headline">{a.headline}</div>
                            <div className="hp-trending-cat">{a.category || a.type || 'News'}</div>
                        </div>
                    </div>
                ))}

                <div className="hp-ad-slot">
                    <span className="hp-ad-label">Advertisement</span>
                    <span>Premium Partner</span>
                </div>
            </aside>
        </div>
    );
};

// ─────────────────────────────────────────────
// Story Grid
// ─────────────────────────────────────────────
const StoryGrid: React.FC<{
    articles: Article[];
    onArticleClick: (id: string, slug?: string) => void;
}> = ({ articles, onArticleClick }) => (
    <div className="hp-card-grid">
        {articles.map(a =>
            isOpinion(a) ? (
                <OpinionCard
                    key={a.id}
                    article={a}
                    onClick={() => onArticleClick(a.id, a.slug)}
                />
            ) : (
                <NewsCard
                    key={a.id}
                    article={a}
                    onClick={() => onArticleClick(a.id, a.slug)}
                />
            )
        )}
    </div>
);

// ─────────────────────────────────────────────
// HomePage (main export)
// ─────────────────────────────────────────────
interface HomePageProps {
    onArticleClick: (id: string, slug?: string) => void;
    user?: any;
}

export const HomePage: React.FC<HomePageProps> = ({ onArticleClick }) => {
    const [loading, setLoading] = useState(true);
    const [hero, setHero] = useState<Article | null>(null);
    const [sidebar, setSidebar] = useState<Article[]>([]);
    const [grid, setGrid] = useState<Article[]>([]);
    const [breaking, setBreaking] = useState<string[]>([]);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                const ref = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');

                // 1. Hero — prefer zone-assigned, fallback to latest
                const heroQ = query(ref, where('zoneAssignment', '==', 'A_Hero'), where('status', '==', 'published'), limit(1));
                const heroSnap = await getDocs(heroQ);

                let heroDoc: Article | null = null;
                let heroId = '';

                if (!heroSnap.empty) {
                    heroDoc = { id: heroSnap.docs[0].id, ...heroSnap.docs[0].data() } as Article;
                    heroId = heroDoc.id;
                } else {
                    const fallQ = query(ref, where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(1));
                    const fallSnap = await getDocs(fallQ);
                    if (!fallSnap.empty) {
                        heroDoc = { id: fallSnap.docs[0].id, ...fallSnap.docs[0].data() } as Article;
                        heroId = heroDoc.id;
                    }
                }
                setHero(heroDoc);

                // 2. Feed articles (exclude hero)
                const feedQ = query(ref, where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(24));
                const feedSnap = await getDocs(feedQ);
                const feed = feedSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as Article))
                    .filter(a => a.id !== heroId);

                setSidebar(feed.slice(0, 4));
                setGrid(feed.slice(4, 22));

                // Breaking news ticker
                setBreaking([
                    'Global climate summit reaches tentative deal on emissions',
                    'Tech sector rally continues as AI chip demand surges',
                    'Zimbabwe inflation falls below 10% — first time since 1997',
                    'ICC Men\'s T20 World Cup: Zimbabwe advance to Super Eight',
                ]);
            } catch (err) {
                console.error('HomePage fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="hp-page">
            <BreakingBar headlines={breaking} />

            <HeroSection
                hero={hero}
                sidebarArticles={sidebar}
                onArticleClick={onArticleClick}
            />

            <div className="hp-section-header">
                <h2>Today&rsquo;s Stories</h2>
                <span />
            </div>

            <StoryGrid articles={grid} onArticleClick={onArticleClick} />
        </div>
    );
};

export default HomePage;

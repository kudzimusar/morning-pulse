import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import '../../styles/homepage.css';

/* ─── Types ──────────────────────────────────────────── */
interface Article {
    id: string;
    headline: string;
    subHeadline?: string;
    summary?: string;
    body?: string;
    author?: string;
    authorName?: string;
    category?: string;
    type?: string;
    finalImageUrl?: string;
    imageUrl?: string;
    publishedAt?: any;
    slug?: string;
    source?: string;
}

/* ─── Helpers ────────────────────────────────────────── */
const isOpinion = (a: Article) => {
    const t = (a.type || '').toLowerCase();
    return t === 'editorial' || t === 'opinion' || t === 'column';
};

const img = (a: Article) => a.finalImageUrl || a.imageUrl || '';

const excerpt = (a: Article, len = 160) => {
    if (a.summary) return a.summary.substring(0, len);
    if (a.body) return a.body.replace(/<[^>]*>/g, '').substring(0, len) + '…';
    return a.subHeadline || '';
};

const timeAgo = (ts: any): string => {
    if (!ts) return '';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch { return ''; }
};

const byAuthor = (a: Article) => a.author || a.authorName || 'Morning Pulse';

/* ─── Breaking Bar ───────────────────────────────────── */
const BreakingBar: React.FC<{ items: string[] }> = ({ items }) => {
    if (!items.length) return null;
    // Double the list so the animation loops seamlessly
    const doubled = [...items, ...items];
    return (
        <div className="hp-breaking-bar">
            <span className="hp-breaking-label">
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor" /></svg>
                Live
            </span>
            <div className="hp-breaking-ticker-wrap">
                <span className="hp-breaking-ticker">
                    {doubled.map((h, i) => (
                        <span key={i}>
                            {h}
                            <span className="hp-breaking-sep">●</span>
                        </span>
                    ))}
                </span>
            </div>
        </div>
    );
};

/* ─── Section Header (BBC red-bar style) ─────────────── */
const SectionHeader: React.FC<{ label: string; href?: string }> = ({ label, href }) => (
    <div className="hp-sec-header">
        <span className="hp-sec-label">{label}</span>
        <span className="hp-sec-rule" />
        {href && <a className="hp-sec-link" href={href}>View all →</a>}
    </div>
);

/* ─── Hero Section ───────────────────────────────────── */
const HeroSection: React.FC<{
    hero: Article | null;
    sidebar: Article[];
    onArticleClick: (id: string, slug?: string) => void;
}> = ({ hero, sidebar, onArticleClick }) => {
    const title = hero?.headline || 'Global Markets Rally as Tech Sector Rebounds';
    const deck = hero?.subHeadline || hero?.summary || 'Major indices hit record highs following positive earnings from key semiconductor manufacturers.';
    const heroImg = hero ? img(hero) : '';
    const cat = hero?.type || hero?.category || 'Editorial';

    return (
        <>
            <SectionHeader label="Top Story" />
            <div className="hp-hero-grid">
                {/* LEFT: Hero */}
                <div
                    className="hp-hero-story"
                    onClick={() => hero && onArticleClick(hero.id, hero.slug)}
                    role="article"
                >
                    <div className="hp-hero-img-wrap">
                        {heroImg
                            ? <img src={heroImg} alt={title} />
                            : <div style={{ width: '100%', height: '100%', background: '#222' }} />
                        }
                        <span className="hp-img-category">{cat}</span>
                    </div>
                    <div className="hp-hero-body">
                        <h1 className="hp-hero-hed">{title}</h1>
                        <p className="hp-hero-dek">{deck}</p>
                        <div className="hp-byline">
                            <strong>{byAuthor(hero || {} as Article)}</strong>
                            <span className="hp-byline-sep">|</span>
                            <span>{timeAgo(hero?.publishedAt) || 'Today'}</span>
                            <span className="hp-byline-sep">|</span>
                            <span>4 min read</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Sidebar */}
                <aside className="hp-sidebar">
                    <div className="hp-sidebar-top">
                        <div className="hp-sidebar-top-label">
                            <svg width="12" height="12" viewBox="0 0 12 12">
                                <path d="M6 0L7.5 4.5H12L8.25 7.5L9.75 12L6 9L2.25 12L3.75 7.5L0 4.5H4.5Z" fill="#B8860B" />
                            </svg>
                            Your briefing
                        </div>
                        <div className="hp-sidebar-top-body">
                            <strong>Good morning.</strong> Markets are rallying on tech earnings,
                            while global climate talks enter a critical phase.
                            Zimbabwe's cricket side advance to the Super Eight.
                        </div>
                    </div>

                    <p className="hp-trending-label">Also in the news</p>
                    {sidebar.map((a, i) => (
                        <div
                            key={a.id}
                            className="hp-trending-item"
                            onClick={() => onArticleClick(a.id, a.slug)}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="hp-trending-rank">{i + 1}</span>
                            <div>
                                <div className="hp-trending-hed">{a.headline}</div>
                                <div className="hp-trending-cat">{a.category || a.type || 'News'}</div>
                            </div>
                        </div>
                    ))}

                    <div className="hp-sidebar-ad">
                        <span style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.6 }}>ADVERTISEMENT</span>
                        <span>Partner Promotion</span>
                    </div>
                </aside>
            </div>
        </>
    );
};

/* ─── Opinion Card (editorial image) ─────────────────── */
const OpinionCard: React.FC<{ a: Article; onClick: () => void }> = ({ a, onClick }) => (
    <div className="hp-opinion-card" onClick={onClick}>
        <div className="hp-card-img-wrap">
            {img(a)
                ? <img src={img(a)} alt={a.headline} loading="lazy" />
                : <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }} />
            }
            <div className="hp-card-img-scrim" />
            <span className="hp-card-img-cat">{a.type || a.category || 'Editorial'}</span>
        </div>
        <div className="hp-card-body">
            <h2 className="hp-card-hed">{a.headline}</h2>
            <p className="hp-card-dek">{excerpt(a)}</p>
            <div className="hp-card-foot">
                <span>{byAuthor(a)}</span>
                <span className="hp-read-more">Read →</span>
            </div>
        </div>
    </div>
);

/* ─── News Card (Bloomberg left-stripe, no image) ─────── */
const NewsCard: React.FC<{ a: Article; onClick: () => void }> = ({ a, onClick }) => {
    const cat = a.category || 'World';
    return (
        <div className="hp-news-card" data-cat={cat} onClick={onClick}>
            <div className="hp-news-card-inner">
                <div className="hp-news-cat">{cat}</div>
                <h2 className="hp-news-hed">{a.headline}</h2>
                <p className="hp-news-dek">{excerpt(a, 130)}</p>
                <div className="hp-news-foot">
                    <span>{a.source || byAuthor(a)}</span>
                    <span>{timeAgo(a.publishedAt)}</span>
                </div>
            </div>
        </div>
    );
};

/* ─── Story Grid ─────────────────────────────────────── */
const StoryGrid: React.FC<{
    articles: Article[];
    onArticleClick: (id: string, slug?: string) => void;
}> = ({ articles, onArticleClick }) => (
    <div className="hp-grid">
        {articles.map(a =>
            isOpinion(a)
                ? <OpinionCard key={a.id} a={a} onClick={() => onArticleClick(a.id, a.slug)} />
                : <NewsCard key={a.id} a={a} onClick={() => onArticleClick(a.id, a.slug)} />
        )}
    </div>
);

/* ─── HomePage (main export) ─────────────────────────── */
export interface HomePageProps {
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
        (async () => {
            try {
                const ref = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');

                // Hero
                let heroDoc: Article | null = null;
                const heroQ = query(ref, where('zoneAssignment', '==', 'A_Hero'), where('status', '==', 'published'), limit(1));
                const heroSnap = await getDocs(heroQ);
                if (!heroSnap.empty) {
                    heroDoc = { id: heroSnap.docs[0].id, ...heroSnap.docs[0].data() } as Article;
                } else {
                    const fallSnap = await getDocs(query(ref, where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(1)));
                    if (!fallSnap.empty) heroDoc = { id: fallSnap.docs[0].id, ...fallSnap.docs[0].data() } as Article;
                }
                setHero(heroDoc);

                // Feed
                const feedSnap = await getDocs(query(ref, where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(24)));
                const feed = feedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Article)).filter(a => a.id !== heroDoc?.id);

                setSidebar(feed.slice(0, 4));
                setGrid(feed.slice(4));

                setBreaking([
                    'Zimbabwe tames inflation below 10% — first time since 1997',
                    'ICC T20 World Cup: Zimbabwe advance to the Super Eight stage',
                    'Global climate summit reaches tentative emissions deal',
                    'Tech sector rally continues as AI chip demand surges',
                    'U.S. and Iran signal progress in third round of nuclear talks',
                ]);
            } catch (e) {
                console.error('HomePage fetch error:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="hp-spinner" />
            </div>
        );
    }

    return (
        <div className="hp-page">
            <BreakingBar items={breaking} />
            <div className="hp-content">
                <HeroSection hero={hero} sidebar={sidebar} onArticleClick={onArticleClick} />
                <SectionHeader label="Today's Stories" />
                <StoryGrid articles={grid} onArticleClick={onArticleClick} />
            </div>
        </div>
    );
};

export default HomePage;

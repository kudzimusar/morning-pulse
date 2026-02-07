import React, { useEffect, useState } from 'react';
import { Opinion } from '../../types';
import { subscribeToPublishedOpinions, getOpinionBySlug } from '../services/opinionsService';
import SEOHeader from './SEOHeader';
import ArticleFooter from './ArticleFooter';
import { trackArticleView, trackArticleEngagement } from '../services/analyticsService';
import { X, PenTool, Share2, Check, Heart, Lightbulb, ThumbsDown, MessageCircle } from 'lucide-react';
import { ShareButtons } from './AskPulseAI/ShareButtons';
import { getImageByTopic } from '../utils/imageGenerator';
import { 
  addReaction, 
  getUserReaction, 
  subscribeToOpinionReactions,
  getOpinionReactionCounts 
} from '../services/reactionsService';
import { 
  addPublicComment, 
  addEditorialReply,
  subscribeToOpinionComments,
  PublicComment 
} from '../services/publicCommentsService';
import { getCurrentEditor, getStaffRole, requireEditor } from '../services/authService';

interface OpinionFeedProps {
  onNavigateToSubmit?: () => void;
  slug?: string | null; // NEW: Slug for single opinion view
}

const OpinionFeed: React.FC<OpinionFeedProps> = ({ onNavigateToSubmit, slug }) => {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Latest');
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null);
  const [slugOpinion, setSlugOpinion] = useState<Opinion | null>(null); // NEW: Opinion loaded by slug
  const [slugNotFound, setSlugNotFound] = useState(false); // NEW: Track if slug lookup failed
  const [shareCopied, setShareCopied] = useState(false); // NEW: Track share link copy status (kept for compatibility)
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({ like: 0, love: 0, insightful: 0, disagree: 0, total: 0 });
  const [userReaction, setUserReaction] = useState<{ type: string } | null>(null);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentAuthorName, setCommentAuthorName] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isEditor, setIsEditor] = useState(false);
  const [editorName, setEditorName] = useState('');

  // NEW: Fetch single opinion by slug if provided
  useEffect(() => {
    if (!slug) {
      setSlugOpinion(null);
      setSlugNotFound(false);
      return;
    }

    setLoading(true);
    setSlugNotFound(false);
    
    getOpinionBySlug(slug)
      .then((opinion) => {
        if (opinion) {
          setSlugOpinion(opinion);
          setSelectedOpinion(opinion); // Auto-open the opinion
          // NEW: Update URL to canonical slug if needed
          if (opinion.slug && window.location.hash !== `#opinion/${opinion.slug}`) {
            window.history.replaceState(null, '', `#opinion/${opinion.slug}`);
          }
        } else {
          setSlugNotFound(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching opinion by slug:', err);
        setSlugNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    const unsubscribe = subscribeToPublishedOpinions(
      (fetched) => {
        setOpinions(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Opinion Fetch Error:", err);
        setLoading(false);
      }
    );
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const getDisplayImage = (opinion: Opinion) => {
    const fromDoc = opinion.finalImageUrl || opinion.suggestedImageUrl || opinion.imageUrl;
    
    // Filter out deprecated Unsplash URLs
    if (typeof fromDoc === 'string' && /^https?:\/\//i.test(fromDoc)) {
      // If it's an Unsplash URL (deprecated), use fallback
      if (fromDoc.includes('unsplash.com') || fromDoc.includes('source.unsplash.com')) {
        // Use a reliable placeholder instead
        return getImageByTopic(opinion.headline || '', opinion.id);
      }
      return fromDoc;
    }
    
    return getImageByTopic(opinion.headline || '', opinion.id);
  };

  // Share handler - uses static share page URL (not hash route)
  // Universal for ALL stories - no conditions
  const handleShare = async (opinion: Opinion) => {
    // Generate slug from headline if not present (for older stories)
    const slug = opinion.slug || (opinion.headline ? 
      opinion.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100) 
      : opinion.id);
    
    // Use folder structure (works better for bots) - fallback to share.html if needed
    const shareUrl = `https://kudzimusar.github.io/morning-pulse/shares/${slug}/`;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: opinion.headline || 'Morning Pulse Article',
          text: opinion.subHeadline || opinion.headline || 'Read this article on Morning Pulse',
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or error - fall through to clipboard
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link copied to clipboard!');
      } catch (clipboardErr) {
        console.error('Clipboard copy failed:', clipboardErr);
        alert(`Share this link: ${shareUrl}`);
      }
      document.body.removeChild(textArea);
    }
  };

  const categories = ['Latest', 'The Board', 'Guest Essays', 'Letters', 'Culture'];
  
  // Enhanced category filtering with proper mapping
  const filtered = activeCategory === 'Latest' 
    ? opinions 
    : opinions.filter(o => {
        const category = (o.category || '').toLowerCase();
        const writerType = (o.writerType || '').toLowerCase();
        
        if (activeCategory === 'The Board') {
          return category === 'the-board' || category === 'the board' || writerType === 'editorial';
        }
        if (activeCategory === 'Guest Essays') {
          return category === 'guest-essays' || category === 'guest essays' || writerType === 'guest essay';
        }
        if (activeCategory === 'Letters') {
          return category === 'letters' || category === 'letter';
        }
        if (activeCategory === 'Culture') {
          return category === 'culture' || category === 'cultural';
        }
        return false;
      });

  // Helper to get category display name and kicker style
  const getCategoryKicker = (opinion: Opinion) => {
    const category = (opinion.category || '').toLowerCase();
    const writerType = (opinion.writerType || '').toLowerCase();
    
    if (category === 'the-board' || category === 'the board' || writerType === 'editorial') {
      return { text: 'THE BOARD', style: { color: '#dc2626', fontWeight: '900' } };
    }
    if (category === 'guest-essays' || category === 'guest essays' || writerType === 'guest essay') {
      return { text: 'GUEST ESSAY', style: { color: '#2563eb', fontWeight: '700' } };
    }
    if (category === 'letters' || category === 'letter') {
      return { text: 'LETTER', style: { color: '#059669', fontWeight: '700' } };
    }
    if (category === 'culture' || category === 'cultural') {
      return { text: 'CULTURE', style: { color: '#7c3aed', fontWeight: '700' } };
    }
    return null;
  };

  // NEW: Track view when opinion is opened
  useEffect(() => {
    if (selectedOpinion) {
      try {
        // Track detailed article view in Google Analytics
        trackArticleView(
          selectedOpinion.id,
          selectedOpinion.headline,
          selectedOpinion.authorName,
          selectedOpinion.category
        );

        // Track engagement start
        trackArticleEngagement(selectedOpinion.id, 'start_reading', {
          source: 'opinion_feed',
          category: selectedOpinion.category
        });
      } catch (err) {
        // Silently fail analytics - don't block UI
        console.warn('Failed to track view:', err);
      }
    }
  }, [selectedOpinion]);

  // NEW: Subscribe to reactions for selected opinion
  useEffect(() => {
    if (!selectedOpinion) {
      setReactionCounts({ like: 0, love: 0, insightful: 0, disagree: 0, total: 0 });
      setUserReaction(null);
      return;
    }

    // Get initial reaction counts
    getOpinionReactionCounts(selectedOpinion.id).then(setReactionCounts);
    
    // Get user's reaction
    getUserReaction(selectedOpinion.id).then(reaction => {
      if (reaction) {
        setUserReaction({ type: reaction.type });
      } else {
        setUserReaction(null);
      }
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToOpinionReactions(selectedOpinion.id, async (reactions, counts) => {
      setReactionCounts(counts);
      
      // Update user reaction by checking current user
      const currentReaction = await getUserReaction(selectedOpinion.id);
      setUserReaction(currentReaction ? { type: currentReaction.type } : null);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedOpinion]);

  // NEW: Subscribe to comments for selected opinion
  useEffect(() => {
    if (!selectedOpinion) {
      setComments([]);
      return;
    }

    const unsubscribe = subscribeToOpinionComments(selectedOpinion.id, (fetchedComments) => {
      setComments(fetchedComments);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedOpinion]);

  // NEW: Check if current user is editor
  useEffect(() => {
    const checkEditorStatus = async () => {
      try {
        const currentUser = getCurrentEditor();
        if (currentUser) {
          const role = await getStaffRole(currentUser.uid);
          if (requireEditor(role)) {
            setIsEditor(true);
            // Get editor name from staff document
            try {
              const { getDoc, doc, getFirestore, getApp } = await import('firebase/firestore');
              const { initializeApp } = await import('firebase/app');
              const config = (window as any).__firebase_config || JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
              let app;
              try {
                app = getApp();
              } catch {
                app = initializeApp(config);
              }
              const db = getFirestore(app);
              const staffRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'staff', currentUser.uid);
              const staffSnap = await getDoc(staffRef);
              if (staffSnap.exists()) {
                setEditorName(staffSnap.data().name || 'Editor');
              }
            } catch (error) {
              console.warn('Could not fetch editor name:', error);
              setEditorName('Editor');
            }
          }
        }
      } catch (error) {
        console.warn('Could not check editor status:', error);
      }
    };
    
    checkEditorStatus();
  }, [selectedOpinion]);

  // NEW: Handle reaction click
  const handleReaction = async (type: 'like' | 'love' | 'insightful' | 'disagree') => {
    if (!selectedOpinion) return;
    
    try {
      await addReaction(selectedOpinion.id, type);
      
      // Track engagement analytics
      try {
        trackArticleEngagement(selectedOpinion.id, 'reaction', {
          reaction_type: type,
          source: 'opinion_feed'
        });
      } catch (analyticsError) {
        // Silently fail analytics - don't block UI
        console.warn('Failed to track reaction analytics:', analyticsError);
      }
      
      // The subscription will update the counts automatically
    } catch (error: any) {
      console.error('Failed to add reaction:', error);
      const errorMessage = error?.message || 'Failed to add reaction. Please try again.';
      if (errorMessage.includes('permission')) {
        alert('Permission denied. Please make sure you are signed in and Firestore rules allow reactions.');
      } else {
        alert(errorMessage);
      }
    }
  };

  // NEW: Handle comment submission
  const handleSubmitComment = async () => {
    if (!selectedOpinion || !commentText.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      if (replyingTo && isEditor) {
        // Editorial reply
        await addEditorialReply(
          selectedOpinion.id,
          replyingTo,
          replyText,
          editorName || 'Editorial Team'
        );
        setReplyText('');
        setReplyingTo(null);
      } else {
        // Regular comment
        await addPublicComment(
          selectedOpinion.id,
          commentText,
          commentAuthorName.trim() || 'Anonymous',
          replyingTo || undefined
        );
        setCommentText('');
        setCommentAuthorName('');
        setReplyingTo(null);
      }
      setShowComments(true); // Keep comments visible after submission
    } catch (error: any) {
      console.error('Failed to submit comment:', error);
      const errorMessage = error?.message || 'Failed to submit comment. Please try again.';
      if (errorMessage.includes('permission')) {
        alert('Permission denied. Please make sure you are signed in and Firestore rules allow comments.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // NEW: Organize comments with replies
  const organizeComments = (allComments: PublicComment[]): { root: PublicComment; replies: PublicComment[] }[] => {
    const rootComments = allComments.filter(c => !c.parentId);
    const repliesMap = new Map<string, PublicComment[]>();
    
    allComments.forEach(comment => {
      if (comment.parentId) {
        if (!repliesMap.has(comment.parentId)) {
          repliesMap.set(comment.parentId, []);
        }
        repliesMap.get(comment.parentId)!.push(comment);
      }
    });
    
    return rootComments.map(root => ({
      root,
      replies: repliesMap.get(root.id) || []
    }));
  };

  // NEW: Handle slug not found
  if (slugNotFound) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'serif' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#991b1b' }}>Opinion Not Found</h2>
        <p style={{ fontSize: '1.2rem', color: '#78716c', marginBottom: '24px' }}>
          The opinion you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => {
            window.location.hash = 'opinion';
            setSlugNotFound(false);
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← Back to Opinions
        </button>
      </div>
    );
  }

  if (loading && opinions.length === 0 && !slugOpinion) {
    return <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'serif', color: '#78716c' }}>Journalism in progress...</div>;
  }

  return (
    <div style={{ fontFamily: 'Georgia, serif', backgroundColor: '#fffdfa', minHeight: '100vh', color: '#1a1a1a' }}>
      {selectedOpinion && (
        <SEOHeader 
          story={{
            id: selectedOpinion.id,
            title: selectedOpinion.headline,
            summary: selectedOpinion.subHeadline,
            coverImage: getDisplayImage(selectedOpinion)
          }} 
        />
      )}
      
      {/* RESTORED NAVIGATION BAR */}
      <nav style={{ position: 'sticky', top: '56px', zIndex: 30, backgroundColor: '#fff', borderBottom: '1px solid #e7e5e4' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: activeCategory === cat ? '#991b1b' : '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <button 
            onClick={onNavigateToSubmit}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#000', color: '#fff', 
              fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', padding: '6px 12px', border: 'none', cursor: 'pointer' 
            }}
          >
            <PenTool size={12} /> <span className="hidden-mobile">Submit Essay</span>
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <style>{`
          .mag-grid { display: grid; grid-template-columns: 1fr; gap: 40px; }
          @media (min-width: 1024px) {
            .mag-grid { grid-template-columns: repeat(12, 1fr); }
            .main-col { grid-column: span 8; }
            .side-col { grid-column: span 4; border-left: 1px solid #e7e5e4; padding-left: 32px; }
            .hidden-mobile { display: inline !important; }
          }
          @media (max-width: 600px) { .hidden-mobile { display: none; } }
          .drop-cap::first-letter { float: left; font-size: 5rem; line-height: 0.8; padding-right: 12px; font-weight: 900; }
        `}</style>

        <div className="mag-grid">
          <div className="main-col">
            {filtered[0] && (
              <article 
                onClick={() => {
                  setSelectedOpinion(filtered[0]);
                  // NEW: Update URL with slug
                  if (filtered[0].slug) {
                    window.history.pushState(null, '', `#opinion/${filtered[0].slug}`);
                  }
                }} 
                style={{ cursor: 'pointer', marginBottom: '60px' }}
              >
                <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f5f5f4', marginBottom: '24px' }}>
                  <img
                    src={getDisplayImage(filtered[0])}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                {/* Kicker (Category Label) */}
                {getCategoryKicker(filtered[0]) && (
                  <div style={{
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                    ...getCategoryKicker(filtered[0])!.style
                  }}>
                    {getCategoryKicker(filtered[0])!.text}
                  </div>
                )}
                <h1 style={{ 
                  fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
                  fontWeight: '900', 
                  lineHeight: '0.95', 
                  letterSpacing: '-0.04em',
                  // Editorial styling for "The Board"
                  ...(getCategoryKicker(filtered[0])?.text === 'THE BOARD' ? {
                    fontFamily: '"Times New Roman", serif',
                    fontStyle: 'italic'
                  } : {})
                }}>{filtered[0].headline}</h1>
                <p style={{ fontSize: '1.4rem', color: '#57534e', fontStyle: 'italic', margin: '16px 0' }}>{filtered[0].subHeadline}</p>
                {/* NEW: Enhanced byline with date for E-E-A-T */}
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '13px',
                  color: '#44403c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  <span>By {filtered[0].authorName}</span>
                  {filtered[0].publishedAt && (
                    <>
                      <span style={{ color: '#a8a29e' }}>•</span>
                      <span style={{ color: '#78716c' }}>
                        {filtered[0].publishedAt.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </>
                  )}
                </div>
              </article>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', borderTop: '4px solid #000', paddingTop: '32px' }}>
              {filtered.slice(1, 5).map((op, i) => (
                <article 
                  key={op.id} 
                  onClick={() => {
                    setSelectedOpinion(op);
                    // NEW: Update URL with slug
                    if (op.slug) {
                      window.history.pushState(null, '', `#opinion/${op.slug}`);
                    }
                  }} 
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f5f5f4', marginBottom: '12px' }}>
                    <img
                      src={getDisplayImage(op)}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  {/* Kicker for secondary articles */}
                  {getCategoryKicker(op) && (
                    <div style={{
                      fontSize: '9px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      ...getCategoryKicker(op)!.style
                    }}>
                      {getCategoryKicker(op)!.text}
                    </div>
                  )}
                  <h3 style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: '900', 
                    lineHeight: '1.2',
                    // Editorial styling for "The Board"
                    ...(getCategoryKicker(op)?.text === 'THE BOARD' ? {
                      fontFamily: '"Times New Roman", serif',
                      fontStyle: 'italic'
                    } : {})
                  }}>{op.headline}</h3>
                  {/* NEW: Enhanced metadata with author and date */}
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#78716c', 
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#44403c' }}>{op.authorName}</span>
                    {op.publishedAt && (
                      <>
                        <span style={{ color: '#d6d3d1' }}>•</span>
                        <span>
                          {op.publishedAt.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="side-col">
            <h2 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '24px' }}>The Board</h2>
            {filtered.slice(5).map(op => (
              <div 
                key={op.id} 
                onClick={() => {
                  setSelectedOpinion(op);
                  // NEW: Update URL with slug
                  if (op.slug) {
                    window.history.pushState(null, '', `#opinion/${op.slug}`);
                  }
                }} 
                style={{ cursor: 'pointer', borderBottom: '1px solid #f5f5f4', paddingBottom: '16px', marginBottom: '16px' }}
              >
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '6px' }}>{op.headline}</h4>
                {/* NEW: Enhanced metadata */}
                <div style={{ 
                  fontSize: '10px', 
                  color: '#78716c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontWeight: '600', color: '#44403c' }}>{op.authorName}</span>
                  {op.publishedAt && (
                    <>
                      <span style={{ color: '#d6d3d1' }}>•</span>
                      <span>
                        {op.publishedAt.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </main>

      {/* FULL ESSAY MODAL */}
      {selectedOpinion && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: '#fffdfa', overflowY: 'auto' }}>
          <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <button 
              onClick={() => {
                setSelectedOpinion(null);
                // NEW: Clear slug from URL when closing
                window.history.pushState(null, '', '#opinion');
              }} 
              style={{ position: 'fixed', top: '20px', right: '20px', background: '#000', color: '#fff', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', zIndex: 1001 }}
            >
              <X size={24} />
            </button>
            <header style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ color: '#991b1b', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', marginBottom: '20px' }}>{selectedOpinion.category}</div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', fontWeight: '900', lineHeight: '0.95', marginBottom: '24px' }}>{selectedOpinion.headline}</h1>
              {/* NEW: Enhanced byline with date and title for E-E-A-T */}
              <div style={{ 
                fontSize: '14px',
                color: '#44403c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '16px'
              }}>
                <span style={{ fontWeight: '700' }}>By {selectedOpinion.authorName}</span>
                {selectedOpinion.publishedAt && (
                  <>
                    <span style={{ color: '#d6d3d1' }}>•</span>
                    <span style={{ color: '#78716c' }}>
                      {selectedOpinion.publishedAt.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </>
                )}
              </div>
              {/* NEW: Canonical URL display for SEO */}
              {selectedOpinion.slug && (
                <div style={{
                  marginTop: '12px',
                  fontSize: '11px',
                  color: '#a8a29e',
                  fontFamily: 'monospace'
                }}>
                  morningpulse.com/opinion/{selectedOpinion.slug}
                </div>
              )}
            </header>
            <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f5f5f4', marginBottom: '40px' }}>
              <img
                src={getDisplayImage(selectedOpinion)}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div className="drop-cap mobile-article-body" style={{ fontSize: '1.3rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: selectedOpinion.body }} />
            
            {/* Article Footer with Related Links */}
            <ArticleFooter
              article={{
                id: selectedOpinion.id,
                headline: selectedOpinion.headline,
                detail: selectedOpinion.subHeadline || '',
                category: selectedOpinion.category || 'Opinion',
                source: selectedOpinion.authorName || 'Editorial Team',
                timestamp: selectedOpinion.publishedAt?.getTime() || selectedOpinion.submittedAt.getTime() || Date.now(),
                imageUrl: selectedOpinion.finalImageUrl || selectedOpinion.suggestedImageUrl || selectedOpinion.imageUrl,
                url: selectedOpinion.slug ? `#opinion/${selectedOpinion.slug}` : undefined,
              }}
              relatedArticles={opinions
                .filter(op => op.id !== selectedOpinion.id && op.category === selectedOpinion.category)
                .slice(0, 3)
                .map(op => ({
                  id: op.id,
                  headline: op.headline,
                  detail: op.subHeadline || '',
                  category: op.category || 'Opinion',
                  source: op.authorName || 'Editorial Team',
                  timestamp: op.publishedAt?.getTime() || op.submittedAt.getTime() || Date.now(),
                  imageUrl: op.finalImageUrl || op.suggestedImageUrl || op.imageUrl,
                  url: op.slug ? `#opinion/${op.slug}` : undefined,
                }))}
              authorBio={`${selectedOpinion.authorName} is a contributor to Morning Pulse.`}
            />
            
            {/* NEW: Reactions Section */}
            <div style={{ 
              marginTop: '60px', 
              paddingTop: '30px', 
              borderTop: '1px solid #e7e5e4',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                What do you think?
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => handleReaction('like')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    backgroundColor: userReaction?.type === 'like' ? '#2563eb' : '#f3f4f6',
                    color: userReaction?.type === 'like' ? '#fff' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Heart size={16} fill={userReaction?.type === 'like' ? '#fff' : 'none'} />
                  Like {reactionCounts.like > 0 && `(${reactionCounts.like})`}
                </button>
                <button
                  onClick={() => handleReaction('love')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    backgroundColor: userReaction?.type === 'love' ? '#dc2626' : '#f3f4f6',
                    color: userReaction?.type === 'love' ? '#fff' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Heart size={16} fill={userReaction?.type === 'love' ? '#fff' : 'none'} />
                  Love {reactionCounts.love > 0 && `(${reactionCounts.love})`}
                </button>
                <button
                  onClick={() => handleReaction('insightful')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    backgroundColor: userReaction?.type === 'insightful' ? '#f59e0b' : '#f3f4f6',
                    color: userReaction?.type === 'insightful' ? '#fff' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Lightbulb size={16} />
                  Insightful {reactionCounts.insightful > 0 && `(${reactionCounts.insightful})`}
                </button>
                <button
                  onClick={() => handleReaction('disagree')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    backgroundColor: userReaction?.type === 'disagree' ? '#6b7280' : '#f3f4f6',
                    color: userReaction?.type === 'disagree' ? '#fff' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ThumbsDown size={16} />
                  Disagree {reactionCounts.disagree > 0 && `(${reactionCounts.disagree})`}
                </button>
              </div>
            </div>

            {/* NEW: Comments Section */}
            <div style={{ 
              marginTop: '40px', 
              paddingTop: '30px', 
              borderTop: '1px solid #e7e5e4'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                  Comments ({comments.length})
                </h3>
                <button
                  onClick={() => setShowComments(!showComments)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: '#78716c',
                    border: '1px solid #e7e5e4',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <MessageCircle size={16} />
                  {showComments ? 'Hide' : 'Show'} Comments
                </button>
              </div>

              {showComments && (
                <>
                  {/* Comment Form */}
                  {!replyingTo && (
                    <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      {!isEditor && (
                        <input
                          type="text"
                          placeholder="Your name (optional)"
                          value={commentAuthorName}
                          onChange={(e) => setCommentAuthorName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      <textarea
                        placeholder={isEditor ? "Write a response as editorial team..." : "Write a comment..."}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '10px',
                          marginBottom: '10px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      <button
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim() || isSubmittingComment}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: commentText.trim() ? '#000' : '#9ca3af',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: commentText.trim() ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {isSubmittingComment ? 'Posting...' : isEditor ? 'Post Editorial Response' : 'Post Comment'}
                      </button>
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo && (
                    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                      <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#92400e' }}>
                        {isEditor ? 'Replying as Editorial Team' : 'Replying to comment'}
                      </div>
                      <textarea
                        placeholder={isEditor ? "Write your response..." : "Write a reply..."}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '10px',
                          marginBottom: '10px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleSubmitComment}
                          disabled={!replyText.trim() || isSubmittingComment}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: replyText.trim() ? '#000' : '#9ca3af',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: replyText.trim() ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {isSubmittingComment ? 'Posting...' : 'Post Reply'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            color: '#78716c',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comments List with Threading */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {comments.length === 0 ? (
                      <p style={{ color: '#78716c', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    ) : (
                      organizeComments(comments).map(({ root, replies }) => (
                        <div key={root.id}>
                          {/* Root Comment */}
                          <div style={{ 
                            padding: '16px', 
                            backgroundColor: root.isEditorialReply ? '#fef3c7' : '#f9fafb', 
                            borderRadius: '8px',
                            borderLeft: root.isEditorialReply ? '4px solid #f59e0b' : 'none'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                              <div>
                                <strong style={{ 
                                  fontSize: '14px', 
                                  color: root.isEditorialReply ? '#92400e' : '#1a1a1a' 
                                }}>
                                  {root.authorName}
                                  {root.isEditorialReply && (
                                    <span style={{ 
                                      marginLeft: '8px', 
                                      fontSize: '11px', 
                                      backgroundColor: '#fbbf24', 
                                      color: '#78350f',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: '600'
                                    }}>
                                      EDITORIAL
                                    </span>
                                  )}
                                </strong>
                                <span style={{ fontSize: '12px', color: '#78716c', marginLeft: '8px' }}>
                                  {root.createdAt.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                              {root.content}
                            </p>
                            <button
                              onClick={() => {
                                setReplyingTo(root.id);
                                setReplyText('');
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'transparent',
                                color: '#78716c',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              {isEditor ? 'Reply as Editorial Team' : 'Reply'}
                            </button>
                          </div>
                          
                          {/* Replies */}
                          {replies.length > 0 && (
                            <div style={{ marginLeft: '32px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {replies.map((reply) => (
                                <div key={reply.id} style={{ 
                                  padding: '12px', 
                                  backgroundColor: reply.isEditorialReply ? '#fef3c7' : '#ffffff', 
                                  borderRadius: '6px',
                                  borderLeft: reply.isEditorialReply ? '3px solid #f59e0b' : '3px solid #e5e7eb'
                                }}>
                                  <div style={{ marginBottom: '6px' }}>
                                    <strong style={{ 
                                      fontSize: '13px', 
                                      color: reply.isEditorialReply ? '#92400e' : '#1a1a1a' 
                                    }}>
                                      {reply.authorName}
                                      {reply.isEditorialReply && (
                                        <span style={{ 
                                          marginLeft: '6px', 
                                          fontSize: '10px', 
                                          backgroundColor: '#fbbf24', 
                                          color: '#78350f',
                                          padding: '1px 4px',
                                          borderRadius: '3px',
                                          fontWeight: '600'
                                        }}>
                                          EDITORIAL
                                        </span>
                                      )}
                                    </strong>
                                    <span style={{ fontSize: '11px', color: '#78716c', marginLeft: '6px' }}>
                                      {reply.createdAt.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#374151', whiteSpace: 'pre-wrap' }}>
                                    {reply.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* NEW: Share Section at bottom of article */}
            <div style={{ 
              marginTop: '40px', 
              paddingTop: '30px', 
              borderTop: '1px solid #e7e5e4',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Share this perspective
              </p>
              <ShareButtons
                article={{
                  id: selectedOpinion.id,
                  title: selectedOpinion.headline,
                  url: selectedOpinion.slug ? `/opinion/${selectedOpinion.slug}` : `#opinion/${selectedOpinion.id}`,
                  excerpt: selectedOpinion.subHeadline,
                }}
                compact={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpinionFeed;

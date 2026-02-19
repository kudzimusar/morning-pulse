import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, auth, db } from '../services/firebase'; // Ensure these are exported from your firebase config
import { doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Sparkles, Sun, RefreshCw, ChevronRight } from 'lucide-react';

interface BriefPoint {
    emoji: string;
    headline: string;
    text: string;
}

interface BriefContent {
    greeting: string;
    summary: string;
    points: BriefPoint[];
    closing: string;
}

interface BriefData {
    id: string;
    date: string;
    content: BriefContent;
}

interface MorningBriefCardProps {
    variant?: 'default' | 'column'; // NEW: Support for column (sidebar) layout
}

const MorningBriefCard: React.FC<MorningBriefCardProps> = ({ variant = 'default' }) => {
    const [user, loadingAuth] = useAuthState(auth);
    const [brief, setBrief] = useState<BriefData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            checkExistingBrief();
        }
    }, [user]);

    const checkExistingBrief = async () => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        try {
            // Check Firestore directly first for speed
            const docRef = doc(db, 'users', user.uid, 'briefs', today);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setBrief(docSnap.data() as BriefData);
            }
        } catch (err) {
            console.error("Error checking brief:", err);
        }
    };

    const handleGenerateBrief = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const generateDailyBrief = httpsCallable(functions, 'generateDailyBrief');
            const result = await generateDailyBrief();
            const data = result.data as { success: boolean, brief: BriefData };

            if (data.success) {
                setBrief(data.brief);
            }
        } catch (err: any) {
            console.error("Error generating brief:", err);
            setError("Failed to generate your brief. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loadingAuth || !user) {
        // Optional: Show a teaser for non-logged-in users?
        return null;
    }

    // COLUMN LAYOUT (Left Rail) - Premium Style
    if (variant === 'column') {
        if (brief) {
            return (
                <div className="brief-card-styled mp-card-hover" style={{ height: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--mp-brand-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: '14px' }}>⚡</span>
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--mp-ink)', margin: 0 }}>
                            Your Briefing
                        </h3>
                    </div>

                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--mp-slate)', marginBottom: '16px' }}>
                        <p style={{ marginBottom: '8px', fontWeight: '500' }}>{brief.content.greeting}</p>
                        <p>{brief.content.summary}</p>
                    </div>

                    <button style={{
                        fontSize: '13px',
                        color: 'var(--mp-brand-blue)',
                        fontWeight: '600',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                    }}>
                        Read Full Brief <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                    </button>
                </div>
            );
        }

        // Column teaser - Premium Style
        return (
            <div className="brief-card-styled mp-card-hover" style={{ height: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ marginBottom: '12px' }}>
                    <Sun size={28} color="var(--mp-brand-gold)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--mp-ink)', marginBottom: '8px' }}>
                    Your Morning Brief
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--mp-gray)', marginBottom: '16px', lineHeight: '1.4' }}>
                    Get a personalized AI summary of today's top stories.
                </p>
                <button
                    onClick={handleGenerateBrief}
                    disabled={loading}
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--mp-ink)',
                        color: 'var(--mp-white)',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: loading ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {loading ? 'Creating...' : 'Create Brief'}
                </button>
            </div>
        );
    }

    if (brief) {
        return (
            <div style={{
                backgroundColor: '#fffdfa',
                border: '1px solid #e7e5e4',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '40px',
                maxWidth: '800px',
                margin: '0 auto 40px auto',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f5f5f4', paddingBottom: '16px' }}>
                    <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '50%' }}>
                        <Sun size={24} color="#d97706" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, fontFamily: '"Times New Roman", serif' }}>
                            Your Morning Brief
                        </h3>
                        <p style={{ fontSize: '12px', color: '#78716c', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#1c1917', marginBottom: '8px' }}>
                        {brief.content.greeting}
                    </p>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#44403c' }}>
                        {brief.content.summary}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {brief.content.points.map((point, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                            <span style={{ fontSize: '20px', marginTop: '2px' }}>{point.emoji}</span>
                            <div>
                                <strong style={{ fontSize: '14px', color: '#1c1917', display: 'block', marginBottom: '4px' }}>
                                    {point.headline}
                                </strong>
                                <span style={{ fontSize: '14px', color: '#57534e', lineHeight: '1.5' }}>
                                    {point.text}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f5f5f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#1c1917', fontWeight: '500', fontStyle: 'italic' }}>
                        {brief.content.closing}
                    </p>
                    <button
                        onClick={handleGenerateBrief}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', color: '#78716c', background: 'none', border: 'none', cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={12} /> Regenerate
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: '#fafaf9',
            border: '1px dashed #d6d3d1',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '40px',
            maxWidth: '800px',
            margin: '0 auto 40px auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
        }}>
            <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Sparkles size={24} color="#000" />
            </div>
            <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                    Get Your Personalized Briefing
                </h3>
                <p style={{ fontSize: '14px', color: '#57534e', maxWidth: '400px', lineHeight: '1.5' }}>
                    Our AI editor can analyze your reading history and today's top stories to create a custom summary just for you.
                </p>
            </div>

            {error && (
                <div style={{ color: '#ef4444', fontSize: '13px', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                    {error}
                </div>
            )}

            <button
                onClick={handleGenerateBrief}
                disabled={loading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: '24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s'
                }}
            >
                {loading ? (
                    <>
                        <RefreshCw size={16} className="animate-spin" /> Preparing your brief...
                    </>
                ) : (
                    <>
                        Generate Morning Brief <ChevronRight size={16} />
                    </>
                )}
            </button>
        </div>
    );
};

export default MorningBriefCard;

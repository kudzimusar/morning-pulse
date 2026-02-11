/**
 * Published Content Tab
 * Manage published articles - search, filter, edit, unpublish, content audit (SEO)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { Opinion } from '../../../types';
import './AdminDashboard.css';

const APP_ID = "morning-pulse-app";

/** SEO audit flags per article (client-side) */
export type AuditFilter = 'all' | 'seo_issues' | 'missing_slug' | 'missing_summary' | 'short_headline' | 'long_headline' | 'missing_category' | 'no_image';

export interface SEOAuditFlags {
  missingSlug: boolean;
  missingSummary: boolean;
  shortHeadline: boolean;
  longHeadline: boolean;
  missingCategory: boolean;
  noImage: boolean;
  hasAnyIssue: boolean;
}

const HEADLINE_MIN = 30;
const HEADLINE_MAX = 70;

function getSEOAuditFlags(op: Opinion & { headline?: string }): SEOAuditFlags {
  const title = (op.headline ?? op.title ?? '').trim();
  const missingSlug = !op.slug || op.slug.length < 3;
  const missingSummary = !(op.summary && op.summary.trim().length > 0);
  const shortHeadline = title.length > 0 && title.length < HEADLINE_MIN;
  const longHeadline = title.length > HEADLINE_MAX;
  const missingCategory = !(op.category && op.category.trim().length > 0);
  const noImage = !op.image || op.image.trim().length === 0;
  const hasAnyIssue = missingSlug || missingSummary || shortHeadline || longHeadline || missingCategory || noImage;
  return { missingSlug, missingSummary, shortHeadline, longHeadline, missingCategory, noImage, hasAnyIssue };
}

interface PublishedContentTabProps {
  firebaseInstances: { auth: any; db: Firestore } | null;
  userRoles: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const PublishedContentTab: React.FC<PublishedContentTabProps> = ({
  firebaseInstances,
  userRoles,
  showToast,
}) => {
  const [publishedOpinions, setPublishedOpinions] = useState<Opinion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [auditFilter, setAuditFilter] = useState<AuditFilter>('all');

  useEffect(() => {
    if (!firebaseInstances) return;

    const { db } = firebaseInstances;
    const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
    const q = query(opinionsRef);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const opinions: Opinion[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const opinion = {
            id: docSnap.id,
            ...data,
            submittedAt: data.submittedAt?.toDate?.() || new Date(),
            publishedAt: data.publishedAt?.toDate?.() || null,
          } as Opinion;
          
          if (opinion.status === 'published') {
            opinions.push(opinion);
          }
        });
        
        opinions.sort((a, b) => {
          const timeA = a.publishedAt?.getTime() || 0;
          const timeB = b.publishedAt?.getTime() || 0;
          return timeB - timeA;
        });
        
        setPublishedOpinions(opinions);
      },
      (error) => {
        console.error('Error subscribing to published opinions:', error);
      }
    );

    return () => unsubscribe();
  }, [firebaseInstances]);

  const handleUnpublish = async (opinionId: string) => {
    if (!firebaseInstances) return;
    
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to unpublish this article?')) {
      return;
    }

    try {
      const { db } = firebaseInstances;
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', opinionId);
      
      await updateDoc(opinionRef, {
        status: 'pending',
        isPublished: false,
        updatedAt: serverTimestamp(),
      });
      
      showToast('Article unpublished', 'success');
    } catch (error: any) {
      console.error('Unpublish error:', error);
      showToast(`Unpublish failed: ${error.message}`, 'error');
    }
  };

  const opinionsWithAudit = useMemo(() => {
    return publishedOpinions.map(op => ({ op, flags: getSEOAuditFlags(op as Opinion & { headline?: string }) }));
  }, [publishedOpinions]);

  const auditSummary = useMemo(() => {
    let missingSlug = 0, missingSummary = 0, shortHeadline = 0, longHeadline = 0, missingCategory = 0, noImage = 0, seoIssues = 0;
    opinionsWithAudit.forEach(({ flags }) => {
      if (flags.missingSlug) missingSlug++;
      if (flags.missingSummary) missingSummary++;
      if (flags.shortHeadline) shortHeadline++;
      if (flags.longHeadline) longHeadline++;
      if (flags.missingCategory) missingCategory++;
      if (flags.noImage) noImage++;
      if (flags.hasAnyIssue) seoIssues++;
    });
    return { missingSlug, missingSummary, shortHeadline, longHeadline, missingCategory, noImage, seoIssues };
  }, [opinionsWithAudit]);

  const filteredOpinions = useMemo(() => {
    return opinionsWithAudit
      .filter(({ op }) => {
        const matchesSearch = !searchTerm ||
          (op.headline ?? (op as any).title)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (op as any).authorName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || op.category === filterCategory;
        const matchesAuthor = !filterAuthor || (op as any).authorName === filterAuthor;
        return matchesSearch && matchesCategory && matchesAuthor;
      })
      .filter(({ flags }) => {
        if (auditFilter === 'all') return true;
        if (auditFilter === 'seo_issues') return flags.hasAnyIssue;
        if (auditFilter === 'missing_slug') return flags.missingSlug;
        if (auditFilter === 'missing_summary') return flags.missingSummary;
        if (auditFilter === 'short_headline') return flags.shortHeadline;
        if (auditFilter === 'long_headline') return flags.longHeadline;
        if (auditFilter === 'missing_category') return flags.missingCategory;
        if (auditFilter === 'no_image') return flags.noImage;
        return true;
      })
      .map(({ op }) => op);
  }, [opinionsWithAudit, searchTerm, filterCategory, filterAuthor, auditFilter]);

  const categories = Array.from(new Set(publishedOpinions.map(op => op.category).filter(Boolean)));
  const authors = Array.from(new Set(publishedOpinions.map(op => (op as any).authorName).filter(Boolean)));

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Published Content ({publishedOpinions.length})</h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
          Manage and audit published articles. Use Content audit to find SEO gaps.
        </p>
      </div>

      {/* Audit summary */}
      {auditSummary.seoIssues > 0 && (
        <div className="admin-card" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--admin-text-main)' }}>Content audit:</span>
          {auditSummary.missingSlug > 0 && <span style={{ fontSize: '12px', color: 'var(--admin-warning)' }}>{auditSummary.missingSlug} missing slug</span>}
          {auditSummary.missingSummary > 0 && <span style={{ fontSize: '12px', color: 'var(--admin-warning)' }}>{auditSummary.missingSummary} missing summary</span>}
          {auditSummary.shortHeadline > 0 && <span style={{ fontSize: '12px', color: 'var(--admin-warning)' }}>{auditSummary.shortHeadline} short headline</span>}
          {auditSummary.longHeadline > 0 && <span style={{ fontSize: '12px', color: 'var(--admin-warning)' }}>{auditSummary.longHeadline} long headline</span>}
          {auditSummary.missingCategory > 0 && <span style={{ fontSize: '12px', color: 'var(--admin-warning)' }}>{auditSummary.missingCategory} missing category</span>}
          {auditSummary.noImage > 0 && <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{auditSummary.noImage} no image</span>}
          <button
            type="button"
            className="admin-button admin-button-secondary"
            style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '12px' }}
            onClick={() => setAuditFilter('seo_issues')}
          >
            Show {auditSummary.seoIssues} with issues
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="admin-input"
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select className="admin-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ width: '160px' }}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select className="admin-input" value={filterAuthor} onChange={(e) => setFilterAuthor(e.target.value)} style={{ width: '160px' }}>
          <option value="">All Authors</option>
          {authors.map(author => (
            <option key={author} value={author}>{author}</option>
          ))}
        </select>
        <select className="admin-input" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value as AuditFilter)} style={{ width: '200px' }}>
          <option value="all">All articles</option>
          <option value="seo_issues">SEO issues only</option>
          <option value="missing_slug">Missing slug</option>
          <option value="missing_summary">Missing summary</option>
          <option value="short_headline">Short headline (&lt;{HEADLINE_MIN})</option>
          <option value="long_headline">Long headline (&gt;{HEADLINE_MAX})</option>
          <option value="missing_category">Missing category</option>
          <option value="no_image">No image</option>
        </select>
      </div>

      {/* Articles List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredOpinions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            No published articles found
          </div>
        ) : (
          filteredOpinions.map((opinion) => {
            const headline = (opinion as any).headline ?? opinion.title;
            const authorName = (opinion as any).authorName ?? opinion.author;
            return (
              <div key={opinion.id} className="admin-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--admin-text-main)' }}>
                      {headline || 'Untitled'}
                    </h3>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>
                      {authorName} {opinion.category && `• ${opinion.category}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                      Published: {opinion.publishedAt?.toLocaleDateString() || 'Unknown'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="admin-button admin-button-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        window.location.hash = '#dashboard?tab=editorial-queue&article=' + opinion.id;
                      }}
                    >
                      Edit Image & Content
                    </button>
                    <button
                      type="button"
                      className="admin-button"
                      style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#b91c1c' }}
                      onClick={() => handleUnpublish(opinion.id)}
                    >
                      Unpublish
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PublishedContentTab;

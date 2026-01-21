/**
 * Published Content Tab
 * Manage published articles - search, filter, edit, unpublish
 */

import React, { useEffect, useState } from 'react';
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
import { superAdminMediaOverride } from '../../services/opinionsService';
import { getCurrentEditor } from '../../services/authService';

const APP_ID = "morning-pulse-app";

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
  
  // Super Admin Media Override state
  const [overrideModal, setOverrideModal] = useState<{
    open: boolean;
    articleId: string | null;
    articleHeadline: string;
  }>({ open: false, articleId: null, articleHeadline: '' });
  const [overrideFile, setOverrideFile] = useState<File | null>(null);
  const [overrideUploading, setOverrideUploading] = useState(false);

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

  const handleOverrideImage = async () => {
    if (!overrideModal.articleId || !overrideFile) return;

    const currentEditor = getCurrentEditor();
    if (!currentEditor) {
      showToast('Not authenticated', 'error');
      return;
    }

    // Check super_admin role
    if (!userRoles.includes('super_admin')) {
      showToast('Unauthorized: Super Admin role required', 'error');
      return;
    }

    setOverrideUploading(true);

    try {
      await superAdminMediaOverride(
        overrideModal.articleId,
        overrideFile,
        currentEditor.uid,
        currentEditor.displayName || currentEditor.email || 'Super Admin'
      );

      showToast('Image replaced successfully. Changes are live immediately.', 'success');
      setOverrideModal({ open: false, articleId: null, articleHeadline: '' });
      setOverrideFile(null);
    } catch (error: any) {
      console.error('Override error:', error);
      showToast(`Override failed: ${error.message}`, 'error');
    } finally {
      setOverrideUploading(false);
    }
  };

  const filteredOpinions = publishedOpinions.filter(op => {
    const matchesSearch = !searchTerm || 
      op.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || op.category === filterCategory;
    const matchesAuthor = !filterAuthor || op.authorName === filterAuthor;
    return matchesSearch && matchesCategory && matchesAuthor;
  });

  const categories = Array.from(new Set(publishedOpinions.map(op => op.category).filter(Boolean)));
  const authors = Array.from(new Set(publishedOpinions.map(op => op.authorName).filter(Boolean)));

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        Published Content ({publishedOpinions.length})
      </h2>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterAuthor}
          onChange={(e) => setFilterAuthor(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">All Authors</option>
          {authors.map(author => (
            <option key={author} value={author}>{author}</option>
          ))}
        </select>
      </div>

      {/* Articles List */}
      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {filteredOpinions.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#999'
          }}>
            No published articles found
          </div>
        ) : (
          filteredOpinions.map((opinion) => (
            <div
              key={opinion.id}
              style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fff'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {opinion.headline}
                  </h3>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    {opinion.authorName} {opinion.category && `• ${opinion.category}`}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    Published: {opinion.publishedAt?.toLocaleDateString() || 'Unknown'}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  {/* Super Admin Override Button - Only visible to super_admin */}
                  {userRoles.includes('super_admin') && (
                    <button
                      onClick={() => {
                        setOverrideModal({
                          open: true,
                          articleId: opinion.id,
                          articleHeadline: opinion.headline || 'Unknown'
                        });
                        setOverrideFile(null);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                      title="Super Admin: Replace image instantly (overrides current live image)"
                    >
                      🔄 Override Image
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleUnpublish(opinion.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Unpublish
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Super Admin Override Modal */}
      {overrideModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '700',
              color: '#dc2626'
            }}>
              ⚠️ Super Admin Media Override
            </h3>
            
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#333'
            }}>
              <strong>Article:</strong> {overrideModal.articleHeadline}
            </p>
            
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <p style={{
                margin: '0',
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#991b1b'
              }}>
                <strong>⚠️ Warning:</strong> This will immediately replace the current live image 
                across the entire website. The change is instant and visible to all readers. 
                This action is logged in the audit trail.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#333'
              }}>
                Select New Image (Recommended: 2000×1125, 16:9, Max 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      showToast('Image too large. Max file size is 5MB.', 'error');
                      return;
                    }
                    setOverrideFile(file);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              {overrideFile && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Selected: {overrideFile.name} ({(overrideFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setOverrideModal({ open: false, articleId: null, articleHeadline: '' });
                  setOverrideFile(null);
                }}
                disabled={overrideUploading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#333',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: overrideUploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideImage}
                disabled={!overrideFile || overrideUploading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: overrideFile && !overrideUploading ? '#dc2626' : '#fca5a5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: overrideFile && !overrideUploading ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {overrideUploading ? 'Uploading...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedContentTab;

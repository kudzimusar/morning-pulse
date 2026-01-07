/**
 * Editorial Queue Tab
 * Split-screen editor for reviewing and publishing articles
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
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  FirebaseStorage
} from 'firebase/storage';
import { getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { Opinion } from '../../../types';
import { getUIStatusLabel, getDbStatus, UIStatusLabel } from '../../utils/opinionStatus';

const APP_ID = "morning-pulse-app";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

interface EditorialQueueTabProps {
  firebaseInstances: { auth: any; db: Firestore } | null;
  userRoles: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const EditorialQueueTab: React.FC<EditorialQueueTabProps> = ({
  firebaseInstances,
  userRoles,
  showToast,
}) => {
  const [pendingOpinions, setPendingOpinions] = useState<Opinion[]>([]);
  const [selectedOpinionId, setSelectedOpinionId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubHeadline, setEditedSubHeadline] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedAuthorName, setEditedAuthorName] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [status, setStatus] = useState<UIStatusLabel>('Submitted');
  const [suggestedImageUrl, setSuggestedImageUrl] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Subscribe to pending opinions
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
          
          if (opinion.status === 'pending') {
            opinions.push(opinion);
          }
        });
        
        opinions.sort((a, b) => {
          const timeA = a.submittedAt?.getTime() || 0;
          const timeB = b.submittedAt?.getTime() || 0;
          return timeB - timeA;
        });
        
        setPendingOpinions(opinions);
      },
      (error) => {
        console.error('Error subscribing to opinions:', error);
        showToast('Failed to load pending opinions', 'error');
      }
    );

    return () => unsubscribe();
  }, [firebaseInstances, showToast]);

  // Load selected opinion
  useEffect(() => {
    if (!selectedOpinionId) {
      setEditedTitle('');
      setEditedSubHeadline('');
      setEditedBody('');
      setEditedAuthorName('');
      setEditorNotes('');
      setStatus('Submitted');
      setSuggestedImageUrl(null);
      setFinalImageUrl(null);
      return;
    }

    const opinion = pendingOpinions.find(op => op.id === selectedOpinionId);
    if (opinion) {
      setEditedTitle(opinion.headline || '');
      setEditedSubHeadline(opinion.subHeadline || '');
      setEditedBody(opinion.body || '');
      setEditedAuthorName(opinion.authorName || '');
      setEditorNotes(opinion.editorNotes || '');
      setStatus(getUIStatusLabel(opinion.status || 'pending') as UIStatusLabel);
      setSuggestedImageUrl(opinion.suggestedImageUrl || opinion.imageUrl || null);
      setFinalImageUrl(opinion.finalImageUrl || null);
    }
  }, [selectedOpinionId, pendingOpinions]);

  const handleImageUpload = async (file: File) => {
    if (!selectedOpinionId || !firebaseInstances) return;
    
    if (file.size > MAX_IMAGE_BYTES) {
      showToast('Image too large (max 5MB)', 'error');
      return;
    }

    setUploadingImage(true);
    
    try {
      const app = getApp();
      const storage = getStorage(app);
      const imageRef = ref(storage, `published_images/${selectedOpinionId}/${file.name}`);
      
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      setFinalImageUrl(downloadURL);
      showToast('Image uploaded successfully', 'success');
    } catch (error: any) {
      console.error('Image upload error:', error);
      showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedOpinionId || !firebaseInstances) return;
    
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    setSaving(true);
    
    try {
      const { db } = firebaseInstances;
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', selectedOpinionId);
      const dbStatus = getDbStatus(status);
      
      await updateDoc(opinionRef, {
        headline: editedTitle,
        subHeadline: editedSubHeadline,
        body: editedBody,
        authorName: editedAuthorName,
        editorNotes: editorNotes,
        status: dbStatus,
        finalImageUrl: finalImageUrl || suggestedImageUrl,
        updatedAt: serverTimestamp(),
      });
      
      showToast('Draft saved', 'success');
    } catch (error: any) {
      console.error('Save draft error:', error);
      showToast(`Save failed: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAndPublish = async () => {
    if (!selectedOpinionId || !firebaseInstances) return;
    
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    const imageToUse = finalImageUrl || suggestedImageUrl;
    if (!imageToUse) {
      showToast('Please upload or select an image before publishing', 'error');
      return;
    }

    setSaving(true);
    
    try {
      const { db } = firebaseInstances;
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', selectedOpinionId);
      
      await updateDoc(opinionRef, {
        headline: editedTitle,
        subHeadline: editedSubHeadline,
        body: editedBody,
        authorName: editedAuthorName,
        editorNotes: editorNotes,
        status: 'published',
        isPublished: true,
        finalImageUrl: imageToUse,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      showToast('Article published successfully!', 'success');
      setTimeout(() => setSelectedOpinionId(null), 1000);
    } catch (error: any) {
      console.error('Publish error:', error);
      showToast(`Publish failed: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOpinionId || !firebaseInstances) return;
    
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this article?')) {
      return;
    }

    setSaving(true);
    
    try {
      const { db } = firebaseInstances;
      const opinionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'opinions', selectedOpinionId);
      
      await updateDoc(opinionRef, {
        status: 'rejected',
        editorNotes: editorNotes,
        updatedAt: serverTimestamp(),
      });
      
      showToast('Article rejected', 'success');
      setTimeout(() => setSelectedOpinionId(null), 1000);
    } catch (error: any) {
      console.error('Reject error:', error);
      showToast(`Reject failed: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: '16px' }}>
      {/* Left Panel - Pending Queue */}
      <div style={{
        width: '400px',
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e5e5',
          backgroundColor: '#f9f9f9'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Pending Queue ({pendingOpinions.length})
          </h3>
        </div>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {pendingOpinions.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#999'
            }}>
              No pending submissions
            </div>
          ) : (
            pendingOpinions.map((opinion) => (
              <div
                key={opinion.id}
                onClick={() => setSelectedOpinionId(opinion.id)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  border: selectedOpinionId === opinion.id ? '2px solid #000' : '1px solid #e5e5e5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedOpinionId === opinion.id ? '#f0f0f0' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: '#000'
                }}>
                  {opinion.headline || 'Untitled'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  {opinion.authorName}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#999'
                }}>
                  {opinion.submittedAt?.toLocaleDateString() || 'Recently'}
                </div>
                <div style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '2px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#666'
                }}>
                  {getUIStatusLabel(opinion.status || 'pending')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Editor Suite */}
      <div style={{
        flex: 1,
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
        {!selectedOpinionId ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#999',
            fontSize: '16px'
          }}>
            Select an article from the queue to begin editing
          </div>
        ) : (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px'
          }}>
            {/* Status Dropdown */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UIStatusLabel)}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              >
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Published">Published</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Title
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Sub-headline */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Sub-headline
              </label>
              <input
                type="text"
                value={editedSubHeadline}
                onChange={(e) => setEditedSubHeadline(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Author Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Author Name
              </label>
              <input
                type="text"
                value={editedAuthorName}
                onChange={(e) => setEditedAuthorName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Image Management */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Image
              </label>
              <div style={{
                marginBottom: '8px',
                fontSize: '12px',
                color: '#666'
              }}>
                Images should not exceed 2000px width.
              </div>
              
              {suggestedImageUrl && (
                <div style={{ marginBottom: '12px' }}>
                  <img
                    src={finalImageUrl || suggestedImageUrl}
                    alt="Article image"
                    style={{
                      width: '100%',
                      maxWidth: '600px',
                      height: 'auto',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              )}
              
              <label style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#000',
                color: '#fff',
                borderRadius: '4px',
                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: uploadingImage ? 0.6 : 1
              }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.currentTarget.value = '';
                  }}
                />
                {uploadingImage ? 'Uploading...' : 'Replace Image'}
              </label>
            </div>

            {/* Body */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Body (HTML)
              </label>
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={15}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Editor Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Editor Notes (Private)
              </label>
              <textarea
                value={editorNotes}
                onChange={(e) => setEditorNotes(e.target.value)}
                rows={4}
                placeholder="Internal notes (not published)"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e5e5'
            }}>
              <button
                onClick={handleReject}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: saving ? 0.6 : 1
                }}
              >
                Reject
              </button>
              
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                onClick={handleApproveAndPublish}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Publishing...' : 'Approve & Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorialQueueTab;

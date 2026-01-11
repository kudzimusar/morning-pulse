/**
 * Editorial Queue Tab - Power Editor Edition
 * Enhanced with Direct Publishing, Rich Text Editor, Image Replacement, and Drafting
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { Opinion } from '../../../types';
import { getUIStatusLabel, getDbStatus, UIStatusLabel } from '../../utils/opinionStatus';
import RichTextEditor from '../RichTextEditor';
import ImagePreview from './ImagePreview';
import { createEditorialArticle, replaceArticleImage } from '../../services/opinionsService';
import { compressImage, validateImage } from '../../utils/imageCompression';
import EnhancedFirestore from '../../services/enhancedFirestore';

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
  const [isNewArticle, setIsNewArticle] = useState(false); // NEW: Track if creating new article
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubHeadline, setEditedSubHeadline] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedAuthorName, setEditedAuthorName] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [status, setStatus] = useState<UIStatusLabel>('Submitted');
  const [suggestedImageUrl, setSuggestedImageUrl] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string | null>(null); // NEW: Preview of new image
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null); // NEW: Track new image for replacement
  const [compressing, setCompressing] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(true);

  // ✅ FIX: Move Firestore service initialization out of render path using useMemo
  const firestoreService = useMemo(() => {
    if (!firebaseInstances?.db) return null;
    return EnhancedFirestore.getInstance(firebaseInstances.db);
  }, [firebaseInstances?.db]);

  // Subscribe to pending opinions with retry logic
  useEffect(() => {
    if (!firebaseInstances || !firestoreService) return;

    const { db } = firebaseInstances;
    
    const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
    const q = query(opinionsRef);
    
    setLoadingQueue(true);
    
    const unsubscribe = firestoreService.subscribeWithRetry<Array<{ id: string; [key: string]: any }>>(
      q,
      (data) => {
        setLoadingQueue(false);
        
        const opinions: Opinion[] = [];
        data.forEach((doc: any) => {
          const opinion = {
            id: doc.id,
            ...doc,
            submittedAt: doc.submittedAt?.toDate?.() || new Date(),
            publishedAt: doc.publishedAt?.toDate?.() || null,
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
        setLoadingQueue(false);
        showToast('Failed to load pending opinions after retries', 'error');
      },
      {
        maxRetries: 5,
        initialDelay: 1500,
        backoffMultiplier: 2
      }
    );

    return () => {
      unsubscribe();
    };
  }, [firebaseInstances, firestoreService, showToast]);

  // Load selected opinion OR reset for new article
  useEffect(() => {
    if (isNewArticle) {
      // Reset to blank state for new article
      setEditedTitle('');
      setEditedSubHeadline('');
      setEditedBody('');
      setEditedAuthorName('Editorial Team');
      setEditorNotes('');
      setStatus('Published');
      setSuggestedImageUrl(null);
      setFinalImageUrl(null);
      setNewImagePreviewUrl(null);
      setNewImageFile(null);
      return;
    }

    if (!selectedOpinionId) {
      setEditedTitle('');
      setEditedSubHeadline('');
      setEditedBody('');
      setEditedAuthorName('');
      setEditorNotes('');
      setStatus('Submitted');
      setSuggestedImageUrl(null);
      setFinalImageUrl(null);
      setNewImagePreviewUrl(null);
      setNewImageFile(null);
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
      setNewImagePreviewUrl(null);
      setNewImageFile(null);
    }
  }, [selectedOpinionId, pendingOpinions, isNewArticle]);

  // NEW: Handle Create New Article button with event isolation
  const handleCreateNewArticle = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🖱️ Create Button Clicked');
    setSelectedOpinionId(null);
    setIsNewArticle(true);
  };

  // NEW: Handle Cancel New Article
  const handleCancelNewArticle = () => {
    setIsNewArticle(false);
    setSelectedOpinionId(null);
    setNewImagePreviewUrl(null);
    setNewImageFile(null);
  };

  // ENHANCED: Image replacement with compression and overwrite
  const handleImageReplace = async (file: File) => {
    // Validate image
    const validation = await validateImage(file, 2000, MAX_IMAGE_BYTES);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid image', 'error');
      return;
    }

    setCompressing(true);
    setUploadingImage(true);
    
    try {
      // Compress image to max 2000px width
      const compressed = await compressImage(file, 2000, 0.9);
      console.log(`📦 Compressed: ${(compressed.originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressed.compressedSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(compressed.file);
      setNewImagePreviewUrl(previewUrl);
      setNewImageFile(compressed.file);
      
      // For new articles, just show preview (will upload on publish)
      if (isNewArticle) {
        setFinalImageUrl(previewUrl);
        showToast('Image ready. Will upload when article is published.', 'success');
        setUploadingImage(false);
        setCompressing(false);
        return;
      }

      // For existing articles, replace immediately
      if (!selectedOpinionId) {
        showToast('No article selected', 'error');
        return;
      }

      const app = getApp();
      const storage = getStorage(app);
      
      // Delete old final.jpg if it exists
      const oldImageRef = ref(storage, `published_images/${selectedOpinionId}/final.jpg`);
      try {
        await deleteObject(oldImageRef);
        console.log('🗑️ Deleted old image');
      } catch (error: any) {
        // Ignore if file doesn't exist
        if (error.code !== 'storage/object-not-found') {
          console.warn('Could not delete old image:', error);
        }
      }
      
      // Upload new compressed image to final.jpg (overwrites)
      const newImageRef = ref(storage, `published_images/${selectedOpinionId}/final.jpg`);
      await uploadBytes(newImageRef, compressed.file, {
        contentType: compressed.file.type || 'image/jpeg',
      });
      
      const downloadURL = await getDownloadURL(newImageRef);
      setFinalImageUrl(downloadURL);
      setNewImagePreviewUrl(null); // Clear preview after upload
      setNewImageFile(null);
      showToast('Image replaced successfully', 'success');
    } catch (error: any) {
      console.error('Image replace error:', error);
      showToast(`Image replace failed: ${error.message}`, 'error');
      setNewImagePreviewUrl(null);
      setNewImageFile(null);
    } finally {
      setUploadingImage(false);
      setCompressing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!firebaseInstances) return;
    
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    // For new articles, create as draft first
    if (isNewArticle) {
      if (!editedTitle.trim() || !editedSubHeadline.trim() || !editedBody.trim()) {
        showToast('Please fill in headline, sub-headline, and body before saving draft', 'error');
        return;
      }

      setSaving(true);
      
      try {
        const { db } = firebaseInstances;
        const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
        
        const docData = {
          writerType: 'Editorial',
          authorName: editedAuthorName || 'Editorial Team',
          authorTitle: '',
          headline: editedTitle,
          subHeadline: editedSubHeadline,
          body: editedBody,
          category: 'General',
          country: 'Global',
          suggestedImageUrl: null,
          finalImageUrl: finalImageUrl || null,
          imageUrl: finalImageUrl || null,
          imageGeneratedAt: new Date().toISOString(),
          status: 'pending', // Save as draft (pending)
          isPublished: false,
          type: 'editorial',
          editorNotes: editorNotes,
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(opinionsRef, docData);
        const articleId = docRef.id;
        
        // Upload image if there's one
        if (newImageFile) {
          await replaceArticleImage(newImageFile, articleId);
          const app = getApp();
          const storage = getStorage(app);
          const imageRef = ref(storage, `published_images/${articleId}/final.jpg`);
          const finalUrl = await getDownloadURL(imageRef);
          await updateDoc(docRef, {
            finalImageUrl: finalUrl,
            imageUrl: finalUrl,
          });
        }
        
        showToast('Draft saved successfully', 'success');
        setIsNewArticle(false);
        setSelectedOpinionId(articleId);
        setNewImagePreviewUrl(null);
        setNewImageFile(null);
      } catch (error: any) {
        console.error('Save draft error:', error);
        showToast(`Save failed: ${error.message}`, 'error');
      } finally {
        setSaving(false);
      }
      return;
    }

    // For existing articles, update draft
    if (!selectedOpinionId) {
      showToast('No article selected', 'error');
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

  // NEW: Handle direct publishing (for new articles)
  const handlePublishDirectly = async () => {
    if (!firebaseInstances) return;
    
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    // Validation
    if (!editedTitle.trim()) {
      showToast('Please enter a headline', 'error');
      return;
    }
    if (!editedSubHeadline.trim()) {
      showToast('Please enter a sub-headline', 'error');
      return;
    }
    if (!editedBody.trim()) {
      showToast('Please enter article body', 'error');
      return;
    }
    if (!editedAuthorName.trim()) {
      showToast('Please enter author name', 'error');
      return;
    }

    setSaving(true);
    
    try {
      const { db } = firebaseInstances;
      const opinionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'opinions');
      
      // Create article first to get ID
      const docData = {
        writerType: 'Editorial',
        authorName: editedAuthorName,
        authorTitle: '',
        headline: editedTitle,
        subHeadline: editedSubHeadline,
        body: editedBody,
        category: 'General',
        country: 'Global',
        suggestedImageUrl: null,
        finalImageUrl: null, // Will update after image upload
        imageUrl: null, // Will update after image upload
        imageGeneratedAt: new Date().toISOString(),
        status: 'published',
        isPublished: true,
        type: 'editorial', // Flag to distinguish from user submissions
        submittedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(opinionsRef, docData);
      const articleId = docRef.id;
      
      // Upload image if there's one
      let finalImageUrlToUse = null;
      if (newImageFile) {
        await replaceArticleImage(newImageFile, articleId);
        const app = getApp();
        const storage = getStorage(app);
        const imageRef = ref(storage, `published_images/${articleId}/final.jpg`);
        finalImageUrlToUse = await getDownloadURL(imageRef);
        
        // Update article with image URL
        await updateDoc(docRef, {
          finalImageUrl: finalImageUrlToUse,
          imageUrl: finalImageUrlToUse,
        });
      }
      
      showToast('Article published successfully!', 'success');
      setIsNewArticle(false);
      setSelectedOpinionId(null);
      setNewImagePreviewUrl(null);
      setNewImageFile(null);
    } catch (error: any) {
      console.error('Publish error:', error);
      showToast(`Publish failed: ${error.message}`, 'error');
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
      setTimeout(() => {
        setSelectedOpinionId(null);
        setIsNewArticle(false);
      }, 1000);
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
      setTimeout(() => {
        setSelectedOpinionId(null);
        setIsNewArticle(false);
      }, 1000);
    } catch (error: any) {
      console.error('Reject error:', error);
      showToast(`Reject failed: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', gap: '16px' }}>
      {/* NEW: Header with Create New Article button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e5e5e5'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Editorial Queue
        </h3>
        <button
          onClick={(e) => handleCreateNewArticle(e)}
          disabled={false}
          style={{
            padding: '10px 20px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            opacity: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ✏️ Create New Editorial
        </button>
      </div>

      {/* Loading indicator */}
      {loadingQueue && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e5e5e5'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            ⏳ Connecting to Editorial Queue...
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Retrying connection if needed...
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, gap: '16px', overflow: 'hidden' }}>
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
                  onClick={() => {
                    setSelectedOpinionId(opinion.id);
                    setIsNewArticle(false);
                  }}
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
          {!selectedOpinionId && !isNewArticle ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#999',
              fontSize: '16px',
              gap: '12px'
            }}>
              <div>Select an article from the queue to begin editing</div>
              <div style={{ fontSize: '14px', color: '#666' }}>or</div>
              <button
                onClick={(e) => handleCreateNewArticle(e)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ✏️ Create New Editorial
              </button>
            </div>
          ) : (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px'
            }}>
              {/* NEW: Header for new articles */}
              {isNewArticle && (
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '2px solid #000' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#000' }}>
                    ✏️ New Editorial Article
                  </h3>
                  <button
                    onClick={handleCancelNewArticle}
                    disabled={saving}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6b7280',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Status Dropdown (hidden for new articles) */}
              {!isNewArticle && (
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
              )}

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Title <span style={{ color: '#ef4444' }}>*</span>
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
                  placeholder="Enter article headline"
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
                  Sub-headline <span style={{ color: '#ef4444' }}>*</span>
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
                  placeholder="Enter sub-headline"
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
                  Author Name <span style={{ color: '#ef4444' }}>*</span>
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
                  placeholder={isNewArticle ? "Editorial Team" : "Author name"}
                />
              </div>

              {/* ENHANCED: Image Management with Preview */}
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
                  Images will be automatically compressed to max 2000px width. Max 5MB. Replaces existing image.
                </div>
                
                {/* ImagePreview Component - Shows current vs new */}
                {(finalImageUrl || suggestedImageUrl || newImagePreviewUrl) && (
                  <ImagePreview
                    currentImageUrl={finalImageUrl || suggestedImageUrl}
                    newImageUrl={newImagePreviewUrl}
                    currentImageLabel={finalImageUrl ? "Current Final Image" : "Suggested Image"}
                    newImageLabel="New Image (Preview)"
                  />
                )}
                
                <label style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: uploadingImage || compressing ? '#9ca3af' : '#000',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: (uploadingImage || compressing) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: (uploadingImage || compressing) ? 0.6 : 1
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingImage || compressing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageReplace(file);
                      e.currentTarget.value = '';
                    }}
                  />
                  {compressing ? 'Compressing...' : uploadingImage ? 'Uploading...' : finalImageUrl ? 'Replace Image' : 'Upload Image'}
                </label>
              </div>

              {/* ENHANCED: Rich Text Editor for Body */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Body <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <RichTextEditor
                  value={editedBody}
                  onChange={setEditedBody}
                  placeholder="Write your article content here. Use the toolbar to format text, add headings (H1, H2), blockquotes for pull-quotes, and links."
                />
              </div>

              {/* Editor Notes (hidden for new articles) */}
              {!isNewArticle && (
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
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e5e5'
              }}>
                {isNewArticle ? (
                  <>
                    <button
                      onClick={handleCancelNewArticle}
                      disabled={saving}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6b7280',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: saving ? 0.6 : 1
                      }}
                    >
                      Cancel
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
                      {saving ? 'Saving...' : 'Save Progress'}
                    </button>
                    <button
                      onClick={handlePublishDirectly}
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
                        opacity: saving ? 0.6 : 1,
                        marginLeft: 'auto'
                      }}
                    >
                      {saving ? 'Publishing...' : '📝 Post to Website'}
                    </button>
                  </>
                ) : (
                  <>
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
                        opacity: saving ? 0.6 : 1,
                        marginLeft: 'auto'
                      }}
                    >
                      {saving ? 'Publishing...' : 'Approve & Publish'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorialQueueTab;

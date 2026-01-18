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
import { Opinion } from '../../../../types';
import { getUIStatusLabel, getDbStatus, UIStatusLabel, getStatusColor } from '../../utils/opinionStatus';
import RichTextEditor from '../RichTextEditor';
import ImagePreview from './ImagePreview';
import { 
  createEditorialArticle, 
  replaceArticleImage,
  claimStory,
  releaseStory,
  returnToWriter
} from '../../services/opinionsService';
import { compressImage, validateImage } from '../../utils/imageCompression';
import EnhancedFirestore from '../../services/enhancedFirestore';
import { getCurrentEditor } from '../../services/authService';

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
  // NEW: Separate lists for different workflow stages
  const [draftOpinions, setDraftOpinions] = useState<Opinion[]>([]);
  const [pendingOpinions, setPendingOpinions] = useState<Opinion[]>([]);
  const [inReviewOpinions, setInReviewOpinions] = useState<Opinion[]>([]);
  
  const [selectedOpinionId, setSelectedOpinionId] = useState<string | null>(null);
  const [selectedOpinion, setSelectedOpinion] = useState<Opinion | null>(null); // NEW: Full opinion object
  const [isNewArticle, setIsNewArticle] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(false); // NEW: Toggle for split-pane view
  
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubHeadline, setEditedSubHeadline] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [editedAuthorName, setEditedAuthorName] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [status, setStatus] = useState<UIStatusLabel>('Pending Review');
  const [suggestedImageUrl, setSuggestedImageUrl] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false); // NEW: Track claiming operation
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(true);
  
  // NEW: Current editor info
  const currentEditor = getCurrentEditor();
  const currentEditorId = currentEditor?.uid || '';
  const currentEditorName = currentEditor?.email?.split('@')[0] || 'Editor';

  // ✅ FIX: Move Firestore service initialization out of render path using useMemo
  const firestoreService = useMemo(() => {
    if (!firebaseInstances?.db) return null;
    return EnhancedFirestore.getInstance(firebaseInstances.db);
  }, [firebaseInstances?.db]);

  // Subscribe to all editorial opinions (draft, pending, in-review) with retry logic
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
        
        const drafts: Opinion[] = [];
        const pending: Opinion[] = [];
        const inReview: Opinion[] = [];
        
        data.forEach((doc: any) => {
          const opinion = {
            id: doc.id,
            ...doc,
            submittedAt: doc.submittedAt?.toDate?.() || new Date(),
            publishedAt: doc.publishedAt?.toDate?.() || null,
            claimedAt: doc.claimedAt?.toDate?.() || null,
            scheduledFor: doc.scheduledFor?.toDate?.() || null,
          } as Opinion;
          
          // NEW: Separate into three queues based on status
          if (opinion.status === 'draft') {
            drafts.push(opinion);
          } else if (opinion.status === 'pending') {
            pending.push(opinion);
          } else if (opinion.status === 'in-review') {
            inReview.push(opinion);
          }
        });
        
        // Sort each list by submission time (newest first)
        const sortByTime = (a: Opinion, b: Opinion) => {
          const timeA = a.submittedAt?.getTime() || 0;
          const timeB = b.submittedAt?.getTime() || 0;
          return timeB - timeA;
        };
        
        drafts.sort(sortByTime);
        pending.sort(sortByTime);
        inReview.sort(sortByTime);
        
        setDraftOpinions(drafts);
        setPendingOpinions(pending);
        setInReviewOpinions(inReview);
      },
      (error) => {
        console.error('Error subscribing to opinions:', error);
        setLoadingQueue(false);
        showToast('Failed to load editorial queue after retries', 'error');
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
      setSelectedOpinion(null);
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
      setShowOriginalText(false);
      return;
    }

    if (!selectedOpinionId) {
      setSelectedOpinion(null);
      setEditedTitle('');
      setEditedSubHeadline('');
      setEditedBody('');
      setEditedAuthorName('');
      setEditorNotes('');
      setStatus('Pending Review');
      setSuggestedImageUrl(null);
      setFinalImageUrl(null);
      setNewImagePreviewUrl(null);
      setNewImageFile(null);
      setShowOriginalText(false);
      return;
    }

    // NEW: Search across all three lists
    const allOpinions = [...draftOpinions, ...pendingOpinions, ...inReviewOpinions];
    const opinion = allOpinions.find(op => op.id === selectedOpinionId);
    
    if (opinion) {
      setSelectedOpinion(opinion);
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
      // NEW: Enable split-pane view if there's original text
      setShowOriginalText(!!opinion.originalBody);
    }
  }, [selectedOpinionId, draftOpinions, pendingOpinions, inReviewOpinions, isNewArticle]);

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

  // NEW: Claim story for editing
  const handleClaimStory = async (storyId: string) => {
    if (!userRoles.includes('editor') && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
      showToast('Unauthorized: Editor role required', 'error');
      return;
    }

    if (!currentEditorId) {
      showToast('Unable to identify current editor', 'error');
      return;
    }

    setClaiming(true);
    
    try {
      await claimStory(storyId, currentEditorId, currentEditorName);
      showToast('Story claimed successfully', 'success');
      setSelectedOpinionId(storyId);
    } catch (error: any) {
      console.error('Claim error:', error);
      showToast(error.message || 'Failed to claim story', 'error');
    } finally {
      setClaiming(false);
    }
  };

  // NEW: Release story back to pending queue
  const handleReleaseStory = async () => {
    if (!selectedOpinionId) return;
    
    if (!window.confirm('Release this story back to the pending queue?')) {
      return;
    }

    setSaving(true);
    
    try {
      await releaseStory(selectedOpinionId, currentEditorId);
      showToast('Story released to pending queue', 'success');
      setSelectedOpinionId(null);
    } catch (error: any) {
      console.error('Release error:', error);
      showToast(error.message || 'Failed to release story', 'error');
    } finally {
      setSaving(false);
    }
  };

  // NEW: Return story to writer with feedback
  const handleReturnToWriter = async () => {
    if (!selectedOpinionId) return;
    
    if (!editorNotes.trim()) {
      showToast('Please add feedback notes before returning to writer', 'error');
      return;
    }

    if (!window.confirm('Return this story to the writer with your feedback?')) {
      return;
    }

    setSaving(true);
    
    try {
      await returnToWriter(selectedOpinionId, editorNotes, currentEditorId);
      showToast('Story returned to writer with feedback', 'success');
      setTimeout(() => {
        setSelectedOpinionId(null);
      }, 1000);
    } catch (error: any) {
      console.error('Return to writer error:', error);
      showToast(error.message || 'Failed to return story', 'error');
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
        {/* Left Panel - Editorial Queue with 3 Sections */}
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
              Editorial Queue
            </h3>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {draftOpinions.length + pendingOpinions.length + inReviewOpinions.length} total stories
            </div>
          </div>
          
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px'
          }}>
            {/* Section 1: Drafts */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '13px',
                color: '#374151',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>📝 Drafts</span>
                <span style={{
                  backgroundColor: '#e5e7eb',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {draftOpinions.length}
                </span>
              </div>
              
              {draftOpinions.length === 0 ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '12px'
                }}>
                  No drafts
                </div>
              ) : (
                draftOpinions.map((opinion) => {
                  const statusColors = getStatusColor(opinion.status);
                  return (
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
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: '#000'
                      }}>
                        {opinion.headline || 'Untitled'}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#666',
                        marginBottom: '4px'
                      }}>
                        {opinion.authorName}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#999'
                      }}>
                        {opinion.submittedAt?.toLocaleDateString() || 'Recently'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Section 2: Pending Review (Awaiting Claim) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#fef3c7',
                borderRadius: '4px',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '13px',
                color: '#92400e',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>⏳ Pending Review</span>
                <span style={{
                  backgroundColor: '#fde68a',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {pendingOpinions.length}
                </span>
              </div>
              
              {pendingOpinions.length === 0 ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '12px'
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
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: '#000'
                    }}>
                      {opinion.headline || 'Untitled'}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '4px'
                    }}>
                      {opinion.authorName}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#999'
                    }}>
                      {opinion.submittedAt?.toLocaleDateString() || 'Recently'}
                    </div>
                    {opinion.editorNotes && (
                      <div style={{
                        marginTop: '6px',
                        padding: '4px 6px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '2px',
                        fontSize: '10px',
                        color: '#92400e'
                      }}>
                        💬 Has feedback
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Section 3: In Review (Claimed by Editor) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#dbeafe',
                borderRadius: '4px',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '13px',
                color: '#1e40af',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>✍️ In Edit</span>
                <span style={{
                  backgroundColor: '#93c5fd',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {inReviewOpinions.length}
                </span>
              </div>
              
              {inReviewOpinions.length === 0 ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '12px'
                }}>
                  No stories in edit
                </div>
              ) : (
                inReviewOpinions.map((opinion) => {
                  const isClaimedByMe = opinion.claimedBy === currentEditorId;
                  return (
                    <div
                      key={opinion.id}
                      onClick={() => {
                        if (isClaimedByMe || userRoles.includes('super_admin') || userRoles.includes('admin')) {
                          setSelectedOpinionId(opinion.id);
                          setIsNewArticle(false);
                        } else {
                          showToast(`Story is claimed by ${opinion.claimedByName || 'another editor'}`, 'error');
                        }
                      }}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        border: selectedOpinionId === opinion.id ? '2px solid #000' : '1px solid #e5e5e5',
                        borderRadius: '4px',
                        cursor: isClaimedByMe || userRoles.includes('super_admin') || userRoles.includes('admin') ? 'pointer' : 'not-allowed',
                        backgroundColor: selectedOpinionId === opinion.id ? '#f0f0f0' : 'white',
                        transition: 'all 0.2s',
                        opacity: isClaimedByMe || userRoles.includes('super_admin') || userRoles.includes('admin') ? 1 : 0.6
                      }}
                    >
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: '#000'
                      }}>
                        {opinion.headline || 'Untitled'}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#666',
                        marginBottom: '4px'
                      }}>
                        {opinion.authorName}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#999',
                        marginBottom: '6px'
                      }}>
                        {opinion.submittedAt?.toLocaleDateString() || 'Recently'}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '6px'
                      }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor: isClaimedByMe ? '#86efac' : '#dbeafe',
                          borderRadius: '2px',
                          color: isClaimedByMe ? '#065f46' : '#1e40af'
                        }}>
                          {isClaimedByMe ? '✓ You' : `🔒 ${opinion.claimedByName || 'Claimed'}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
              {/* NEW: Header for new articles OR selected article status */}
              {isNewArticle ? (
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
              ) : selectedOpinion && (
                <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e5e5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        Editing Story
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          ...getStatusColor(selectedOpinion.status)
                        }}>
                          {getUIStatusLabel(selectedOpinion.status)}
                        </span>
                        {selectedOpinion.claimedBy && selectedOpinion.claimedBy === currentEditorId && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: '#86efac',
                            color: '#065f46'
                          }}>
                            ✓ Claimed by you
                          </span>
                        )}
                        {selectedOpinion.claimedBy && selectedOpinion.claimedBy !== currentEditorId && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: '#fde68a',
                            color: '#92400e'
                          }}>
                            🔒 Claimed by {selectedOpinion.claimedByName}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* NEW: Claim button for pending stories */}
                    {selectedOpinion.status === 'pending' && (
                      <button
                        onClick={() => handleClaimStory(selectedOpinion.id)}
                        disabled={claiming}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#1e40af',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: claiming ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          opacity: claiming ? 0.6 : 1
                        }}
                      >
                        {claiming ? 'Claiming...' : '✓ Claim Story'}
                      </button>
                    )}
                  </div>
                  
                  {/* NEW: Toggle for split-pane view (if original text exists) */}
                  {selectedOpinion.originalBody && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#374151'
                      }}>
                        <input
                          type="checkbox"
                          checked={showOriginalText}
                          onChange={(e) => setShowOriginalText(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        Show original journalist text (side-by-side)
                      </label>
                    </div>
                  )}
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

              {/* ENHANCED: Rich Text Editor for Body with Split-Pane Option */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Body <span style={{ color: '#ef4444' }}>*</span>
                </label>
                
                {/* NEW: Split-pane view showing original text */}
                {showOriginalText && selectedOpinion?.originalBody ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    {/* Left pane: Original text (read-only) */}
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      padding: '12px',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        📄 Original Text (Reference)
                      </div>
                      <div style={{
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#374151',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedOpinion.originalBody }}
                      />
                    </div>
                    
                    {/* Right pane: Editor's version (editable) */}
                    <div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        ✍️ Your Edit
                      </div>
                      <RichTextEditor
                        value={editedBody}
                        onChange={setEditedBody}
                        placeholder="Edit the article content here..."
                      />
                    </div>
                  </div>
                ) : (
                  <RichTextEditor
                    value={editedBody}
                    onChange={setEditedBody}
                    placeholder="Write your article content here. Use the toolbar to format text, add headings (H1, H2), blockquotes for pull-quotes, and links."
                  />
                )}
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

              {/* Action Buttons - Context-aware based on status */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e5e5'
              }}>
                {isNewArticle ? (
                  // NEW ARTICLE BUTTONS
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
                ) : selectedOpinion?.status === 'pending' ? (
                  // PENDING STORY BUTTONS (Not yet claimed)
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
                      onClick={() => selectedOpinion && handleClaimStory(selectedOpinion.id)}
                      disabled={claiming}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#1e40af',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: claiming ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: claiming ? 0.6 : 1,
                        marginLeft: 'auto'
                      }}
                    >
                      {claiming ? 'Claiming...' : '✓ Claim & Edit'}
                    </button>
                  </>
                ) : selectedOpinion?.status === 'in-review' && selectedOpinion?.claimedBy === currentEditorId ? (
                  // IN-REVIEW BUTTONS (Claimed by current editor)
                  <>
                    <button
                      onClick={handleReleaseStory}
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
                      Release
                    </button>
                    
                    <button
                      onClick={handleReturnToWriter}
                      disabled={saving || !editorNotes.trim()}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#f59e0b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (saving || !editorNotes.trim()) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: (saving || !editorNotes.trim()) ? 0.6 : 1
                      }}
                      title={!editorNotes.trim() ? 'Add feedback notes first' : ''}
                    >
                      Return to Writer
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
                      {saving ? 'Publishing...' : '✓ Publish'}
                    </button>
                  </>
                ) : selectedOpinion?.status === 'draft' ? (
                  // DRAFT BUTTONS (Editor editing a draft)
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
                      {saving ? 'Publishing...' : 'Publish'}
                    </button>
                  </>
                ) : (
                  // DEFAULT FALLBACK BUTTONS
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
                      {saving ? 'Saving...' : 'Save'}
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
                      {saving ? 'Publishing...' : 'Publish'}
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

import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  getDocs, 
  doc, 
  setDoc,
  getDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  where,
  Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously,
  Auth
} from 'firebase/auth';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject, FirebaseStorage } from 'firebase/storage';
import { Opinion, OpinionSubmissionData, OpinionVersion } from '../../../types';
import { getImageByTopic } from '../utils/imageGenerator';
import EnhancedFirestore from './enhancedFirestore';

// Get Firebase config (same pattern as FirebaseConnector)
const getFirebaseConfig = (): any => {
  // Priority 1: Try to get from window (injected at runtime via firebase-config.js)
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    const config = (window as any).__firebase_config;
    if (typeof config === 'object' && config !== null && config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
      return config;
    }
  }
  
  // Priority 2: Try to get from environment variable (build time)
  const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configStr && typeof configStr === 'string' && configStr.trim() && configStr !== 'null') {
    try {
      let parsed = JSON.parse(configStr);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse VITE_FIREBASE_CONFIG:', e);
    }
  }
  
  // Priority 3: Hardcoded fallback for local development
  return {
    apiKey: "AIzaSyCAh6j7mhTtiQGN5855Tt-hCRVrNXbNxYE",
    authDomain: "gen-lang-client-0999441419.firebaseapp.com",
    projectId: "gen-lang-client-0999441419",
    storageBucket: "gen-lang-client-0999441419.firebasestorage.app",
    messagingSenderId: "328455476104",
    appId: "1:328455476104:web:396deccbc5613e353f603d",
    measurementId: "G-60S2YK429K"
  };
};

// Get Firestore instance
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

const getDb = (): Firestore | null => {
  if (db && auth) return db;
  
  try {
    const config = getFirebaseConfig();
    if (!config || Object.keys(config).length === 0) {
      console.warn('Firebase config not available');
      return null;
    }
    
    try {
      app = getApp();
    } catch (e) {
      app = initializeApp(config);
    }
    
    db = getFirestore(app);
    // CRITICAL: Initialize auth from the same app instance
    if (!auth) {
      auth = getAuth(app);
    }
    return db;
  } catch (e) {
    console.error('Firebase initialization error:', e);
    return null;
  }
};

const getStorageInstance = (): FirebaseStorage | null => {
  if (storage && app) return storage;
  const _db = getDb();
  if (!_db || !app) return null;
  storage = getStorage(app);
  return storage;
};

/**
 * Upload an opinion image to Firebase Storage and return the public download URL.
 * - pending_uploads/: writer suggested images
 * - published_images/: editor-approved/replacement images
 */
export const uploadOpinionImage = async (
  file: File,
  folder: 'pending_uploads' | 'published_images',
  opinionId?: string
): Promise<string> => {
  const s = getStorageInstance();
  if (!s) {
    throw new Error('Firebase not initialized');
  }

  await ensureAuthenticated();

  const safeName = (file.name || 'upload.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${folder}/${opinionId || 'misc'}/${Date.now()}-${safeName}`;
  const objRef = storageRef(s, key);

  await uploadBytes(objRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  return await getDownloadURL(objRef);
};

/**
 * Ensure user is authenticated (anonymous auth for public submissions)
 */
export const ensureAuthenticated = async (): Promise<void> => {
  if (!auth) {
    const db = getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
  }
  
  if (auth) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('🔐 No user authenticated, signing in anonymously...');
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5252e085-f66e-44ad-9210-7b45a5c6c499',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'opinionsService.ts:106',message:'Before signInAnonymously',data:{hasAuth:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      try {
        const userCredential = await signInAnonymously(auth);
        console.log('✅ Anonymous authentication successful');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5252e085-f66e-44ad-9210-7b45a5c6c499',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'opinionsService.ts:109',message:'After signInAnonymously success',data:{uid:userCredential.user.uid,isAnonymous:userCredential.user.isAnonymous,providerId:userCredential.user.providerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (error: any) {
        console.error('❌ Anonymous authentication failed:', error);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5252e085-f66e-44ad-9210-7b45a5c6c499',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'opinionsService.ts:112',message:'signInAnonymously error',data:{errorCode:error.code,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        if (error.code === 'auth/configuration-not-found') {
          const message = 'CRITICAL: Enable Anonymous Auth in Firebase Console > Authentication > Sign-in Method.';
          console.error(message);
          alert(message);
          throw new Error(message);
        }
        throw error;
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5252e085-f66e-44ad-9210-7b45a5c6c499',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'opinionsService.ts:121',message:'User already authenticated',data:{uid:currentUser.uid,isAnonymous:currentUser.isAnonymous,providerId:currentUser.providerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }
  }
};

const OPINIONS_COLLECTION = 'artifacts/morning-pulse-app/public/data/opinions';

/**
 * Get current auth user (for components to check auth state)
 */
export const getCurrentAuthUser = () => {
  return auth?.currentUser || null;
};

/**
 * Submit a new opinion for review
 */
export const submitOpinion = async (opinionData: OpinionSubmissionData): Promise<string> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // CRITICAL: Ensure anonymous authentication before writing to Firestore
    await ensureAuthenticated();
    
    console.log('📝 Attempting to submit opinion to path: artifacts/morning-pulse-app/public/data/opinions');
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    
    // PRIMARY: Generate imageUrl on submit so admins see an image during review
    const suggestedImageUrl = opinionData.suggestedImageUrl;
    const imageUrl = suggestedImageUrl || (opinionData as any).imageUrl || getImageByTopic(opinionData.headline || '');
    const imageGeneratedAt = new Date().toISOString();

    const docData = {
      writerType: opinionData.writerType || 'Guest Essay',
      authorName: opinionData.authorName,
      authorTitle: opinionData.authorTitle || '',
      headline: opinionData.headline,
      subHeadline: opinionData.subHeadline,
      body: opinionData.body, // This will be HTML string from rich text editor
      category: opinionData.category || 'General',
      country: opinionData.country || 'Global',
      suggestedImageUrl: suggestedImageUrl || null,
      finalImageUrl: null,
      isPublished: false,
      imageUrl,
      imageGeneratedAt,
      status: 'pending' as const,
      submittedAt: Timestamp.now(),
    };

    const docRef = await addDoc(opinionsRef, docData);
    console.log('✅ Opinion submitted with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error submitting opinion:', error);
    throw new Error(`Failed to submit opinion: ${error.message}`);
  }
};

/**
 * Create a new editorial article directly (bypasses submission queue)
 * Used by editors to write and publish articles directly
 * Saves to: artifacts/morning-pulse-app/public/data/opinions
 */
export const createEditorialArticle = async (
  articleData: {
    headline: string;
    subHeadline: string;
    body: string;
    authorName: string;
    category?: string;
    country?: string;
    finalImageUrl?: string;
  }
): Promise<string> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    console.log('📝 Creating editorial article directly...');
    
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    
    const imageUrl = articleData.finalImageUrl || getImageByTopic(articleData.headline || '');
    
    const docData = {
      writerType: 'Editorial',
      authorName: articleData.authorName,
      authorTitle: '',
      headline: articleData.headline,
      subHeadline: articleData.subHeadline,
      body: articleData.body,
      category: articleData.category || 'General',
      country: articleData.country || 'Global',
      suggestedImageUrl: null,
      finalImageUrl: articleData.finalImageUrl || null,
      imageUrl,
      imageGeneratedAt: new Date().toISOString(),
      status: 'published',
      isPublished: true,
      type: 'editorial', // Flag to distinguish from user submissions
      submittedAt: Timestamp.now(),
      publishedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(opinionsRef, docData);
    console.log('✅ Editorial article created with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating editorial article:', error);
    throw new Error(`Failed to create editorial article: ${error.message}`);
  }
};

/**
 * Replace article image and overwrite existing final.jpg
 * Uploads to: published_images/{articleId}/final.jpg
 * Deletes old image if it exists before uploading new one
 */
export const replaceArticleImage = async (
  file: File,
  articleId: string
): Promise<string> => {
  const s = getStorageInstance();
  if (!s) {
    throw new Error('Firebase not initialized');
  }

  await ensureAuthenticated();

  try {
    // Delete old final.jpg if it exists
    const oldImageRef = storageRef(s, `published_images/${articleId}/final.jpg`);
    try {
      await deleteObject(oldImageRef);
      console.log('🗑️ Deleted old image');
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== 'storage/object-not-found') {
        console.warn('Could not delete old image:', error);
      }
    }
    
    // Upload new image to final.jpg (overwrites)
    const newImageRef = storageRef(s, `published_images/${articleId}/final.jpg`);
    await uploadBytes(newImageRef, file, {
      contentType: file.type || 'image/jpeg',
    });
    
    const downloadURL = await getDownloadURL(newImageRef);
    console.log('✅ Image replaced successfully:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error('❌ Error replacing image:', error);
    throw new Error(`Failed to replace image: ${error.message}`);
  }
};

/**
 * Get all published opinions, ordered by publishedAt (newest first)
 * FIX: Fetch entire collection, filter in JavaScript to avoid permission/index issues
 */
export const getPublishedOpinions = async (): Promise<Opinion[]> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // CRITICAL: Ensure authentication before fetching
    await ensureAuthenticated();
    
    console.log('📝 Attempting to fetch published opinions from path: artifacts/morning-pulse-app/public/data/opinions');
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    
    // FIX: Fetch entire collection without where/orderBy to avoid permission errors
    const snapshot = await getDocs(opinionsRef);
    const allOpinions: Opinion[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      allOpinions.push({
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as Opinion);
    });

    // Filter for published status in JavaScript memory
    const publishedOpinions = allOpinions
      .filter(opinion => opinion.status === 'published')
      .sort((a, b) => {
        const timeA = a.publishedAt?.getTime() || 0;
        const timeB = b.publishedAt?.getTime() || 0;
        return timeB - timeA; // Newest first
      });

    console.log(`✅ Fetched ${allOpinions.length} total opinions, ${publishedOpinions.length} published`);
    return publishedOpinions;
  } catch (error: any) {
    console.error('❌ Error fetching published opinions:', error);
    throw new Error(`Failed to fetch opinions: ${error.message}`);
  }
};

/**
 * Subscribe to published opinions with real-time updates
 * Reads directly from Firestore using onSnapshot
 */
export const subscribeToPublishedOpinions = (
  callback: (opinions: Opinion[]) => void,
  onError?: (error: string) => void
): (() => void) => {
  const db = getDb();
  if (!db) {
    console.warn('Firebase not initialized, returning empty unsubscribe');
    if (onError) onError('Firebase not initialized');
    return () => {};
  }

  try {
    console.log('📰 Subscribing to published opinions in Firestore...');
    
    const enhancedFirestore = EnhancedFirestore.getInstance(db);
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    const q = query(opinionsRef);

    const unsubscribe = enhancedFirestore.subscribeWithRetry<Array<{ id: string; [key: string]: any }>>(
      q,
      (data) => {
        // Filter and sort in JavaScript memory
        const allData = data.map((doc: any) => ({
          id: doc.id,
          ...doc,
          submittedAt: doc.submittedAt?.toDate?.() || new Date(),
          publishedAt: doc.publishedAt?.toDate?.() || null,
        })) as Opinion[];
        
        // Filter for published status and sort by publishedAt descending
        const publishedOpinions = allData
          .filter(item => item.status === 'published')
          .sort((a, b) => {
            const timeA = a.publishedAt?.getTime() || 0;
            const timeB = b.publishedAt?.getTime() || 0;
            return timeB - timeA; // Newest first
          });
        
        console.log(`✅ Found ${allData.length} total opinions, ${publishedOpinions.length} published`);
        callback(publishedOpinions);
      },
      (error: any) => {
        console.error('❌ Error in published opinions subscription:', error);
        if (onError) {
          onError(`Firestore error: ${error.message || 'Connection failed'}`);
        }
        callback([]);
      },
      {
        maxRetries: 5,
        initialDelay: 1500,
        backoffMultiplier: 2
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('❌ Failed to subscribe to published opinions:', error);
    if (onError) {
      onError(`Setup error: ${error.message}`);
    }
    return () => {};
  }
};

/**
 * Get all pending opinions (admin only)
 * FIX: Fetch entire collection, filter in JavaScript to avoid permission/index issues
 */
export const getPendingOpinions = async (): Promise<Opinion[]> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // CRITICAL: Ensure authentication before fetching
    await ensureAuthenticated();
    
    console.log('📝 Attempting to fetch pending opinions from path: artifacts/morning-pulse-app/public/data/opinions');
    console.log('👤 Current Auth Status:', auth?.currentUser ? 'Authenticated' : 'Anonymous/Guest');
    
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    
    // FIX: Fetch entire collection without where/orderBy to avoid permission errors
    const snapshot = await getDocs(opinionsRef);
    const allOpinions: Opinion[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      allOpinions.push({
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as Opinion);
    });

    // Filter for pending status in JavaScript memory
    const pendingOpinions = allOpinions
      .filter(opinion => opinion.status === 'pending')
      .sort((a, b) => {
        const timeA = a.submittedAt?.getTime() || 0;
        const timeB = b.submittedAt?.getTime() || 0;
        return timeB - timeA; // Newest first
      });

    console.log(`✅ Fetched ${allOpinions.length} total opinions, ${pendingOpinions.length} pending`);
    return pendingOpinions;
  } catch (error: any) {
    console.error('❌ Error fetching pending opinions:', error);
    throw new Error(`Failed to fetch pending opinions: ${error.message}`);
  }
};

/**
 * Subscribe to pending opinions with real-time updates (admin only)
 * Reads directly from Firestore using onSnapshot
 */
export const subscribeToPendingOpinions = (
  callback: (opinions: Opinion[]) => void,
  onError?: (error: string) => void
): (() => void) => {
  const db = getDb();
  if (!db) {
    console.warn('Firebase not initialized, returning empty unsubscribe');
    if (onError) onError('Firebase not initialized');
    return () => {};
  }

  try {
    console.log('📝 Subscribing to pending opinions in Firestore...');
    
    const enhancedFirestore = EnhancedFirestore.getInstance(db);
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    const q = query(opinionsRef);

    const unsubscribe = enhancedFirestore.subscribeWithRetry<Array<{ id: string; [key: string]: any }>>(
      q,
      (data) => {
        // Filter and sort in JavaScript memory
        const allData = data.map((doc: any) => ({
          id: doc.id,
          ...doc,
          submittedAt: doc.submittedAt?.toDate?.() || new Date(),
          publishedAt: doc.publishedAt?.toDate?.() || null,
        })) as Opinion[];
        
        // Filter for pending status and sort by submittedAt descending
        const pendingOpinions = allData
          .filter(item => item.status === 'pending')
          .sort((a, b) => {
            const timeA = a.submittedAt?.getTime() || 0;
            const timeB = b.submittedAt?.getTime() || 0;
            return timeB - timeA; // Newest first
          });
        
        console.log(`✅ Found ${allData.length} total opinions, ${pendingOpinions.length} pending`);
        callback(pendingOpinions);
      },
      (error: any) => {
        console.error('❌ Error in pending opinions subscription:', error);
        if (onError) {
          onError(`Firestore error: ${error.message || 'Connection failed'}`);
        }
        callback([]);
      },
      {
        maxRetries: 5,
        initialDelay: 1500,
        backoffMultiplier: 2
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error('❌ Failed to subscribe to pending opinions:', error);
    if (onError) {
      onError(`Setup error: ${error.message}`);
    }
    return () => {};
  }
};

/**
 * Approve an opinion (change status to 'published')
 */
export const approveOpinion = async (
  opinionId: string,
  reviewedBy?: string,
  replacementFinalImageUrl?: string,
  editorNotes?: string
): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // CRITICAL: Ensure authentication before write operation
    await ensureAuthenticated();
    console.log('✅ Authentication verified for approval');
    
    // Use exact mandatory path structure
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', opinionId);

    // SAFETY NET: ensure finalImageUrl exists before publishing
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Opinion not found');

    const existing = snap.data() as any;
    const suggested = typeof existing?.suggestedImageUrl === 'string' ? existing.suggestedImageUrl : '';
    const existingFinal = typeof existing?.finalImageUrl === 'string' ? existing.finalImageUrl : '';
    const legacy = typeof existing?.imageUrl === 'string' ? existing.imageUrl : '';

    // Editorial Gate:
    // - If editor uploaded a replacement, use that.
    // - Else keep existing finalImageUrl if present.
    // - Else fallback to suggestedImageUrl, then legacy imageUrl.
    const candidate = replacementFinalImageUrl || existingFinal || suggested || legacy;
    const hasValidUrl = /^https?:\/\//i.test(candidate);
    const finalImageUrl = hasValidUrl ? candidate : getImageByTopic(existing?.headline || '', opinionId);

    const patch: any = {
      status: 'published',
      isPublished: true,
      reviewedBy: reviewedBy || null,
      publishedAt: Date.now(),
      finalImageUrl,
      // Keep legacy field aligned for older UIs
      imageUrl: finalImageUrl,
    };
    if (!hasValidUrl) patch.imageGeneratedAt = new Date().toISOString();
    if (editorNotes) patch.editorNotes = editorNotes;
    
    // Direct Firestore update with merge
    await setDoc(docRef, patch, { merge: true });
    
    console.log('✅ Opinion approved:', opinionId);
  } catch (error: any) {
    console.error('❌ Error approving opinion:', error);
    throw new Error(`Failed to approve opinion: ${error.message}`);
  }
};

/**
 * Reject an opinion (change status to 'rejected')
 */
export const rejectOpinion = async (opinionId: string, reviewedBy?: string): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    // CRITICAL: Ensure authentication before write operation
    await ensureAuthenticated();
    console.log('✅ Authentication verified for rejection');
    
    // Use exact mandatory path structure
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', opinionId);
    
    // Direct Firestore update with merge
    await setDoc(docRef, {
      status: 'rejected',
      updatedAt: Date.now(),
    }, { merge: true });
    
    console.log('✅ Opinion rejected:', opinionId);
  } catch (error: any) {
    console.error('❌ Error rejecting opinion:', error);
    throw new Error(`Failed to reject opinion: ${error.message}`);
  }
};

/**
 * NEW: Claim a story for editing (Editor takes ownership)
 * Changes status from 'pending' to 'in-review'
 * Stores original body for reference
 */
export const claimStory = async (
  storyId: string,
  editorId: string,
  editorName: string
): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', storyId);
    
    // Get current story to save original body
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Story not found');
    }
    
    const currentData = snap.data();
    
    // Check if already claimed by someone else
    if (currentData.claimedBy && currentData.claimedBy !== editorId) {
      throw new Error(`Story is already claimed by ${currentData.claimedByName || 'another editor'}`);
    }
    
    // Claim the story
    await setDoc(docRef, {
      status: 'in-review',
      claimedBy: editorId,
      claimedByName: editorName,
      claimedAt: Timestamp.now(),
      originalBody: currentData.originalBody || currentData.body, // Preserve original if not already saved
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    console.log('✅ Story claimed by editor:', editorName);
  } catch (error: any) {
    console.error('❌ Error claiming story:', error);
    throw new Error(`Failed to claim story: ${error.message}`);
  }
};

/**
 * NEW: Release a claimed story (return to pending queue)
 * Editor releases ownership, story returns to 'pending'
 */
export const releaseStory = async (storyId: string, editorId: string): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', storyId);
    
    // Verify the editor is the one who claimed it
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Story not found');
    }
    
    const currentData = snap.data();
    if (currentData.claimedBy !== editorId) {
      throw new Error('You can only release stories you have claimed');
    }
    
    // Release the story
    await setDoc(docRef, {
      status: 'pending',
      claimedBy: null,
      claimedByName: null,
      claimedAt: null,
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    console.log('✅ Story released back to pending queue');
  } catch (error: any) {
    console.error('❌ Error releasing story:', error);
    throw new Error(`Failed to release story: ${error.message}`);
  }
};

/**
 * NEW: Return story to writer with feedback
 * Changes status back to 'pending' and adds editor notes
 */
export const returnToWriter = async (
  storyId: string,
  editorNotes: string,
  editorId: string
): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', storyId);
    
    await setDoc(docRef, {
      status: 'pending',
      editorNotes: editorNotes,
      claimedBy: null,
      claimedByName: null,
      claimedAt: null,
      returnedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    console.log('✅ Story returned to writer with feedback');
  } catch (error: any) {
    console.error('❌ Error returning story to writer:', error);
    throw new Error(`Failed to return story: ${error.message}`);
  }
};

/**
 * NEW: Submit draft for review (Writer action)
 * Changes status from 'draft' to 'pending'
 */
export const submitForReview = async (storyId: string): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', storyId);
    
    await setDoc(docRef, {
      status: 'pending',
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    console.log('✅ Draft submitted for review');
  } catch (error: any) {
    console.error('❌ Error submitting for review:', error);
    throw new Error(`Failed to submit for review: ${error.message}`);
  }
};

/**
 * NEW: Schedule story for future publication
 * Sets scheduledFor timestamp and status to 'scheduled'
 */
export const schedulePublication = async (
  storyId: string,
  scheduledFor: Date
): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', storyId);
    
    await setDoc(docRef, {
      status: 'scheduled',
      scheduledFor: Timestamp.fromDate(scheduledFor),
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    console.log('✅ Publication scheduled for:', scheduledFor);
  } catch (error: any) {
    console.error('❌ Error scheduling publication:', error);
    throw new Error(`Failed to schedule publication: ${error.message}`);
  }
};

/**
 * NEW: Archive a published story
 * Changes status to 'archived'
 */
export const archiveStory = async (storyId: string): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', storyId);
    
    await setDoc(docRef, {
      status: 'archived',
      archivedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    console.log('✅ Story archived');
  } catch (error: any) {
    console.error('❌ Error archiving story:', error);
    throw new Error(`Failed to archive story: ${error.message}`);
  }
};

/**
 * NEW: Auto-publish scheduled stories
 * Called by background listener to check and publish stories whose scheduled time has arrived
 */
export const checkAndPublishScheduledStories = async (): Promise<number> => {
  const db = getDb();
  if (!db) {
    console.warn('Firebase not initialized for auto-publisher');
    return 0;
  }

  try {
    await ensureAuthenticated();
    
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    const q = query(opinionsRef, where('status', '==', 'scheduled'));
    const snapshot = await getDocs(q);
    
    const now = new Date();
    let publishedCount = 0;
    
    const publishPromises = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const scheduledFor = data.scheduledFor?.toDate();
      
      if (!scheduledFor) {
        console.warn(`Story ${docSnap.id} is scheduled but has no scheduledFor timestamp`);
        return;
      }
      
      // Check if scheduled time has passed
      if (scheduledFor <= now) {
        console.log(`📰 Auto-publishing story: ${data.headline} (scheduled for ${scheduledFor})`);
        
        const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', docSnap.id);
        await setDoc(docRef, {
          status: 'published',
          isPublished: true,
          publishedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }, { merge: true });
        
        publishedCount++;
      }
    });
    
    await Promise.all(publishPromises);
    
    if (publishedCount > 0) {
      console.log(`✅ Auto-published ${publishedCount} scheduled stor${publishedCount === 1 ? 'y' : 'ies'}`);
    }
    
    return publishedCount;
  } catch (error: any) {
    console.error('❌ Error in auto-publisher:', error);
    return 0;
  }
};

/**
 * NEW: Get opinion by slug (with fallback to ID)
 * Used for public routing: /opinion/{slug}
 */
export const getOpinionBySlug = async (slugOrId: string): Promise<Opinion | null> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const opinionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions');
    
    // Try to find by slug first
    const slugQuery = query(opinionsRef, where('slug', '==', slugOrId), where('status', '==', 'published'));
    const slugSnapshot = await getDocs(slugQuery);
    
    if (!slugSnapshot.empty) {
      const docSnap = slugSnapshot.docs[0];
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as Opinion;
    }
    
    // Fallback: Try as document ID
    const docRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', slugOrId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Only return if published
      if (data.status === 'published') {
        return {
          id: docSnap.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          publishedAt: data.publishedAt?.toDate?.() || null,
        } as Opinion;
      }
    }
    
    console.log(`❌ Opinion not found for slug/ID: ${slugOrId}`);
    return null;
  } catch (error: any) {
    console.error('❌ Error fetching opinion by slug:', error);
    throw new Error(`Failed to fetch opinion: ${error.message}`);
  }
};

/**
 * NEW: Create a version snapshot of an opinion
 * Called automatically on every save operation
 * Stores in sub-collection: opinions/{opinionId}/versions/{versionId}
 */
export const createVersionSnapshot = async (
  opinionId: string,
  headline: string,
  subHeadline: string,
  body: string,
  savedBy: string,
  savedByName: string
): Promise<string> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    // Get current version count
    const versionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', opinionId, 'versions');
    const versionsSnapshot = await getDocs(versionsRef);
    const versionNumber = versionsSnapshot.size + 1;
    
    const versionData = {
      opinionId,
      headline,
      subHeadline,
      body,
      savedBy,
      savedByName,
      savedAt: Timestamp.now(),
      versionNumber,
    };
    
    const versionDocRef = await addDoc(versionsRef, versionData);
    console.log(`✅ Version snapshot created: v${versionNumber} for opinion ${opinionId}`);
    return versionDocRef.id;
  } catch (error: any) {
    console.error('❌ Error creating version snapshot:', error);
    // Don't throw - snapshots are optional, don't block main save operation
    return '';
  }
};

/**
 * NEW: Get all version history for an opinion
 * Returns versions sorted by versionNumber descending (newest first)
 */
export const getVersionHistory = async (opinionId: string): Promise<OpinionVersion[]> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const versionsRef = collection(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', opinionId, 'versions');
    const versionsSnapshot = await getDocs(versionsRef);
    
    const versions: OpinionVersion[] = [];
    versionsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      versions.push({
        id: docSnap.id,
        opinionId,
        headline: data.headline,
        subHeadline: data.subHeadline,
        body: data.body,
        savedBy: data.savedBy,
        savedByName: data.savedByName,
        savedAt: data.savedAt?.toDate?.() || new Date(),
        versionNumber: data.versionNumber || 0,
      });
    });
    
    // Sort by version number descending (newest first)
    versions.sort((a, b) => b.versionNumber - a.versionNumber);
    
    console.log(`✅ Loaded ${versions.length} versions for opinion ${opinionId}`);
    return versions;
  } catch (error: any) {
    console.error('❌ Error fetching version history:', error);
    return [];
  }
};

/**
 * NEW: Restore opinion to a previous version
 * Updates the main opinion document with historical data
 */
export const restoreVersion = async (
  opinionId: string,
  version: OpinionVersion,
  restoredBy: string,
  restoredByName: string
): Promise<void> => {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  try {
    await ensureAuthenticated();
    
    const opinionRef = doc(db, 'artifacts', 'morning-pulse-app', 'public', 'data', 'opinions', opinionId);
    
    // Create a snapshot of current state before restoring (for rollback safety)
    const currentSnap = await getDoc(opinionRef);
    if (currentSnap.exists()) {
      const currentData = currentSnap.data();
      await createVersionSnapshot(
        opinionId,
        currentData.headline || '',
        currentData.subHeadline || '',
        currentData.body || '',
        restoredBy,
        `${restoredByName} (before restore)`
      );
    }
    
    // Restore the version data
    await setDoc(opinionRef, {
      headline: version.headline,
      subHeadline: version.subHeadline,
      body: version.body,
      restoredFrom: `v${version.versionNumber}`,
      restoredAt: Timestamp.now(),
      restoredBy,
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    console.log(`✅ Restored opinion ${opinionId} to version ${version.versionNumber}`);
  } catch (error: any) {
    console.error('❌ Error restoring version:', error);
    throw new Error(`Failed to restore version: ${error.message}`);
  }
};

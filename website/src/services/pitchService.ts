/**
 * Story Pitch Service
 * Handles CRUD operations for story pitches
 * Pitches are stored at: /artifacts/{appId}/public/data/storyPitches/{pitchId}
 */

import { 
  getFirestore, 
  collection, 
  query, 
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { StoryPitch, PitchStatus } from '../../types';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

// Get Firestore instance
const getDb = (): Firestore => {
  try {
    const app = getApp();
    return getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

// Helper to get collection reference
const getPitchesCollection = () => {
  const db = getDb();
  return collection(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches');
};

// Helper to convert Firestore doc to StoryPitch
const docToPitch = (docSnap: any): StoryPitch => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    writerId: data.writerId || '',
    writerName: data.writerName || '',
    writerEmail: data.writerEmail || '',
    title: data.title || '',
    summary: data.summary || '',
    angle: data.angle || '',
    proposedCategory: data.proposedCategory,
    estimatedWordCount: data.estimatedWordCount,
    proposedDeadline: data.proposedDeadline?.toDate?.() || undefined,
    sources: data.sources,
    relevance: data.relevance,
    status: data.status || 'draft',
    submittedAt: data.submittedAt?.toDate?.() || undefined,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || undefined,
    reviewedBy: data.reviewedBy,
    reviewedByName: data.reviewedByName,
    reviewedAt: data.reviewedAt?.toDate?.() || undefined,
    editorFeedback: data.editorFeedback,
    rejectionReason: data.rejectionReason,
    convertedToOpinionId: data.convertedToOpinionId,
    convertedAt: data.convertedAt?.toDate?.() || undefined,
    priority: data.priority,
    assignedEditorId: data.assignedEditorId,
    assignedEditorName: data.assignedEditorName,
  };
};

/**
 * Create a new story pitch (draft or submitted)
 */
export const createPitch = async (
  pitchData: {
    title: string;
    summary: string;
    angle: string;
    proposedCategory?: string;
    estimatedWordCount?: number;
    proposedDeadline?: Date;
    sources?: string;
    relevance?: string;
  },
  submitImmediately: boolean = false
): Promise<string> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User must be authenticated to create a pitch');
  }

  const db = getDb();
  const pitchesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches');
  const newPitchRef = doc(pitchesRef);
  
  const pitch: Partial<StoryPitch> = {
    writerId: user.uid,
    writerName: user.displayName || 'Unknown Writer',
    writerEmail: user.email || '',
    title: pitchData.title,
    summary: pitchData.summary,
    angle: pitchData.angle,
    proposedCategory: pitchData.proposedCategory,
    estimatedWordCount: pitchData.estimatedWordCount,
    proposedDeadline: pitchData.proposedDeadline,
    sources: pitchData.sources,
    relevance: pitchData.relevance,
    status: submitImmediately ? 'submitted' : 'draft',
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  if (submitImmediately) {
    (pitch as any).submittedAt = serverTimestamp();
  }

  await setDoc(newPitchRef, pitch);
  console.log('✅ Pitch created:', newPitchRef.id);
  
  return newPitchRef.id;
};

/**
 * Update an existing pitch
 */
export const updatePitch = async (
  pitchId: string,
  updates: Partial<Pick<StoryPitch, 
    'title' | 'summary' | 'angle' | 'proposedCategory' | 
    'estimatedWordCount' | 'proposedDeadline' | 'sources' | 'relevance'
  >>
): Promise<void> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  await updateDoc(pitchRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  
  console.log('✅ Pitch updated:', pitchId);
};

/**
 * Submit a draft pitch for review
 */
export const submitPitch = async (pitchId: string): Promise<void> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  await updateDoc(pitchRef, {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  console.log('✅ Pitch submitted for review:', pitchId);
};

/**
 * Approve a pitch (editor action)
 */
export const approvePitch = async (
  pitchId: string,
  editorId: string,
  editorName: string,
  feedback?: string,
  priority?: 'low' | 'normal' | 'high' | 'urgent'
): Promise<void> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  await updateDoc(pitchRef, {
    status: 'approved',
    reviewedBy: editorId,
    reviewedByName: editorName,
    reviewedAt: serverTimestamp(),
    editorFeedback: feedback || null,
    priority: priority || 'normal',
    updatedAt: serverTimestamp(),
  });
  
  console.log('✅ Pitch approved:', pitchId);
};

/**
 * Reject a pitch (editor action)
 */
export const rejectPitch = async (
  pitchId: string,
  editorId: string,
  editorName: string,
  reason: string
): Promise<void> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  await updateDoc(pitchRef, {
    status: 'rejected',
    reviewedBy: editorId,
    reviewedByName: editorName,
    reviewedAt: serverTimestamp(),
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });
  
  console.log('✅ Pitch rejected:', pitchId);
};

/**
 * Mark pitch as converted to article
 */
export const markPitchConverted = async (
  pitchId: string,
  opinionId: string
): Promise<void> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  await updateDoc(pitchRef, {
    status: 'converted',
    convertedToOpinionId: opinionId,
    convertedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  console.log('✅ Pitch marked as converted:', pitchId, '→', opinionId);
};

/**
 * Get a single pitch by ID
 */
export const getPitch = async (pitchId: string): Promise<StoryPitch | null> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  const snap = await getDoc(pitchRef);
  if (snap.exists()) {
    return docToPitch(snap);
  }
  return null;
};

/**
 * Get all pitches by a specific writer
 */
export const getWriterPitches = async (writerId: string): Promise<StoryPitch[]> => {
  const pitchesRef = getPitchesCollection();
  const q = query(
    pitchesRef, 
    where('writerId', '==', writerId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const pitches: StoryPitch[] = [];
  
  snapshot.forEach((docSnap) => {
    pitches.push(docToPitch(docSnap));
  });
  
  return pitches;
};

/**
 * Get all submitted pitches (for editorial review)
 */
export const getSubmittedPitches = async (): Promise<StoryPitch[]> => {
  const pitchesRef = getPitchesCollection();
  const q = query(
    pitchesRef, 
    where('status', '==', 'submitted'),
    orderBy('submittedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const pitches: StoryPitch[] = [];
  
  snapshot.forEach((docSnap) => {
    pitches.push(docToPitch(docSnap));
  });
  
  return pitches;
};

/**
 * Get all approved pitches (ready for writing)
 */
export const getApprovedPitches = async (): Promise<StoryPitch[]> => {
  const pitchesRef = getPitchesCollection();
  const q = query(
    pitchesRef, 
    where('status', '==', 'approved'),
    orderBy('reviewedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const pitches: StoryPitch[] = [];
  
  snapshot.forEach((docSnap) => {
    pitches.push(docToPitch(docSnap));
  });
  
  return pitches;
};

/**
 * Get pitches by status
 */
export const getPitchesByStatus = async (status: PitchStatus): Promise<StoryPitch[]> => {
  const pitchesRef = getPitchesCollection();
  const q = query(
    pitchesRef, 
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const pitches: StoryPitch[] = [];
  
  snapshot.forEach((docSnap) => {
    pitches.push(docToPitch(docSnap));
  });
  
  return pitches;
};

/**
 * Delete a pitch (writer can delete their own drafts)
 */
export const deletePitch = async (pitchId: string): Promise<void> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  await deleteDoc(pitchRef);
  console.log('✅ Pitch deleted:', pitchId);
};

/**
 * Assign an editor to review a pitch
 */
export const assignEditorToPitch = async (
  pitchId: string,
  editorId: string,
  editorName: string
): Promise<void> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  await updateDoc(pitchRef, {
    assignedEditorId: editorId,
    assignedEditorName: editorName,
    updatedAt: serverTimestamp(),
  });
  
  console.log('✅ Editor assigned to pitch:', pitchId);
};

/**
 * Set pitch priority
 */
export const setPitchPriority = async (
  pitchId: string,
  priority: 'low' | 'normal' | 'high' | 'urgent'
): Promise<void> => {
  const db = getDb();
  const pitchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'storyPitches', pitchId);
  
  await updateDoc(pitchRef, {
    priority,
    updatedAt: serverTimestamp(),
  });
  
  console.log('✅ Pitch priority set:', pitchId, priority);
};

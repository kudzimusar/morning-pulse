/**
 * Writer Management Service
 * Handles registration, approval, and management of writers
 * Writers are stored at root level: /writers/{uid}
 * Approved writers are also added to /staff/{uid} with roles: ['writer']
 */

import { 
  getFirestore, 
  collection, 
  query, 
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { getApp } from 'firebase/app';

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

export interface Writer {
  uid: string;
  email: string;
  name: string;
  bio?: string;
  expertise?: string[];
  status: 'pending_approval' | 'approved' | 'rejected';
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // ============================================
  // WRITER GOVERNANCE FIELDS (Sprint 1)
  // ============================================
  
  // Writer tier classification
  tier?: 'staff' | 'freelance' | 'contributor' | 'guest';
  
  // Topic areas/beats the writer covers
  beats?: string[];
  
  // Assigned editor oversight
  editorId?: string;
  editorName?: string;
  
  // Contract information
  contract?: {
    exclusive?: boolean;
    startDate?: Date;
    endDate?: Date;
    contractType?: 'exclusive' | 'non-exclusive' | 'guest';
  };
  
  // Suspension status (enterprise governance)
  suspension?: {
    isSuspended: boolean;
    reason?: string;
    suspendedAt?: Date;
    suspendedUntil?: Date;
    suspendedBy?: string;
    suspendedByName?: string;
  };
  
  // Compliance tracking
  compliance?: {
    ndaAccepted?: boolean;
    ndaAcceptedAt?: Date;
    lastStyleGuideAck?: Date;
    termsAccepted?: boolean;
    termsAcceptedAt?: Date;
  };
}

/**
 * Register a new writer
 * Creates Firebase Auth user and writer document with status: 'pending_approval'
 */
export const registerWriter = async (
  email: string,
  password: string,
  name: string,
  bio?: string
): Promise<string> => {
  const auth = getAuth();
  const db = getDb();
  
  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // 2. Create writer document at root level: /writers/{uid}
    const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', uid);
    await setDoc(writerRef, {
      email,
      name,
      bio: bio || '',
      expertise: [],
      status: 'pending_approval',
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Writer registered:', uid);
    return uid;
  } catch (error: any) {
    console.error('❌ Writer registration failed:', error);
    throw new Error(`Failed to register writer: ${error.message}`);
  }
};

/**
 * Helper to convert Firestore doc data to Writer interface
 */
const docToWriter = (snap: any): Writer => {
  const data = snap.data();
  return {
    uid: snap.id,
    email: data.email || '',
    name: data.name || '',
    bio: data.bio,
    expertise: data.expertise || [],
    status: data.status || 'pending_approval',
    approvedAt: data.approvedAt?.toDate?.() || undefined,
    rejectedReason: data.rejectedReason,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || undefined,
    // Governance fields (Sprint 1)
    tier: data.tier,
    beats: data.beats || [],
    editorId: data.editorId,
    editorName: data.editorName,
    contract: data.contract ? {
      exclusive: data.contract.exclusive,
      startDate: data.contract.startDate?.toDate?.() || undefined,
      endDate: data.contract.endDate?.toDate?.() || undefined,
      contractType: data.contract.contractType,
    } : undefined,
    suspension: data.suspension ? {
      isSuspended: data.suspension.isSuspended || false,
      reason: data.suspension.reason,
      suspendedAt: data.suspension.suspendedAt?.toDate?.() || undefined,
      suspendedUntil: data.suspension.suspendedUntil?.toDate?.() || undefined,
      suspendedBy: data.suspension.suspendedBy,
      suspendedByName: data.suspension.suspendedByName,
    } : undefined,
    compliance: data.compliance ? {
      ndaAccepted: data.compliance.ndaAccepted,
      ndaAcceptedAt: data.compliance.ndaAcceptedAt?.toDate?.() || undefined,
      lastStyleGuideAck: data.compliance.lastStyleGuideAck?.toDate?.() || undefined,
      termsAccepted: data.compliance.termsAccepted,
      termsAcceptedAt: data.compliance.termsAcceptedAt?.toDate?.() || undefined,
    } : undefined,
  };
};

/**
 * Get writer by UID
 */
export const getWriter = async (uid: string): Promise<Writer | null> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', uid);
  
  try {
    const snap = await getDoc(writerRef);
    if (snap.exists()) {
      return docToWriter(snap);
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching writer:', error);
    throw new Error(`Failed to fetch writer: ${error.message}`);
  }
};

/**
 * Get writer by current auth user
 */
export const getCurrentWriter = async (): Promise<Writer | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return getWriter(user.uid);
};

/**
 * Get all pending writers (for admin approval)
 */
export const getPendingWriters = async (): Promise<Writer[]> => {
  const db = getDb();
  const writersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writers');
  const q = query(writersRef, where('status', '==', 'pending_approval'));
  
  try {
    const snapshot = await getDocs(q);
    const writers: Writer[] = [];
    
    snapshot.forEach((docSnap) => {
      writers.push(docToWriter(docSnap));
    });
    
    return writers.sort((a, b) => {
      // Sort by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error: any) {
    console.error('Error fetching pending writers:', error);
    throw new Error(`Failed to fetch pending writers: ${error.message}`);
  }
};

/**
 * Get all approved writers
 */
export const getApprovedWriters = async (): Promise<Writer[]> => {
  const db = getDb();
  const writersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writers');
  const q = query(writersRef, where('status', '==', 'approved'));
  
  try {
    const snapshot = await getDocs(q);
    const writers: Writer[] = [];
    
    snapshot.forEach((docSnap) => {
      writers.push(docToWriter(docSnap));
    });
    
    return writers.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (error: any) {
    console.error('Error fetching approved writers:', error);
    throw new Error(`Failed to fetch approved writers: ${error.message}`);
  }
};

/**
 * Approve a writer (admin only)
 * Updates writer status and adds to staff collection
 */
export const approveWriter = async (uid: string): Promise<void> => {
  const db = getDb();
  
  try {
    // 1. Get writer data
    const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', uid);
    const writerSnap = await getDoc(writerRef);
    
    if (!writerSnap.exists()) {
      throw new Error('Writer not found');
    }
    
    const writerData = writerSnap.data();
    
    // 2. Update writer status
    await updateDoc(writerRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // 3. Add to staff collection with writer role
    const staffRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'staff', uid);
    await setDoc(staffRef, {
      email: writerData.email,
      name: writerData.name,
      roles: ['writer'],
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    }, { merge: true });
    
    console.log('✅ Writer approved:', uid);
    
    // TODO: Send approval email notification
  } catch (error: any) {
    console.error('❌ Error approving writer:', error);
    throw new Error(`Failed to approve writer: ${error.message}`);
  }
};

/**
 * Reject a writer (admin only)
 */
export const rejectWriter = async (uid: string, reason: string): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', uid);
  
  try {
    await updateDoc(writerRef, {
      status: 'rejected',
      rejectedReason: reason,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Writer rejected:', uid);
    
    // TODO: Send rejection email notification
  } catch (error: any) {
    console.error('❌ Error rejecting writer:', error);
    throw new Error(`Failed to reject writer: ${error.message}`);
  }
};

/**
 * Update writer profile
 */
export const updateWriterProfile = async (
  uid: string,
  updates: {
    name?: string;
    bio?: string;
    expertise?: string[];
  }
): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', uid);
  
  try {
    await updateDoc(writerRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    // Also update staff collection if writer is approved
    const staffRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'staff', uid);
    const staffSnap = await getDoc(staffRef);
    if (staffSnap.exists()) {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (Object.keys(updateData).length > 0) {
        await updateDoc(staffRef, {
          ...updateData,
          lastActive: serverTimestamp(),
        });
      }
    }
    
    console.log('✅ Writer profile updated:', uid);
  } catch (error: any) {
    console.error('❌ Error updating writer profile:', error);
    throw new Error(`Failed to update writer profile: ${error.message}`);
  }
};

/**
 * Check if current user is an approved writer
 */
export const isApprovedWriter = async (): Promise<boolean> => {
  const writer = await getCurrentWriter();
  return writer?.status === 'approved' || false;
};

// ============================================
// WRITER GOVERNANCE FUNCTIONS (Sprint 1)
// ============================================

/**
 * Assign an editor to oversee a writer
 */
export const assignEditorToWriter = async (
  writerUid: string, 
  editorUid: string,
  editorName: string
): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', writerUid);
  
  try {
    await updateDoc(writerRef, {
      editorId: editorUid,
      editorName: editorName,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Editor assigned to writer:', writerUid);
  } catch (error: any) {
    console.error('❌ Error assigning editor:', error);
    throw new Error(`Failed to assign editor: ${error.message}`);
  }
};

/**
 * Remove editor assignment from writer
 */
export const removeEditorFromWriter = async (writerUid: string): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', writerUid);
  
  try {
    await updateDoc(writerRef, {
      editorId: null,
      editorName: null,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Editor removed from writer:', writerUid);
  } catch (error: any) {
    console.error('❌ Error removing editor:', error);
    throw new Error(`Failed to remove editor: ${error.message}`);
  }
};

/**
 * Set writer tier (staff, freelance, contributor, guest)
 */
export const setWriterTier = async (
  writerUid: string, 
  tier: 'staff' | 'freelance' | 'contributor' | 'guest'
): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', writerUid);
  
  try {
    await updateDoc(writerRef, {
      tier: tier,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Writer tier set:', writerUid, tier);
  } catch (error: any) {
    console.error('❌ Error setting writer tier:', error);
    throw new Error(`Failed to set writer tier: ${error.message}`);
  }
};

/**
 * Update writer beats (topic areas)
 */
export const setWriterBeats = async (
  writerUid: string, 
  beats: string[]
): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', writerUid);
  
  try {
    await updateDoc(writerRef, {
      beats: beats,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Writer beats updated:', writerUid, beats);
  } catch (error: any) {
    console.error('❌ Error updating writer beats:', error);
    throw new Error(`Failed to update writer beats: ${error.message}`);
  }
};

/**
 * Suspend a writer (enterprise governance with audit trail)
 */
export const suspendWriter = async (
  writerUid: string,
  reason: string,
  suspendedBy: string,
  suspendedByName: string,
  until?: Date
): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', writerUid);
  
  try {
    await updateDoc(writerRef, {
      suspension: {
        isSuspended: true,
        reason: reason,
        suspendedAt: serverTimestamp(),
        suspendedUntil: until || null,
        suspendedBy: suspendedBy,
        suspendedByName: suspendedByName,
      },
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Writer suspended:', writerUid);
  } catch (error: any) {
    console.error('❌ Error suspending writer:', error);
    throw new Error(`Failed to suspend writer: ${error.message}`);
  }
};

/**
 * Unsuspend a writer
 */
export const unsuspendWriter = async (writerUid: string): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', writerUid);
  
  try {
    await updateDoc(writerRef, {
      'suspension.isSuspended': false,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Writer unsuspended:', writerUid);
  } catch (error: any) {
    console.error('❌ Error unsuspending writer:', error);
    throw new Error(`Failed to unsuspend writer: ${error.message}`);
  }
};

/**
 * Check if a writer is currently suspended
 */
export const isWriterSuspended = async (writerUid: string): Promise<boolean> => {
  const writer = await getWriter(writerUid);
  if (!writer) return false;
  
  if (!writer.suspension?.isSuspended) return false;
  
  // Check if suspension has expired
  if (writer.suspension.suspendedUntil) {
    const now = new Date();
    if (now > writer.suspension.suspendedUntil) {
      // Auto-unsuspend if past expiration
      await unsuspendWriter(writerUid);
      return false;
    }
  }
  
  return true;
};

/**
 * Update writer compliance status (style guide acknowledgement)
 */
export const acknowledgeStyleGuide = async (writerUid: string): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', writerUid);
  
  try {
    await updateDoc(writerRef, {
      'compliance.lastStyleGuideAck': serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Style guide acknowledged:', writerUid);
  } catch (error: any) {
    console.error('❌ Error acknowledging style guide:', error);
    throw new Error(`Failed to acknowledge style guide: ${error.message}`);
  }
};

/**
 * Accept terms and conditions
 */
export const acceptTerms = async (writerUid: string): Promise<void> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', writerUid);
  
  try {
    await updateDoc(writerRef, {
      'compliance.termsAccepted': true,
      'compliance.termsAcceptedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Terms accepted:', writerUid);
  } catch (error: any) {
    console.error('❌ Error accepting terms:', error);
    throw new Error(`Failed to accept terms: ${error.message}`);
  }
};

/**
 * Get writers by tier
 */
export const getWritersByTier = async (tier: Writer['tier']): Promise<Writer[]> => {
  const db = getDb();
  const writersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writers');
  const q = query(
    writersRef, 
    where('status', '==', 'approved'),
    where('tier', '==', tier)
  );
  
  try {
    const snapshot = await getDocs(q);
    const writers: Writer[] = [];
    
    snapshot.forEach((docSnap) => {
      writers.push(docToWriter(docSnap));
    });
    
    return writers;
  } catch (error: any) {
    console.error('Error fetching writers by tier:', error);
    throw new Error(`Failed to fetch writers by tier: ${error.message}`);
  }
};

/**
 * Get writers assigned to a specific editor
 */
export const getWritersByEditor = async (editorUid: string): Promise<Writer[]> => {
  const db = getDb();
  const writersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'writers');
  const q = query(
    writersRef, 
    where('status', '==', 'approved'),
    where('editorId', '==', editorUid)
  );
  
  try {
    const snapshot = await getDocs(q);
    const writers: Writer[] = [];
    
    snapshot.forEach((docSnap) => {
      writers.push(docToWriter(docSnap));
    });
    
    return writers;
  } catch (error: any) {
    console.error('Error fetching writers by editor:', error);
    throw new Error(`Failed to fetch writers by editor: ${error.message}`);
  }
};

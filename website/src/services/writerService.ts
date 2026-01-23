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
 * Get writer by UID
 */
export const getWriter = async (uid: string): Promise<Writer | null> => {
  const db = getDb();
  const writerRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'writers', uid);
  
  try {
    const snap = await getDoc(writerRef);
    if (snap.exists()) {
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
      };
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
      const data = docSnap.data();
      writers.push({
        uid: docSnap.id,
        email: data.email || '',
        name: data.name || '',
        bio: data.bio,
        expertise: data.expertise || [],
        status: data.status || 'pending_approval',
        approvedAt: data.approvedAt?.toDate?.() || undefined,
        rejectedReason: data.rejectedReason,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
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
      const data = docSnap.data();
      writers.push({
        uid: docSnap.id,
        email: data.email || '',
        name: data.name || '',
        bio: data.bio,
        expertise: data.expertise || [],
        status: 'approved',
        approvedAt: data.approvedAt?.toDate?.() || undefined,
        rejectedReason: data.rejectedReason,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || undefined,
      });
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

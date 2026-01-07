/**
 * Staff Management Service
 * Handles CRUD operations for staff members
 */

import { 
  getFirestore, 
  collection, 
  query, 
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

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

export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  roles: string[];
  createdAt?: Date;
  lastActive?: Date;
}

/**
 * Get all staff members
 */
export const getAllStaff = async (): Promise<StaffMember[]> => {
  const db = getDb();
  const staffRef = collection(db, 'staff');
  
  const snapshot = await getDocs(staffRef);
  const staff: StaffMember[] = [];
  
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    staff.push({
      uid: docSnap.id,
      email: data.email || '',
      name: data.name || '',
      roles: data.roles || [],
      createdAt: data.createdAt?.toDate?.() || undefined,
      lastActive: data.lastActive?.toDate?.() || undefined,
    });
  });
  
  return staff.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

/**
 * Get staff member by UID
 */
export const getStaffMember = async (uid: string): Promise<StaffMember | null> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  
  try {
    const snap = await getDoc(staffRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: snap.id,
        email: data.email || '',
        name: data.name || '',
        roles: data.roles || [],
        createdAt: data.createdAt?.toDate?.() || undefined,
        lastActive: data.lastActive?.toDate?.() || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting staff member:', error);
    return null;
  }
};

/**
 * Create or update staff member
 * Note: This requires admin role - should be checked in component
 */
export const upsertStaffMember = async (
  uid: string,
  email: string,
  name: string,
  roles: string[]
): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  
  const snap = await getDoc(staffRef);
  const existingData = snap.exists() ? snap.data() : null;
  
  await setDoc(staffRef, {
    email,
    name,
    roles,
    createdAt: existingData?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

/**
 * Update staff member roles
 */
export const updateStaffRoles = async (
  uid: string,
  roles: string[]
): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  
  await updateDoc(staffRef, {
    roles,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Update staff member last active timestamp
 */
export const updateLastActive = async (uid: string): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  
  try {
    await updateDoc(staffRef, {
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    // Fail silently - last active is not critical
    console.warn('Could not update last active:', error);
  }
};

/**
 * Delete staff member
 */
export const deleteStaffMember = async (uid: string): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  
  await deleteDoc(staffRef);
};

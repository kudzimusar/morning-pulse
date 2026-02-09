/**
 * Staff Management Service
 * Handles CRUD operations for staff members based on a single-role security model.
 */

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { WriterType } from '../types'; // Import the WriterType definition

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

export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  role: string; // A single, primary role
  writerType?: WriterType; // e.g., 'journalist' or 'pitch_writer'
  createdAt?: Date;
  lastActive?: Date;
  updatedAt?: Date;
  isActive: boolean;
  suspendedAt?: Date | null;
  suspendedBy?: string | null;
  suspendedByName?: string | null;
  invitedBy?: string;
  invitedByName?: string;
}

/**
 * Get all staff members from the /staff collection.
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
      role: data.role || 'writer', // Default to 'writer' for legacy data
      writerType: data.writerType,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt?.toDate?.() || undefined,
      lastActive: data.lastActive?.toDate?.() || undefined,
      updatedAt: data.updatedAt?.toDate?.() || undefined,
      suspendedAt: data.suspendedAt?.toDate?.() || null,
      suspendedBy: data.suspendedBy || null,
      suspendedByName: data.suspendedByName || null,
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
    });
  });
  
  return staff.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get a single staff member by their UID.
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
        role: data.role || 'writer',
        writerType: data.writerType,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt?.toDate?.() || undefined,
        lastActive: data.lastActive?.toDate?.() || undefined,
        updatedAt: data.updatedAt?.toDate?.() || undefined,
        suspendedAt: data.suspendedAt?.toDate?.() || null,
        suspendedBy: data.suspendedBy || null,
        suspendedByName: data.suspendedByName || null,
        invitedBy: data.invitedBy,
        invitedByName: data.invitedByName,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting staff member:', error);
    return null;
  }
};

/**
 * Update a staff member's role and, if applicable, their writer type.
 * This is the primary function for changing a user's permissions.
 */
export const updateStaffRole = async (
  uid: string,
  role: string,
  writerType?: WriterType
): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  
  const payload: { [key: string]: any } = {
    role,
    updatedAt: serverTimestamp(),
  };

  // Only set writerType if the role is 'writer'. Otherwise, clear it.
  if (role === 'writer') {
    payload.writerType = writerType || 'journalist'; // Default to journalist
  } else {
    payload.writerType = null; // Clear the writerType for non-writer roles
  }
  
  await updateDoc(staffRef, payload);
};

/**
 * Update staff member last active timestamp.
 */
export const updateLastActive = async (uid: string): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  try {
    await updateDoc(staffRef, { lastActive: serverTimestamp() });
  } catch (error) {
    console.warn('Could not update last active:', error);
  }
};

/**
 * Suspend a staff member, preventing them from logging in.
 */
export const suspendStaffMember = async (
  uid: string,
  suspendedBy: string,
  suspendedByName: string
): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  
  await updateDoc(staffRef, {
    isActive: false,
    suspendedAt: serverTimestamp(),
    suspendedBy,
    suspendedByName,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Reactivate a suspended staff member.
 */
export const activateStaffMember = async (uid: string): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  
  await updateDoc(staffRef, {
    isActive: true,
    suspendedAt: null,
    suspendedBy: null,
    suspendedByName: null,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete a staff member from the system.
 */
export const deleteStaffMember = async (uid: string): Promise<void> => {
  const db = getDb();
  const staffRef = doc(db, 'staff', uid);
  await deleteDoc(staffRef);
};

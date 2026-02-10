
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { StaffMember, StaffRole, WriterType, StaffInvite } from '../types';
import { getCurrentEditor } from './authService';

const db = getFirestore();
const staffCollection = collection(db, 'staff');
const invitesCollection = collection(db, 'staff_invites');

/**
 * Fetches all staff members from the 'staff' collection.
 */
export const getStaff = async (): Promise<StaffMember[]> => {
  const snapshot = await getDocs(staffCollection);
  return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as StaffMember));
};

/**
 * Fetches a single staff member by their UID.
 */
export const getStaffMember = async (uid: string): Promise<StaffMember | null> => {
  const docRef = doc(db, 'staff', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { ...docSnap.data(), uid: docSnap.id } as StaffMember : null;
};

/**
 * Updates the role and, if applicable, the writer type for a staff member.
 * This triggers the `setRoleOnStaffChange` Cloud Function.
 */
export const updateStaffRole = async (uid: string, role: StaffRole, writerType?: WriterType): Promise<void> => {
  const staffRef = doc(db, 'staff', uid);
  
  const payload: any = {
    role,
    updatedAt: serverTimestamp(),
  };

  // Only set writerType if the role is 'writer'. Otherwise, remove it.
  if (role === 'writer' && writerType) {
    payload.writerType = writerType;
  } else {
    payload.writerType = null; // Use null to explicitly remove the field
  }

  await updateDoc(staffRef, payload);
};

/**
 * Creates an invitation for a new staff member.
 */
export const createStaffInvite = async (email: string, name: string, role: StaffRole, writerType?: WriterType): Promise<void> => {
  const currentUser = getCurrentEditor();
  if (!currentUser) {
    throw new Error("You must be logged in to create an invite.");
  }

  const inviteRef = doc(invitesCollection); // Auto-generate ID

  const newInvite: any = {
    id: inviteRef.id,
    email,
    name,
    role,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    invitedBy: currentUser.uid,
    invitedByName: currentUser.displayName || 'Admin',
  };

  if (role === 'writer' && writerType) {
    newInvite.writerType = writerType;
  }

  await setDoc(inviteRef, newInvite);
};

/**
 * Update staff member last active timestamp.
 */
export const updateLastActive = async (uid: string): Promise<void> => {
  const db = getFirestore();
  const staffRef = doc(db, 'staff', uid);
  
  try {
    await updateDoc(staffRef, { 
      lastActive: serverTimestamp() 
    });
  } catch (error) {
    console.warn('Could not update last active:', error);
  }
};

/**
 * Suspend a staff member
 */
export const suspendStaffMember = async (
  uid: string,
  suspendedBy: string,
  suspendedByName: string
): Promise<void> => {
  const db = getFirestore();
  const staffRef = doc(db, 'staff', uid);
  
  await updateDoc(staffRef, {
    isActive: false,
    suspendedBy,
    suspendedByName,
    suspendedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Reactivate a suspended staff member
 */
export const activateStaffMember = async (uid: string): Promise<void> => {
  const db = getFirestore();
  const staffRef = doc(db, 'staff', uid);
  
  await updateDoc(staffRef, {
    isActive: true,
    suspendedBy: null,
    suspendedByName: null,
    suspendedAt: null,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Removes a staff member from the 'staff' collection.
 */
export const removeStaffMember = async (uid: string): Promise<void> => {
  const docRef = doc(db, 'staff', uid);
  await deleteDoc(docRef);
};

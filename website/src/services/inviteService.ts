/**
 * Staff Invitation Service
 * Handles secure invitation token generation, validation, and staff onboarding
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Firestore,
  Timestamp
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { getApp } from 'firebase/app';
import { StaffInvite, StaffMember } from '../types';
import { logStaffAction, AuditActions } from './auditService';

const APP_ID = (window as any).__app_id || 'morning-pulse-app';

/**
 * Get the base URL for GitHub Pages (includes /morning-pulse subdirectory)
 * @returns Base URL with /morning-pulse path
 */
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return origin + '/morning-pulse';
  }
  // Fallback for SSR
  return 'https://kudzimusar.github.io/morning-pulse';
};

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

// Get Auth instance
const getAuthInstance = () => {
  try {
    const app = getApp();
    return getAuth(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Firebase not initialized');
  }
};

/**
 * Generate a unique invite token using crypto.randomUUID()
 */
const generateInviteToken = (): string => {
  // Use crypto.randomUUID() for secure token generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers (less secure but functional)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Create a new staff invitation
 * @param email - Email address of invitee
 * @param name - Full name of invitee
 * @param roles - Array of roles to assign
 * @param invitedBy - UID of admin creating invite
 * @param invitedByName - Name of admin creating invite
 * @returns The created invite with token
 */
export const createStaffInvite = async (
  email: string,
  name: string,
  roles: string[],
  invitedBy: string,
  invitedByName: string
): Promise<StaffInvite> => {
  const db = getDb();
  const token = generateInviteToken();

  // Set expiry to 7 days from now
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const invite: StaffInvite = {
    id: token,
    email: email.toLowerCase().trim(),
    name: name.trim(),
    role: roles[0] as StaffRole, // Populate legacy role
    roles: roles as StaffRole[],
    invitedBy,
    invitedByName,
    createdAt: now,
    expiresAt,
    status: 'pending'
  };

  // Save to Firestore: /artifacts/{appId}/public/data/invites/{token}
  const inviteRef = doc(db, 'invites', token);

  await setDoc(inviteRef, {
    ...invite,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt)
  });

  console.log(`✅ [INVITE] Created invite for ${email} with token: ${token}`);

  return invite;
};

/**
 * Validate an invite token
 * @param token - The invite token to validate
 * @returns The invite if valid, null if invalid/expired/used
 */
export const validateInviteToken = async (token: string): Promise<StaffInvite | null> => {
  const db = getDb();

  try {
    const inviteRef = doc(db, 'invites', token);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      console.warn(`⚠️ [INVITE] Token not found: ${token}`);
      return null;
    }

    const data = inviteSnap.data();

    // Convert Firestore timestamps to Date objects
    const invite: StaffInvite = {
      id: inviteSnap.id,
      email: data.email,
      name: data.name,
      role: (data.roles?.[0] || data.role) as StaffRole,
      roles: (data.roles || [data.role]) as StaffRole[],
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      status: data.status || 'pending',
      usedBy: data.usedBy,
      usedAt: data.usedAt?.toDate(),
      revokedBy: data.revokedBy,
      revokedAt: data.revokedAt?.toDate()
    };

    // Check if invite is still valid
    if (invite.status !== 'pending') {
      console.warn(`⚠️ [INVITE] Token status is ${invite.status}: ${token}`);
      return null;
    }

    // Check if expired
    if (invite.expiresAt < new Date()) {
      console.warn(`⚠️ [INVITE] Token expired: ${token}`);
      // Update status to expired
      await updateDoc(inviteRef, { status: 'expired' });
      return null;
    }

    console.log(`✅ [INVITE] Valid token for ${invite.email}`);
    return invite;

  } catch (error) {
    console.error('Error validating invite token:', error);
    return null;
  }
};

/**
 * Create staff member from invite and mark invite as used
 * @param token - The invite token
 * @param password - Password for new account
 * @returns The created Firebase user
 */
export const createStaffFromInvite = async (
  token: string,
  password: string
): Promise<User> => {
  const db = getDb();
  const auth = getAuthInstance();

  // 1. Validate the invite
  const invite = await validateInviteToken(token);
  if (!invite) {
    throw new Error('Invalid or expired invitation token');
  }

  try {
    // 2. Create Firebase Auth user with email/password
    console.log(`📧 [INVITE] Creating auth user for ${invite.email}...`);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      invite.email,
      password
    );
    const user = userCredential.user;

    console.log(`✅ [INVITE] Auth user created with UID: ${user.uid}`);

    // 3. Create staff document at /staff/{uid}
    const staffRef = doc(db, 'staff', user.uid);

    const staffMember: Partial<StaffMember> = {
      uid: user.uid,
      email: invite.email,
      name: invite.name,
      roles: invite.roles,
      isActive: true,
      invitedBy: invite.invitedBy,
      invitedByName: invite.invitedByName,
      createdAt: new Date(),
      lastActive: new Date()
    };

    await setDoc(staffRef, {
      ...staffMember,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`✅ [INVITE] Staff document created at /staff/${user.uid}`);

    // 4. Mark invite as used
    const inviteRef = doc(db, 'invites', token);
    await updateDoc(inviteRef, {
      status: 'used',
      usedBy: user.uid,
      usedAt: serverTimestamp()
    });

    console.log(`✅ [INVITE] Invite marked as used: ${token}`);
    console.log(`🎉 [INVITE] ${invite.name} successfully joined as ${invite.roles.join(', ')}`);

    // 5. Log the action (new staff created from invite)
    try {
      await logStaffAction(
        AuditActions.STAFF_CREATED,
        invite.invitedBy,
        invite.invitedByName,
        user.uid,
        invite.name,
        undefined,
        invite.roles,
        {
          email: invite.email,
          source: 'invitation',
          inviteToken: token
        }
      );
    } catch (error) {
      // Don't fail the signup if audit logging fails
      console.warn('Could not log staff creation:', error);
    }

    return user;

  } catch (error: any) {
    console.error('❌ [INVITE] Error creating staff from invite:', error);

    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please contact an administrator.');
    }

    if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    }

    if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    }

    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
};

/**
 * Revoke an invite (admin action)
 * @param token - The invite token to revoke
 * @param revokedBy - UID of admin revoking
 */
export const revokeInvite = async (token: string, revokedBy: string): Promise<void> => {
  const db = getDb();
  const inviteRef = doc(db, 'invites', token);

  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) {
    throw new Error('Invite not found');
  }

  await updateDoc(inviteRef, {
    status: 'revoked',
    revokedBy,
    revokedAt: serverTimestamp()
  });

  console.log(`🚫 [INVITE] Invite revoked by ${revokedBy}: ${token}`);
};

/**
 * Get all pending invites (admin view)
 * @returns Array of pending invites
 */
export const getPendingInvites = async (): Promise<StaffInvite[]> => {
  const db = getDb();
  const invitesRef = collection(db, 'invites');
  const q = query(invitesRef, where('status', '==', 'pending'));

  const snapshot = await getDocs(q);
  const invites: StaffInvite[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    invites.push({
      id: docSnap.id,
      email: data.email,
      name: data.name,
      role: (data.roles?.[0] || data.role) as StaffRole,
      roles: (data.roles || [data.role]) as StaffRole[],
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      status: data.status || 'pending'
    });
  });

  // Sort by creation date (newest first)
  return invites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * Delete an invite (cleanup)
 * @param token - The invite token to delete
 */
export const deleteInvite = async (token: string): Promise<void> => {
  const db = getDb();
  const inviteRef = doc(db, 'invites', token);
  await deleteDoc(inviteRef);
  console.log(`🗑️ [INVITE] Deleted invite: ${token}`);
};

/**
 * Check if an email already has a pending invite
 * @param email - Email to check
 * @returns true if pending invite exists
 */
export const hasPendingInvite = async (email: string): Promise<boolean> => {
  const db = getDb();
  const invitesRef = collection(db, 'invites');
  const q = query(
    invitesRef,
    where('email', '==', email.toLowerCase().trim()),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Generate the join URL for an invite
 * @param token - The invite token
 * @param baseUrl - Base URL of the app (optional, defaults to current origin + base path)
 * @returns Full join URL with correct base path for GitHub Pages
 */
export const getInviteJoinUrl = (token: string, baseUrl?: string): string => {
  const base = baseUrl || getBaseUrl();
  return `${base}/#join?token=${token}`;
};

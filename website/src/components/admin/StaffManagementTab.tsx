/**
 * Staff Management Tab (Admin Only)
 * Manage staff members, assign roles, and define writer types.
 * Aligns with the new single-role RBAC security model.
 */
import React, { useEffect, useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  getAllStaff,
  updateStaffRole,
  deleteStaffMember,
  suspendStaffMember,
  activateStaffMember,
} from '../../services/staffService';
import {
  createStaffInvite,
  getPendingInvites,
  revokeInvite,
  getInviteJoinUrl,
  hasPendingInvite,
} from '../../services/inviteService';
import {
  logStaffAction,
  AuditActions,
  getRecentAuditLogs,
  formatAuditAction,
  formatAuditDetails,
} from '../../services/auditService';
import { StaffMember, StaffInvite, AuditLog, WriterType } from '../../../types';

interface StaffManagementTabProps {
  firebaseInstances: { auth: any; db: Firestore } | null;
  currentUserRole: string; // The single, primary role of the logged-in user.
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const StaffManagementTab: React.FC<StaffManagementTabProps> = ({
  firebaseInstances,
  currentUserRole,
  showToast,
}) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<StaffInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // --- New Staff State ---
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<string>('');
  const [newStaffWriterType, setNewStaffWriterType] = useState<WriterType>('journalist');
  
  const [createdInviteToken, setCreatedInviteToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Audit log modal state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Define assignable roles based on the current user's role
  const ASSIGNABLE_ROLES = (() => {
    if (currentUserRole === 'super_admin') {
      return ['bureau_chief', 'admin', 'editor', 'writer'];
    }
    if (currentUserRole === 'bureau_chief') {
      return ['editor', 'writer'];
    }
    return [];
  })();

  useEffect(() => {
    loadStaff();
    loadPendingInvites();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const staffList = await getAllStaff();
      setStaff(staffList);
    } catch (error: any) {
      console.error('Error loading staff:', error);
      showToast('Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const invites = await getPendingInvites();
      setPendingInvites(invites);
    } catch (error: any) {
      console.error('Error loading invites:', error);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffName || !newStaffRole) {
      showToast('Please fill in email, name, and select a role', 'error');
      return;
    }
    if (!firebaseInstances?.auth?.currentUser) {
      showToast('You must be logged in to create invites', 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const hasPending = await hasPendingInvite(newStaffEmail);
      if (hasPending) {
        showToast('This email already has a pending invitation', 'error');
        setIsSubmitting(false);
        return;
      }

      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const invitedByName = currentStaffMember?.name || currentUser.email || 'Admin';

      const invite = await createStaffInvite(
        newStaffEmail,
        newStaffName,
        newStaffRole,
        newStaffRole === 'writer' ? newStaffWriterType : undefined,
        currentUser.uid,
        invitedByName
      );

      await logStaffAction(
        AuditActions.INVITE_CREATED,
        currentUser.uid,
        invitedByName,
        undefined,
        newStaffEmail,
        undefined,
        [newStaffRole],
        { token: invite.id, writerType: newStaffRole === 'writer' ? newStaffWriterType : undefined }
      );

      showToast('Invitation created successfully!', 'success');
      setCreatedInviteToken(invite.id);
      await loadPendingInvites();

      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffRole('');
      setNewStaffWriterType('journalist');

    } catch (error: any) {
      console.error('Error creating invite:', error);
      showToast(`Failed to create invitation: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyJoinLink = (token: string) => {
    const joinUrl = getInviteJoinUrl(token);
    navigator.clipboard.writeText(joinUrl).then(() => {
      showToast('Join link copied to clipboard!', 'success');
    }).catch(() => {
      prompt('Copy this join link:', joinUrl);
    });
  };

  const handleRevokeInvite = async (token: string, email: string) => {
    if (!window.confirm(`Revoke invitation for ${email}?`)) return;
    if (!firebaseInstances?.auth?.currentUser) return;

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';
      
      await revokeInvite(token, currentUser.uid);
      await logStaffAction(AuditActions.INVITE_REVOKED, currentUser.uid, adminName, undefined, email, undefined, undefined, { token });
      
      showToast('Invitation revoked', 'success');
      await loadPendingInvites();
    } catch (error: any) {
      showToast(`Failed to revoke: ${error.message}`, 'error');
    }
  };
  
  const filteredStaff = staff.filter(member => {
    const matchesSearch = searchQuery.trim() === '' ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && member.isActive) ||
      (statusFilter === 'suspended' && !member.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateRole = async (uid: string, newRole: string, newWriterType?: WriterType) => {
    if (!firebaseInstances?.auth?.currentUser) return;

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const targetMember = staff.find(s => s.uid === uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';
      
      const oldRole = targetMember?.role || '';
      const oldWriterType = targetMember?.writerType;

      await updateStaffRole(uid, newRole, newWriterType);
      
      await logStaffAction(
        AuditActions.ROLE_CHANGED,
        currentUser.uid,
        adminName,
        uid,
        targetMember?.name,
        [oldRole],
        [newRole],
        { fromWriterType: oldWriterType, toWriterType: newWriterType }
      );
      
      showToast('Role updated successfully', 'success');
      loadStaff();
    } catch (error: any) {
      showToast(`Failed to update role: ${error.message}`, 'error');
    }
  };

  const handleDeleteStaff = async (uid: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    if (!firebaseInstances?.auth?.currentUser) return;

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';
      
      await deleteStaffMember(uid);
      await logStaffAction(AuditActions.STAFF_DELETED, currentUser.uid, adminName, uid, name);
      
      showToast('Staff member removed', 'success');
      loadStaff();
    } catch (error: any) {
      showToast(`Failed to remove staff: ${error.message}`, 'error');
    }
  };

  const handleSuspendStaff = async (uid: string, name: string) => {
    if (!window.confirm(`Suspend ${name}?`)) return;
    if (!firebaseInstances?.auth?.currentUser) return;

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';

      await suspendStaffMember(uid, currentUser.uid, adminName);
      await logStaffAction(AuditActions.STAFF_SUSPENDED, currentUser.uid, adminName, uid, name, { isActive: true }, { isActive: false });
      
      showToast(`${name} has been suspended`, 'success');
      loadStaff();
    } catch (error: any) {
      showToast(`Failed to suspend: ${error.message}`, 'error');
    }
  };

  const handleActivateStaff = async (uid: string, name: string) => {
    if (!window.confirm(`Reactivate ${name}?`)) return;
    if (!firebaseInstances?.auth?.currentUser) return;

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';
      
      await activateStaffMember(uid);
      await logStaffAction(AuditActions.STAFF_ACTIVATED, currentUser.uid, adminName, uid, name, { isActive: false }, { isActive: true });
      
      showToast(`${name} has been reactivated`, 'success');
      loadStaff();
    } catch (error: any) {
      showToast(`Failed to reactivate: ${error.message}`, 'error');
    }
  };

  if (loading) return <div>Loading staff...</div>;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Staff Management</h2>
        {currentUserRole === 'super_admin' && (
           <button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Invite Staff'}
          </button>
        )}
      </div>

      {showAddForm && (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px', marginBottom: '24px', backgroundColor: '#f9fafb' }}>
          <h3 style={{ marginTop: 0 }}>Invite New Staff Member</h3>
          <form onSubmit={handleAddStaff}>
            {/* Email and Name fields */}
            <input type="email" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} placeholder="Email" required />
            <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Full Name" required />
            
            {/* Role Dropdown */}
            <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} required>
              <option value="" disabled>Select a role...</option>
              {ASSIGNABLE_ROLES.map(role => (
                <option key={role} value={role}>{capitalize(role)}</option>
              ))}
            </select>

            {/* Writer Type Dropdown (Conditional) */}
            {newStaffRole === 'writer' && (
              <select value={newStaffWriterType} onChange={e => setNewStaffWriterType(e.target.value as WriterType)} required>
                <option value="journalist">Journalist (Permanent)</option>
                <option value="pitch_writer">Pitch Writer (Freelance)</option>
              </select>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
        </div>
      )}
      
      {/* Staff List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredStaff.map((member) => (
          <div key={member.uid} style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '16px' }}>
            <div>
              <h3>{member.name}</h3>
              <p>{member.email}</p>
              <div>
                <span style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
                  {capitalize(member.role)}
                </span>
                {member.role === 'writer' && member.writerType && (
                  <span style={{ padding: '4px 8px', backgroundColor: '#e0e7ff', borderRadius: '4px', fontSize: '12px', marginLeft: '8px' }}>
                    {capitalize(member.writerType.replace('_', ' '))}
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              {/* Role Editing UI */}
              <select
                value={member.role}
                onChange={(e) => handleUpdateRole(member.uid, e.target.value, member.writerType)}
                disabled={!ASSIGNABLE_ROLES.includes(member.role)}
              >
                {ASSIGNABLE_ROLES.map(role => (
                  <option key={role} value={role}>{capitalize(role)}</option>
                ))}
              </select>

              {member.role === 'writer' && (
                <select
                  value={member.writerType || 'journalist'}
                  onChange={(e) => handleUpdateRole(member.uid, 'writer', e.target.value as WriterType)}
                  disabled={!ASSIGNABLE_ROLES.includes('writer')}
                >
                  <option value="journalist">Journalist</option>
                  <option value="pitch_writer">Pitch Writer</option>
                </select>
              )}

              {/* Action Buttons */}
              {member.isActive ? (
                <button onClick={() => handleSuspendStaff(member.uid, member.name)}>Suspend</button>
              ) : (
                <button onClick={() => handleActivateStaff(member.uid, member.name)}>Activate</button>
              )}
              <button onClick={() => handleDeleteStaff(member.uid, member.name)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagementTab;

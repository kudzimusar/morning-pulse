/**
 * Staff Management Tab (Admin Only)
 * Manage staff members, assign roles, view activity
 * NOW WITH: Invitation system, pending invites display
 */

import React, { useEffect, useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  getAllStaff, 
  updateStaffRoles, 
  deleteStaffMember,
  suspendStaffMember,
  activateStaffMember
} from '../../services/staffService';
import { 
  createStaffInvite, 
  getPendingInvites, 
  revokeInvite,
  getInviteJoinUrl,
  hasPendingInvite
} from '../../services/inviteService';
import { 
  logStaffAction, 
  AuditActions,
  getRecentAuditLogs,
  formatAuditAction,
  formatAuditDetails
} from '../../services/auditService';
import { StaffMember, StaffInvite, AuditLog } from '../../../types';

interface StaffManagementTabProps {
  firebaseInstances: { auth: any; db: Firestore } | null;
  userRoles: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const StaffManagementTab: React.FC<StaffManagementTabProps> = ({
  firebaseInstances,
  userRoles,
  showToast,
}) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<StaffInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRoles, setNewStaffRoles] = useState<string[]>([]);
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
    
    if (!newStaffEmail || !newStaffName) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (newStaffRoles.length === 0) {
      showToast('Please select at least one role', 'error');
      return;
    }

    if (!firebaseInstances?.auth?.currentUser) {
      showToast('You must be logged in to create invites', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      
      // Check if email already has pending invite
      const hasPending = await hasPendingInvite(newStaffEmail);
      if (hasPending) {
        showToast('This email already has a pending invitation', 'error');
        setIsSubmitting(false);
        return;
      }

      // Get current user's name from staff collection
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const invitedByName = currentStaffMember?.name || currentUser.email || 'Admin';

      // Create the invite
      const invite = await createStaffInvite(
        newStaffEmail,
        newStaffName,
        newStaffRoles,
        currentUser.uid,
        invitedByName
      );

      // Log the action
      await logStaffAction(
        AuditActions.INVITE_CREATED,
        currentUser.uid,
        invitedByName,
        undefined,
        newStaffEmail,
        undefined,
        newStaffRoles,
        { token: invite.id }
      );

      showToast('Invitation created successfully!', 'success');
      setCreatedInviteToken(invite.id);
      
      // Reload invites list
      await loadPendingInvites();

      // Clear form but keep it open to show the join link
      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffRoles([]);

    } catch (error: any) {
      console.error('Error creating invite:', error);
      showToast(`Failed to create invitation: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyJoinLink = (token: string) => {
    const joinUrl = getInviteJoinUrl(token);
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(joinUrl)
        .then(() => {
          showToast('Join link copied to clipboard!', 'success');
        })
        .catch(() => {
          // Fallback: show the URL
          prompt('Copy this join link:', joinUrl);
        });
    } else {
      // Fallback for older browsers
      prompt('Copy this join link:', joinUrl);
    }
  };

  const handleRevokeInvite = async (token: string, email: string) => {
    if (!window.confirm(`Revoke invitation for ${email}?`)) {
      return;
    }

    if (!firebaseInstances?.auth?.currentUser) {
      showToast('You must be logged in', 'error');
      return;
    }

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';
      
      await revokeInvite(token, currentUser.uid);
      
      // Log the action
      await logStaffAction(
        AuditActions.INVITE_REVOKED,
        currentUser.uid,
        adminName,
        undefined,
        email,
        undefined,
        undefined,
        { token }
      );
      
      showToast('Invitation revoked', 'success');
      await loadPendingInvites();
    } catch (error: any) {
      console.error('Error revoking invite:', error);
      showToast(`Failed to revoke: ${error.message}`, 'error');
    }
  };

  const handleCloseInviteSuccess = () => {
    setCreatedInviteToken(null);
    setShowAddForm(false);
  };

  const handleShowAuditLogs = async () => {
    setShowAuditModal(true);
    setLoadingAuditLogs(true);
    
    try {
      const logs = await getRecentAuditLogs(20);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  /**
   * Get activity status based on lastActive timestamp
   * Returns: 'online' | 'away' | 'offline'
   */
  const getActivityStatus = (lastActive?: Date): 'online' | 'away' | 'offline' => {
    if (!lastActive) return 'offline';
    
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
    
    if (diffMinutes < 15) return 'online';  // < 15 minutes = online
    if (diffMinutes < 1440) return 'away';   // < 24 hours = away
    return 'offline';                         // > 24 hours = offline
  };

  /**
   * Filter staff based on search query and filters
   */
  const filteredStaff = staff.filter(member => {
    // Search filter (name or email)
    const matchesSearch = searchQuery.trim() === '' || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === 'all' || 
      member.roles.some(role => role.toLowerCase() === roleFilter.toLowerCase());
    
    // Status filter (active/suspended)
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && member.isActive) ||
      (statusFilter === 'suspended' && !member.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateRoles = async (uid: string, roles: string[]) => {
    if (!firebaseInstances?.auth?.currentUser) {
      showToast('You must be logged in', 'error');
      return;
    }

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const targetMember = staff.find(s => s.uid === uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';
      
      const oldRoles = targetMember?.roles || [];
      
      await updateStaffRoles(uid, roles);
      
      // Log the action
      await logStaffAction(
        AuditActions.ROLE_CHANGED,
        currentUser.uid,
        adminName,
        uid,
        targetMember?.name,
        oldRoles,
        roles
      );
      
      showToast('Roles updated successfully', 'success');
      loadStaff();
    } catch (error: any) {
      console.error('Error updating roles:', error);
      showToast(`Failed to update roles: ${error.message}`, 'error');
    }
  };

  const handleDeleteStaff = async (uid: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) {
      return;
    }

    if (!firebaseInstances?.auth?.currentUser) {
      showToast('You must be logged in', 'error');
      return;
    }

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';
      
      await deleteStaffMember(uid);
      
      // Log the action
      await logStaffAction(
        AuditActions.STAFF_DELETED,
        currentUser.uid,
        adminName,
        uid,
        name
      );
      
      showToast('Staff member removed', 'success');
      loadStaff();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      showToast(`Failed to remove staff: ${error.message}`, 'error');
    }
  };

  const handleSuspendStaff = async (uid: string, name: string) => {
    if (!window.confirm(`Suspend ${name}? They will not be able to log in until reactivated.`)) {
      return;
    }

    if (!firebaseInstances?.auth?.currentUser) {
      showToast('You must be logged in', 'error');
      return;
    }

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';

      await suspendStaffMember(uid, currentUser.uid, adminName);
      
      // Log the action
      await logStaffAction(
        AuditActions.STAFF_SUSPENDED,
        currentUser.uid,
        adminName,
        uid,
        name,
        { isActive: true },
        { isActive: false }
      );
      
      showToast(`${name} has been suspended`, 'success');
      loadStaff();
    } catch (error: any) {
      console.error('Error suspending staff:', error);
      showToast(`Failed to suspend: ${error.message}`, 'error');
    }
  };

  const handleActivateStaff = async (uid: string, name: string) => {
    if (!window.confirm(`Reactivate ${name}? They will be able to log in again.`)) {
      return;
    }

    if (!firebaseInstances?.auth?.currentUser) {
      showToast('You must be logged in', 'error');
      return;
    }

    try {
      const currentUser = firebaseInstances.auth.currentUser as User;
      const currentStaffMember = staff.find(s => s.uid === currentUser.uid);
      const adminName = currentStaffMember?.name || currentUser.email || 'Admin';
      
      await activateStaffMember(uid);
      
      // Log the action
      await logStaffAction(
        AuditActions.STAFF_ACTIVATED,
        currentUser.uid,
        adminName,
        uid,
        name,
        { isActive: false },
        { isActive: true }
      );
      
      showToast(`${name} has been reactivated`, 'success');
      loadStaff();
    } catch (error: any) {
      console.error('Error activating staff:', error);
      showToast(`Failed to reactivate: ${error.message}`, 'error');
    }
  };

  const toggleRole = (currentRoles: string[], role: string) => {
    if (currentRoles.includes(role)) {
      return currentRoles.filter(r => r !== role);
    } else {
      return [...currentRoles, role];
    }
  };

  if (loading) {
    return <div>Loading staff...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          Staff Management ({filteredStaff.length} / {staff.length})
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleShowAuditLogs}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📋 Recent Activity
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {showAddForm ? 'Cancel' : '+ Add Staff'}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151'
          }}>
            🔍 Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Role Filter */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151'
          }}>
            👤 Role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: '#fff'
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="writer">Writer</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151'
          }}>
            ⚡ Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: '#fff'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {showAddForm && (
        <div style={{
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
            {createdInviteToken ? '✅ Invitation Created' : 'Invite New Staff Member'}
          </h3>
          
          {createdInviteToken ? (
            // Success state - show copy link button
            <div>
              <div style={{
                backgroundColor: '#d1fae5',
                border: '1px solid #10b981',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#065f46' }}>
                  🎉 Invitation created successfully! Share this link with the new team member:
                </p>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  marginBottom: '12px',
                  border: '1px solid #10b981'
                }}>
                  {getInviteJoinUrl(createdInviteToken)}
                </div>
                <button
                  onClick={() => handleCopyJoinLink(createdInviteToken)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginRight: '8px'
                  }}
                >
                  📋 Copy Join Link
                </button>
                <button
                  onClick={handleCloseInviteSuccess}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b7280',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleAddStaff}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="colleague@example.com"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Roles (select at least one)
                </label>
                {['writer', 'editor', 'admin'].map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={newStaffRoles.includes(role)}
                      onChange={() => setNewStaffRoles(toggleRole(newStaffRoles, role))}
                      disabled={isSubmitting}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ textTransform: 'capitalize', fontSize: '14px' }}>{role}</span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {isSubmitting ? 'Creating Invitation...' : '✉️ Send Invitation'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Pending Invitations Section */}
      {pendingInvites.length > 0 && (
        <div style={{
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          backgroundColor: '#fffbeb'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '12px', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#92400e'
          }}>
            ⏳ Pending Invitations ({pendingInvites.length})
          </h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #fbbf24',
                  borderRadius: '4px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    {invite.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {invite.email}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    Invited {invite.createdAt.toLocaleDateString()} • 
                    Expires {invite.expiresAt.toLocaleDateString()} • 
                    Roles: {invite.roles.join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCopyJoinLink(invite.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(invite.id, invite.email)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff List */}
      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {filteredStaff.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
              ? 'No staff members match your filters' 
              : 'No staff members yet'}
          </div>
        )}
        
        {filteredStaff.map((member) => {
          const activityStatus = getActivityStatus(member.lastActive);
          const statusDotColor = 
            activityStatus === 'online' ? '#10b981' :  // Green
            activityStatus === 'away' ? '#d1d5db' :    // Gray
            '#6b7280';                                   // Dark gray
          const statusLabel = 
            activityStatus === 'online' ? 'Online' :
            activityStatus === 'away' ? 'Away' :
            'Offline';
          
          return (
            <div
              key={member.uid}
              style={{
                border: member.isActive ? '1px solid #e5e5e5' : '2px solid #fbbf24',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: member.isActive ? '#fff' : '#fffbeb'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start'
              }}>
                <div style={{ flex: 1 }}>
                  {/* Name with Activity Dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: statusDotColor,
                      flexShrink: 0
                    }} />
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      {member.name}
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {statusLabel}
                    </span>
                    {!member.isActive && (
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#fbbf24',
                        color: '#78350f',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Suspended
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '12px'
                  }}>
                    {member.email}
                  </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '8px'
                }}>
                  {member.roles.map(role => (
                    <span
                      key={role}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textTransform: 'capitalize',
                        fontWeight: '500'
                      }}
                    >
                      {role}
                    </span>
                  ))}
                </div>
                {member.lastActive && (
                  <div style={{
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    Last active: {member.lastActive.toLocaleString()}
                  </div>
                )}
                {!member.isActive && member.suspendedAt && (
                  <div style={{
                    fontSize: '11px',
                    color: '#92400e',
                    marginTop: '4px'
                  }}>
                    Suspended: {member.suspendedAt.toLocaleDateString()}
                    {member.suspendedByName && ` by ${member.suspendedByName}`}
                  </div>
                )}
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <select
                  value={member.roles.join(',')}
                  onChange={(e) => {
                    const roles = e.target.value ? e.target.value.split(',') : [];
                    handleUpdateRoles(member.uid, roles);
                  }}
                  disabled={!member.isActive}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: member.isActive ? '#fff' : '#f3f4f6',
                    cursor: member.isActive ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="writer">Writer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="writer,editor">Writer + Editor</option>
                  <option value="editor,admin">Editor + Admin</option>
                </select>
                
                {member.isActive ? (
                  <button
                    onClick={() => handleSuspendStaff(member.uid, member.name)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivateStaff(member.uid, member.name)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Activate
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteStaff(member.uid, member.name)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                📋 Recent Activity
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>

            {loadingAuditLogs ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                Loading audit logs...
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No audit logs yet
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '12px',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {formatAuditAction(log.action)}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        {log.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#4b5563',
                      marginBottom: '4px'
                    }}>
                      By: {log.performedByName}
                    </div>
                    {formatAuditDetails(log) && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontFamily: 'monospace',
                        backgroundColor: '#fff',
                        padding: '6px 8px',
                        borderRadius: '3px',
                        marginTop: '6px'
                      }}>
                        {formatAuditDetails(log)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementTab;

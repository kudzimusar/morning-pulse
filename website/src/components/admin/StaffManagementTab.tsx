/**
 * Staff Management Tab (Admin Only)
 * Manage staff members, assign roles, view activity
 * NOW WITH: Invitation system, pending invites display
 */

import React, { useEffect, useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getAllStaff, updateStaffRoles, deleteStaffMember } from '../../services/staffService';
import { 
  createStaffInvite, 
  getPendingInvites, 
  revokeInvite,
  getInviteJoinUrl,
  hasPendingInvite
} from '../../services/inviteService';
import { StaffMember, StaffInvite } from '../../../types';

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
      await revokeInvite(token, currentUser.uid);
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

  const handleUpdateRoles = async (uid: string, roles: string[]) => {
    try {
      await updateStaffRoles(uid, roles);
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

    try {
      await deleteStaffMember(uid);
      showToast('Staff member removed', 'success');
      loadStaff();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      showToast(`Failed to remove staff: ${error.message}`, 'error');
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          Staff Management ({staff.length})
        </h2>
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
        {staff.map((member) => (
          <div
            key={member.uid}
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#fff'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {member.name}
                </h3>
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
                    Last active: {member.lastActive.toLocaleDateString()}
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
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  <option value="writer">Writer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="writer,editor">Writer + Editor</option>
                  <option value="editor,admin">Editor + Admin</option>
                </select>
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
        ))}
      </div>
    </div>
  );
};

export default StaffManagementTab;

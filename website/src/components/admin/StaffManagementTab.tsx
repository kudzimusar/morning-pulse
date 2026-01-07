/**
 * Staff Management Tab (Admin Only)
 * Manage staff members, assign roles, view activity
 */

import React, { useEffect, useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { getAllStaff, upsertStaffMember, updateStaffRoles, deleteStaffMember, StaffMember } from '../../services/staffService';

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
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRoles, setNewStaffRoles] = useState<string[]>([]);

  useEffect(() => {
    loadStaff();
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

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStaffEmail || !newStaffName) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // For new staff, we'd need their UID from Firebase Auth
    // This is a simplified version - in production, you'd invite via email
    showToast('Staff invitation feature coming soon. Add staff via Firebase Console for now.', 'error');
    setShowAddForm(false);
    setNewStaffEmail('');
    setNewStaffName('');
    setNewStaffRoles([]);
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
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Add New Staff Member</h3>
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
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Name
              </label>
              <input
                type="text"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Roles
              </label>
              {['writer', 'editor', 'admin'].map(role => (
                <label key={role} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={newStaffRoles.includes(role)}
                    onChange={() => setNewStaffRoles(toggleRole(newStaffRoles, role))}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{role}</span>
                </label>
              ))}
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Add Staff
            </button>
          </form>
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

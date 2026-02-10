import React, { useState, useEffect, useMemo } from 'react';
import {
  getStaff,
  updateStaffRole,
  removeStaffMember,
  createStaffInvite,
  suspendStaffMember,
  activateStaffMember
} from '../../services/staffService';
import { getUserRoles } from '../../services/authService';
import type { StaffMember, StaffRole, WriterType } from '../../types.ts';
import './AdminDashboard.css';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const StaffManagementTab: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRoles, setCurrentUserRoles] = useState<StaffRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // State for the new staff invite form
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('writer');
  const [newStaffWriterType, setNewStaffWriterType] = useState<WriterType>('journalist');
  const [showInviteForm, setShowInviteForm] = useState(false);

  const fetchStaffAndRoles = async () => {
    try {
      setLoading(true);
      const [staffList, roles] = await Promise.all([getStaff(), getUserRoles()]);
      setStaff(staffList);
      setCurrentUserRoles(roles as StaffRole[]);
    } catch (error) {
      console.error("❌ Failed to load staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndRoles();
  }, []);

  const ASSIGNABLE_ROLES = useMemo(() => {
    if (currentUserRoles.includes('super_admin')) {
      return ['super_admin', 'bureau_chief', 'admin', 'editor', 'writer'];
    }
    if (currentUserRoles.includes('bureau_chief')) {
      return ['admin', 'editor', 'writer'];
    }
    if (currentUserRoles.includes('admin')) {
      return ['editor', 'writer'];
    }
    return [];
  }, [currentUserRoles]);

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || member.roles?.includes(roleFilter as StaffRole) || member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staff, searchTerm, roleFilter]);

  const handleRoleChange = async (uid: string, newRole: StaffRole, writerType?: WriterType) => {
    try {
      await updateStaffRole(uid, [newRole], writerType);
      fetchStaffAndRoles();
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleToggleStatus = async (member: StaffMember) => {
    try {
      if (member.isActive !== false) {
        await suspendStaffMember(member.uid, 'admin_uid', 'Super Admin'); // Placeholder names
      } else {
        await activateStaffMember(member.uid);
      }
      fetchStaffAndRoles();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStaffInvite(
        newStaffEmail,
        newStaffName,
        [newStaffRole],
        newStaffRole === 'writer' ? newStaffWriterType : undefined
      );
      alert('Invite sent!');
      setNewStaffEmail('');
      setNewStaffName('');
      setShowInviteForm(false);
      fetchStaffAndRoles();
    } catch (error) {
      console.error("Failed to send invite:", error);
    }
  };

  const isOnline = (lastActive: any) => {
    if (!lastActive) return false;
    const date = new Date(lastActive.seconds ? lastActive.seconds * 1000 : lastActive);
    const diff = (Date.now() - date.getTime()) / 1000 / 60;
    return diff < 10;
  };

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div className="loader"></div>
      <p style={{ color: '#6b7280', marginTop: '12px' }}>Loading command center personnel...</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Staff Management</h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Manage permissions, roles, and status for the entire editorial team.
          </p>
        </div>
        <button
          className="admin-button admin-button-primary"
          onClick={() => setShowInviteForm(!showInviteForm)}
        >
          {showInviteForm ? 'Cancel' : 'Invite New Staff'}
        </button>
      </div>

      {showInviteForm && (
        <div className="admin-card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid #4f46e5' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Invite New Team Member</h3>
          <form onSubmit={handleInvite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Full Name</label>
              <input
                className="admin-input"
                type="text"
                value={newStaffName}
                onChange={e => setNewStaffName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Email Address</label>
              <input
                className="admin-input"
                type="email"
                value={newStaffEmail}
                onChange={e => setNewStaffEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Primary Role</label>
              <select className="admin-input" value={newStaffRole} onChange={e => setNewStaffRole(e.target.value as StaffRole)} required>
                {ASSIGNABLE_ROLES.map(role => (
                  <option key={role} value={role}>{capitalize(role)}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="admin-button admin-button-primary" style={{ height: '38px' }}>Send Invitation</button>
          </form>
        </div>
      )}

      {/* Filters Bar */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <input
            className="admin-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="admin-input" style={{ width: '200px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admins</option>
          <option value="admin">Admins</option>
          <option value="editor">Editors</option>
          <option value="writer">Writers</option>
        </select>
      </div>

      {/* Staff Table */}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Status</th>
              <th>Roles</th>
              <th>Last Active</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr key={member.uid}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold', color: '#4f46e5' }}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{member.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{member.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${member.isActive !== false ? 'active' : 'inactive'}`}>
                    {member.isActive !== false ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(member.roles || [member.role]).map(r => (
                      <span key={r} className={`role-badge ${r}`}>{capitalize(r)}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={isOnline(member.lastActive) ? 'online-dot' : 'offline-dot'}></span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {isOnline(member.lastActive) ? 'OnlineNow' : 'Away'}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      className="admin-button admin-button-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => handleToggleStatus(member)}
                    >
                      {member.isActive !== false ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      className="admin-button"
                      style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#b91c1c' }}
                      onClick={() => removeStaffMember(member.uid)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStaff.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            No staff members match your current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagementTab;


import React, { useState, useEffect, useMemo } from 'react';
import { getStaff, updateStaffRole, removeStaffMember, createStaffInvite } from '../../services/staffService';
import { getUserRoles } from '../../services/authService';
import { StaffMember, StaffRole, WriterType } from '../../types';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const StaffManagementTab: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRoles, setCurrentUserRoles] = useState<StaffRole[]>([]);
  
  // State for the new staff invite form
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('writer');
  const [newStaffWriterType, setNewStaffWriterType] = useState<WriterType>('journalist');

  const fetchStaffAndRoles = async () => {
    setLoading(true);
    const [staffList, roles] = await Promise.all([getStaff(), getUserRoles()]);
    setStaff(staffList);
    setCurrentUserRoles(roles as StaffRole[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaffAndRoles();
  }, []);

  const ASSIGNABLE_ROLES = useMemo(() => {
    if (currentUserRoles.includes('super_admin')) {
      return ['bureau_chief', 'admin', 'editor', 'writer'];
    }
    if (currentUserRoles.includes('bureau_chief')) {
      return ['admin', 'editor', 'writer'];
    }
    if (currentUserRoles.includes('admin')) {
      return ['editor', 'writer'];
    }
    return [];
  }, [currentUserRoles]);

  const handleRoleChange = async (uid: string, newRole: StaffRole, writerType?: WriterType) => {
    await updateStaffRole(uid, newRole, writerType);
    fetchStaffAndRoles(); // Refresh list
  };

  const handleRemove = async (uid: string) => {
    if (window.confirm('Are you sure you want to remove this staff member? This is irreversible.')) {
      await removeStaffMember(uid);
      fetchStaffAndRoles(); // Refresh list
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStaffInvite(
        newStaffEmail, 
        newStaffName, 
        newStaffRole, 
        newStaffRole === 'writer' ? newStaffWriterType : undefined
      );
      alert('Invite sent!');
      // Reset form
      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffRole('writer');
      setNewStaffWriterType('journalist');
    } catch (error) {
      console.error("Failed to send invite:", error);
      alert('Failed to send invite. See console for details.');
    }
  };

  if (loading) return <div>Loading staff...</div>;

  return (
    <div>
      <h2>Staff Management</h2>
      
      {/* Invite Form */}
      <form onSubmit={handleInvite} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
        <h3>Invite New Staff</h3>
        <input 
          type="email" 
          placeholder="Email" 
          value={newStaffEmail} 
          onChange={e => setNewStaffEmail(e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="Full Name" 
          value={newStaffName} 
          onChange={e => setNewStaffName(e.target.value)} 
          required 
        />
        <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value as StaffRole)} required>
          {ASSIGNABLE_ROLES.map(role => (
            <option key={role} value={role}>{capitalize(role)}</option>
          ))}
        </select>
        {newStaffRole === 'writer' && (
          <select value={newStaffWriterType} onChange={e => setNewStaffWriterType(e.target.value as WriterType)}>
            <option value="journalist">Journalist (Staff)</option>
            <option value="pitch_writer">Pitch Writer (Freelance)</option>
          </select>
        )}
        <button type="submit" disabled={ASSIGNABLE_ROLES.length === 0}>Send Invite</button>
      </form>

      {/* Staff Table */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Writer Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr key={member.uid}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>
                <select 
                  value={member.role} 
                  onChange={(e) => handleRoleChange(member.uid, e.target.value as StaffRole)} 
                  disabled={!ASSIGNABLE_ROLES.includes(member.role)}
                >
                  {Object.values(StaffRole).map(r => <option key={r} value={r}>{capitalize(r)}</option>)}
                </select>
              </td>
              <td>
                {member.role === 'writer' && (
                  <select 
                    value={member.writerType || 'journalist'} 
                    onChange={(e) => handleRoleChange(member.uid, member.role, e.target.value as WriterType)}
                    disabled={!ASSIGNABLE_ROLES.includes(member.role)}
                  >
                    <option value="journalist">Journalist</option>
                    <option value="pitch_writer">Pitch Writer</option>
                  </select>
                )}
              </td>
              <td>
                <button onClick={() => handleRemove(member.uid)} disabled={!ASSIGNABLE_ROLES.includes(member.role)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffManagementTab;

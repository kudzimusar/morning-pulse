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
import StaffProfileModal from './widgets/StaffProfileModal';
import { exportToCSV } from '../../services/csvExportService';
import { getStaffMetrics } from '../../services/staffMetricsService';
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  getRolesOrder,
  roleHasPermission,
  type PermissionKey
} from '../../constants/permissionMatrix';
import './AdminDashboard.css';

const ROLES_FOR_FILTER: StaffRole[] = ['super_admin', 'bureau_chief', 'admin', 'editor', 'writer'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const StaffManagementTab: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRoles, setCurrentUserRoles] = useState<StaffRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

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
      // Safety guards for missing name/email
      const name = member.name || '';
      const email = member.email || '';

      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || member.roles?.includes(roleFilter as StaffRole) || member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staff, searchTerm, roleFilter]);

  // A1: Staff overview counts (from full staff list)
  const staffOverview = useMemo(() => {
    const countByRole: Record<string, number> = { super_admin: 0, bureau_chief: 0, admin: 0, editor: 0, writer: 0 };
    let activeCount = 0;
    let suspendedCount = 0;
    let onlineCount = 0;
    staff.forEach(m => {
      (m.roles || [m.role]).forEach((r: string) => { if (countByRole[r] !== undefined) countByRole[r]++; });
      if (m.isActive !== false) activeCount++; else suspendedCount++;
      if (isOnline(m.lastActive)) onlineCount++;
    });
    return { countByRole, activeCount, suspendedCount, onlineCount };
  }, [staff]);

  // A2: Load article counts per staff (from analytics/staff/data)
  useEffect(() => {
    if (staff.length === 0) {
      setArticleCountByUid({});
      return;
    }
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(staff.map(async m => {
        const metrics = await getStaffMetrics(m.uid);
        return [m.uid, metrics?.articlesPublished ?? 0] as const;
      }));
      if (cancelled) return;
      const next: Record<string, number> = {};
      pairs.forEach(([uid, count]) => { next[uid] = count; });
      setArticleCountByUid(next);
    })();
    return () => { cancelled = true; };
  }, [staff]);

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

      {/* A1: Staff Overview Cards */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--admin-text-muted)' }}>Staff Overview</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {ROLES_FOR_FILTER.map(role => (
            <span key={role} style={{ fontSize: '13px' }}>
              <span className={`role-badge ${role}`}>{capitalize(role)}</span>
              <strong style={{ marginLeft: '6px' }}>{staffOverview.countByRole[role] ?? 0}</strong>
            </span>
          ))}
          <span style={{ width: '1px', height: '20px', background: 'var(--admin-border)', margin: '0 4px' }} />
          <span className="status-badge active" style={{ marginRight: '6px' }}>Active</span>
          <strong>{staffOverview.activeCount}</strong>
          <span className="status-badge inactive" style={{ marginLeft: '12px', marginRight: '6px' }}>Suspended</span>
          <strong>{staffOverview.suspendedCount}</strong>
          <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className="online-dot" />
            <strong>Online</strong> {staffOverview.onlineCount}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            className="admin-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="admin-input" style={{ width: '200px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES_FOR_FILTER.map(role => (
            <option key={role} value={role}>{capitalize(role)}s</option>
          ))}
        </select>
        {selectedUids.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>{selectedUids.size} selected</span>
            <select
              className="admin-input"
              style={{ width: '140px' }}
              onChange={e => {
                const v = e.target.value;
                e.target.value = '';
                if (v === 'export') exportToCSV(staff.filter(m => selectedUids.has(m.uid)), 'Staff_List');
                if (v === 'suspend') { if (window.confirm(`Suspend ${selectedUids.size} staff?`)) { staff.filter(m => selectedUids.has(m.uid)).forEach(m => { if (m.isActive !== false) suspendStaffMember(m.uid, 'admin_uid', 'Super Admin'); }); fetchStaffAndRoles(); setSelectedUids(new Set()); } }
                if (v === 'activate') { if (window.confirm(`Activate ${selectedUids.size} staff?`)) { staff.filter(m => selectedUids.has(m.uid)).forEach(m => { if (m.isActive === false) activateStaffMember(m.uid); }); fetchStaffAndRoles(); setSelectedUids(new Set()); } }
                if (v === 'role') { const r = window.prompt('New role (super_admin, bureau_chief, admin, editor, writer):'); if (r && ROLES_FOR_FILTER.includes(r as StaffRole)) { staff.filter(m => selectedUids.has(m.uid)).forEach(m => handleRoleChange(m.uid, r as StaffRole)); setSelectedUids(new Set()); } }
              }}
            >
              <option value="">Bulk actions...</option>
              <option value="export">Export selected</option>
              <option value="suspend">Suspend selected</option>
              <option value="activate">Activate selected</option>
              <option value="role">Change role</option>
            </select>
            <button type="button" className="admin-button admin-button-secondary" style={{ padding: '6px 10px' }} onClick={() => setSelectedUids(new Set())}>Clear</button>
          </div>
        )}
        <button
          className="admin-button admin-button-secondary"
          onClick={() => exportToCSV(filteredStaff, 'Staff_List')}
        >
          Export CSV
        </button>
      </div>

      {/* Staff Table */}
      <div className="admin-card" style={{ position: 'relative' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={filteredStaff.length > 0 && filteredStaff.every(m => selectedUids.has(m.uid))}
                  onChange={e => {
                    if (e.target.checked) setSelectedUids(new Set(filteredStaff.map(m => m.uid)));
                    else setSelectedUids(new Set());
                  }}
                  onClick={ev => ev.stopPropagation()}
                />
              </th>
              <th>Member</th>
              <th>Status</th>
              <th>Roles</th>
              <th>Articles</th>
              <th>Last Active</th>
              <th style={{ textAlign: 'right', width: '60px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr
                key={member.uid}
                onClick={() => setSelectedStaff(member)}
                style={{ cursor: 'pointer' }}
              >
                <td onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUids.has(member.uid)}
                    onChange={e => {
                      e.stopPropagation();
                      const next = new Set(selectedUids);
                      if (next.has(member.uid)) next.delete(member.uid); else next.add(member.uid);
                      setSelectedUids(next);
                    }}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#4f46e5' }}>
                      {(member.name || '?').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{member.name || 'Unknown Staff'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{member.email || 'No Email'}</div>
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
                <td>{articleCountByUid[member.uid] ?? '—'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={isOnline(member.lastActive) ? 'online-dot' : 'offline-dot'}></span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {isOnline(member.lastActive) ? 'Online' : 'Away'}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="admin-button admin-button-secondary"
                        style={{ padding: '4px 8px', fontSize: '14px', minWidth: '32px' }}
                        onClick={() => setOpenMenuUid(openMenuUid === member.uid ? null : member.uid)}
                        title="Actions"
                      >
                        ⋮
                      </button>
                      {openMenuUid === member.uid && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpenMenuUid(null)} />
                          <div className="admin-card" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', minWidth: '200px', zIndex: 20, padding: '8px 0' }}>
                            <button type="button" className="admin-button" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 16px', fontSize: '13px' }} onClick={() => { setSelectedStaff(member); setOpenMenuUid(null); }}>View full profile</button>
                            <button type="button" className="admin-button" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 16px', fontSize: '13px' }} onClick={() => { setSelectedStaff(member); setOpenMenuUid(null); }}>View activity log</button>
                            <button type="button" className="admin-button" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 16px', fontSize: '13px' }} onClick={() => { setOpenMenuUid(null); window.location.hash = '#dashboard?tab=published-content'; }}>View written articles</button>
                            <button type="button" className="admin-button" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 16px', fontSize: '13px' }} onClick={() => { const r = window.prompt('New role:', member.role); if (r && ROLES_FOR_FILTER.includes(r as StaffRole)) { handleRoleChange(member.uid, r as StaffRole); setOpenMenuUid(null); } }}>Change role</button>
                            <button type="button" className="admin-button" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 16px', fontSize: '13px' }} onClick={() => { handleToggleStatus(member); setOpenMenuUid(null); }}>{member.isActive !== false ? 'Suspend' : 'Activate'}</button>
                            <button type="button" className="admin-button" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 16px', fontSize: '13px', color: 'var(--admin-error)' }} onClick={() => { if (window.confirm('Remove this staff member?')) { removeStaffMember(member.uid); setOpenMenuUid(null); } }}>Remove</button>
                          </div>
                        </>
                      )}
                    </div>
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

      {/* Permission Matrix */}
      <div className="admin-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--admin-text-main)' }}>Permission Matrix</h3>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '20px' }}>
          What each role can do. Permissions are derived from roles; change a staff member&apos;s role above to update their access.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table permission-matrix">
            <thead>
              <tr>
                <th style={{ minWidth: '160px' }}>Permission</th>
                {getRolesOrder().map(role => (
                  <th key={role} style={{ textAlign: 'center', minWidth: '100px' }}>
                    <span className={`role-badge ${role}`}>{capitalize(role)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_KEYS.map(perm => (
                <tr key={perm}>
                  <td style={{ fontWeight: '500' }}>{PERMISSION_LABELS[perm as PermissionKey]}</td>
                  {getRolesOrder().map(role => (
                    <td key={role} style={{ textAlign: 'center' }}>
                      {roleHasPermission(role, perm as PermissionKey) ? (
                        <span style={{ color: 'var(--admin-success)', fontSize: '18px' }} title="Has permission">✓</span>
                      ) : (
                        <span style={{ color: 'var(--admin-border)', fontSize: '18px' }} title="No access">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStaff && (
        <StaffProfileModal
          member={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
};

export default StaffManagementTab;

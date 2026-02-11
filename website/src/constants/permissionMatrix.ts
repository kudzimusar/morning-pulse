/**
 * Permission Matrix — single source of truth for role-based permissions.
 * Used by Staff Management tab to show what each role can do.
 * Permissions are derived from roles; no Firestore schema change.
 */

import type { StaffRole } from '../types';

export const PERMISSION_KEYS = [
  'manage_staff',
  'invite_staff',
  'publish_content',
  'manage_content',
  'view_analytics',
  'manage_ads',
  'access_newsletter',
  'manage_system',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  manage_staff: 'Manage staff',
  invite_staff: 'Invite staff',
  publish_content: 'Publish content',
  manage_content: 'Manage content',
  view_analytics: 'View analytics',
  manage_ads: 'Manage ads',
  access_newsletter: 'Access newsletter',
  manage_system: 'Manage system',
};

/** Which permissions each role has. super_admin has all. */
export const ROLE_PERMISSIONS: Record<StaffRole, PermissionKey[]> = {
  super_admin: [...PERMISSION_KEYS],
  bureau_chief: ['manage_staff', 'invite_staff', 'publish_content', 'manage_content', 'view_analytics', 'manage_ads', 'access_newsletter', 'manage_system'],
  admin: ['invite_staff', 'publish_content', 'manage_content', 'view_analytics', 'manage_ads', 'access_newsletter'],
  editor: ['publish_content', 'manage_content', 'view_analytics', 'access_newsletter'],
  writer: ['manage_content'],
};

const ROLES_ORDER: StaffRole[] = ['super_admin', 'bureau_chief', 'admin', 'editor', 'writer'];

export function getRolesOrder(): StaffRole[] {
  return ROLES_ORDER;
}

export function roleHasPermission(role: StaffRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissionsForRole(role: StaffRole): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

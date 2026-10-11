// Mirrors the backend's hasApprovalAccess (src/utils/authorization.util.ts):
// roles are compared case-insensitively ("Manager", "MANAGER", "ADMIN", ...).
const APPROVER_ROLES = ['ADMIN', 'HR', 'MANAGER'];

/** True if this user may see and act on the Leave Approval screen. */
export const canApproveLeaves = (role?: string | null): boolean =>
  APPROVER_ROLES.includes(String(role ?? '').trim().toUpperCase());

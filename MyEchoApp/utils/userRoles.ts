import type { UserRoleCode } from "../types/api";

const BACKEND_ADMIN_ROLE_CODES = new Set<UserRoleCode>([3]);
const BACKEND_NGO_ROLE_CODES = new Set<UserRoleCode>([2]);
const BACKEND_DONOR_ROLE_CODES = new Set<UserRoleCode>([1]);

export function isAdminUserRole(role: UserRoleCode | undefined | null) {
  return role !== undefined && role !== null && BACKEND_ADMIN_ROLE_CODES.has(role);
}

export function isNgoUserRole(role: UserRoleCode | undefined | null) {
  return role !== undefined && role !== null && BACKEND_NGO_ROLE_CODES.has(role);
}

export function isDonorUserRole(role: UserRoleCode | undefined | null) {
  return role !== undefined && role !== null && BACKEND_DONOR_ROLE_CODES.has(role);
}

export function getUserRoleLabel(role: UserRoleCode | undefined | null) {
  if (isAdminUserRole(role)) {
    return "ECHO ADMIN";
  }

  if (isNgoUserRole(role)) {
    return "PARCEIRO DE IMPACTO";
  }

  if (isDonorUserRole(role)) {
    return "APOIADOR DE IMPACTO";
  }

  return "MEMBRO ECHO";
}

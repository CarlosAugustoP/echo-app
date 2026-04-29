import type { UserRoleCode } from "../types/api";

const BACKEND_NGO_ROLE_CODES = new Set<UserRoleCode>([2, 0]);
const BACKEND_DONOR_ROLE_CODES = new Set<UserRoleCode>([1]);

export function isNgoUserRole(role: UserRoleCode | undefined | null) {
  return role !== undefined && role !== null && BACKEND_NGO_ROLE_CODES.has(role);
}

export function isDonorUserRole(role: UserRoleCode | undefined | null) {
  return role !== undefined && role !== null && BACKEND_DONOR_ROLE_CODES.has(role);
}

export function getUserRoleLabel(role: UserRoleCode | undefined | null) {
  if (isNgoUserRole(role)) {
    return "PARCEIRO DE IMPACTO";
  }

  if (isDonorUserRole(role)) {
    return "APOIADOR DE IMPACTO";
  }

  return "MEMBRO ECHO";
}

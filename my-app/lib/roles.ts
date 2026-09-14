import { apiRequest, unwrap } from "./api";
import type { RoleAssignment, UserRole } from "./types/user";

// These endpoints take their arguments as query parameters, not a JSON body.

export async function getUserRoles(userId: string, schoolId?: string) {
  const res = await apiRequest(`/roles/${userId}`, { query: { school_id: schoolId } });
  return normalizeRoles(unwrap(res));
}

export function assignRole({ user_id, role, school_id }: RoleAssignment) {
  return apiRequest("/roles/assign", {
    method: "POST",
    query: { user_id, role, school_id },
  });
}

export function revokeRole({ user_id, role, school_id }: RoleAssignment) {
  return apiRequest("/roles/revoke", {
    method: "DELETE",
    query: { user_id, role, school_id },
  });
}

/**
 * The response format isn't documented. Accepts a list of role names, a list of
 * role objects, or an object with a `roles` list.
 */
function normalizeRoles(raw: unknown): UserRole[] {
  const list =
    raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray((raw as { roles?: unknown }).roles)
      ? (raw as { roles: unknown[] }).roles
      : Array.isArray(raw)
        ? raw
        : [];

  return list.flatMap((item): UserRole[] => {
    if (typeof item === "string") return [{ role: item, school_id: null, permissions: [] }];
    if (!item || typeof item !== "object") return [];

    const r = item as Record<string, unknown>;
    const role = [r.role, r.role_name, r.name].find((v) => typeof v === "string") as string | undefined;
    if (!role) return [];

    return [
      {
        role,
        school_id: typeof r.school_id === "string" ? r.school_id : null,
        permissions: Array.isArray(r.permissions) ? r.permissions.filter((p) => typeof p === "string") : [],
      },
    ];
  });
}

import { apiRequest } from "./client";

export interface Role {
  id: string;
  name: string;
  description: string;
  icon: string;
  icon_bg: string;
  user_count: number;
  is_system: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  level: "read" | "write" | "delete" | "none";
  enabled: boolean;
}

export interface PermissionCategory {
  title: string;
  permissions: Permission[];
}

export interface Laborant {
  id: string;
  name: string;
  initials: string;
  trusted: boolean;
}

export async function getRoles(): Promise<Role[]> {
  return apiRequest<Role[]>("/roles");
}

export async function getRolePermissions(role: string): Promise<PermissionCategory[]> {
  return apiRequest<PermissionCategory[]>(`/roles/permissions?role=${role}`);
}

export async function getLaborants(): Promise<Laborant[]> {
  return apiRequest<Laborant[]>("/roles/laborants");
}

export async function saveRolePermissions(role: string, permissions: unknown): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/roles/permissions/${role}`, {
    method: "POST",
    body: permissions,
  });
}

export async function resetRolePermissions(role: string): Promise<PermissionCategory[]> {
  return apiRequest<PermissionCategory[]>(`/roles/permissions/${role}/reset`, {
    method: "POST",
  });
}

export async function trustLaborant(assistantId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>("/roles/trusted", {
    method: "POST",
    body: { assistant_id: assistantId },
  });
}

export async function untrustLaborant(assistantId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/roles/trusted/${assistantId}`, {
    method: "DELETE",
  });
}

export async function getMyPermissions(): Promise<string[]> {
  return apiRequest<string[]>("/roles/my-permissions");
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  target_role: string;
  action: string;
  permission_id: string | null;
  details: unknown;
  created_at: string;
}

export async function getAuditLogs(
  targetRole?: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (targetRole) params.append("target_role", targetRole);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  return apiRequest<AuditLog[]>(`/roles/audit-logs?${params.toString()}`);
}

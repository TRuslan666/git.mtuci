import { apiRequest } from "./client";
import type { AdminUserRead, UserRole } from "./types";

export async function getAdminUsers(): Promise<AdminUserRead[]> {
  return apiRequest<AdminUserRead[]>("/admin/users");
}

export async function patchAdminUser(
  userId: string,
  payload: { role: UserRole; is_blocked: boolean; group_name?: string | null; student_id?: string | null },
): Promise<AdminUserRead> {
  return apiRequest<AdminUserRead>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await apiRequest<void>(`/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export async function resetAdminUserPassword(
  userId: string,
): Promise<{ new_password: string }> {
  return apiRequest<{ new_password: string }>(
    `/admin/users/${userId}/reset-password`,
    { method: "POST" },
  );
}


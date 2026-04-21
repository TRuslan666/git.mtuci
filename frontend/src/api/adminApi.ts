import { apiRequest } from "./client";
import type { AdminUserRead, UserRole, SystemMetrics, ServiceStatus, BackupInfo } from "./types";

export async function getAdminUsers(): Promise<AdminUserRead[]> {
  return apiRequest<AdminUserRead[]>("/admin/users");
}

export async function patchAdminUser(
  userId: string,
  payload: { role: UserRole; is_blocked: boolean; is_pending?: boolean; group_name?: string | null; student_id?: string | null },
): Promise<AdminUserRead> {
  return apiRequest<AdminUserRead>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function approveUser(userId: string): Promise<AdminUserRead> {
  return apiRequest<AdminUserRead>(`/admin/users/${userId}/approve`, {
    method: "POST",
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

export interface UserStats {
  total: number;
  active: number;
  pending: number;
  blocked: number;
}

export async function getUserStats(): Promise<UserStats> {
  const users = await getAdminUsers();
  return {
    total: users.length,
    active: users.filter((u) => !u.is_blocked).length,
    pending: users.filter((u) => u.is_pending).length,
    blocked: users.filter((u) => u.is_blocked).length,
  };
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  return apiRequest<SystemMetrics>("/admin/system-metrics");
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  return apiRequest<ServiceStatus>("/admin/service-status");
}

export async function getBackups(): Promise<BackupInfo> {
  return apiRequest<BackupInfo>("/admin/backups");
}

export async function createBackup(): Promise<{ success: boolean; file: string; message: string }> {
  return apiRequest<{ success: boolean; file: string; message: string }>("/admin/backups/create", { method: "POST" });
}

export interface FacultyCommitsStat {
  faculty: string;
  short_name: string;
  commits: number;
  color: string;
}

export async function getCommitsByFaculty(): Promise<FacultyCommitsStat[]> {
  return apiRequest<FacultyCommitsStat[]>("/stats/commits-by-faculty");
}

export interface ActiveRepositoryStat {
  id: string;
  name: string;
  author: string;
  commits: number;
  is_public: boolean;
  initials: string;
  color: string;
}

export async function getActiveRepositories(limit: number = 5): Promise<ActiveRepositoryStat[]> {
  return apiRequest<ActiveRepositoryStat[]>(`/stats/active-repositories?limit=${limit}`);
}

export async function getGroups(): Promise<string[]> {
  return apiRequest<string[]>("/groups");
}


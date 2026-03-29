import { apiRequest } from "./client";

export interface Repository {
  id: string;
  name: string;
  description: string | null;
  gitea_repo_name: string | null;
  clone_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRepositoryRequest {
  name: string;
  description?: string;
}

export interface UpdateRepositoryRequest {
  name?: string;
  description?: string;
}

export async function getMyRepositories(): Promise<Repository[]> {
  return apiRequest<Repository[]>("/repositories/my");
}

export async function createRepository(data: CreateRepositoryRequest): Promise<Repository> {
  return apiRequest<Repository>("/repositories/", {
    method: "POST",
    body: data,
  });
}

export async function updateRepository(id: string, data: UpdateRepositoryRequest): Promise<Repository> {
  return apiRequest<Repository>(`/repositories/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteRepository(id: string): Promise<void> {
  return apiRequest<void>(`/repositories/${id}`, {
    method: "DELETE",
  });
}

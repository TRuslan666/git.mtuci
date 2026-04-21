export type UserRole = "student" | "teacher" | "admin" | "laborant";

export type TokenType = "bearer";

export interface TokenResponse {
  access_token: string;
  token_type: TokenType | string;
}

export interface UserRead {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  avatar_display_mode: "cover" | "contain" | "fill" | "scale-down";
  created_at: string;
  last_login: string | null;
}

export interface AdminUserRead {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  group_name: string | null;
  student_id: string | null;
  is_blocked: boolean;
  is_pending?: boolean;
  created_at: string;
  last_login: string | null;
}

export interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
}

export interface ServiceStatus {
  git: boolean;
  db: boolean;
  api: boolean;
}

export interface BackupInfo {
  last_backup: string | null;
  next_backup: string | null;
}

export interface FacultyCommitsStat {
  faculty: string;
  short_name: string;
  commits: number;
  color: string;
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

export interface Course {
  id: string;
  title: string;
  description: string | null;
  grade_max: number;
  target_groups: string[] | null;
  teacher_id: string;
  created_at: string;
  enrolled_count?: number;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  start_date: string;
  deadline: string;
  late_penalty_periods: { weeks: number; max_grade: number }[];
  gitea_repo_name: string | null;
  created_at: string;
}

export interface CommitAuthor {
  name: string;
  email: string | null;
}

export interface Commit {
  sha: string;
  message: string;
  author: CommitAuthor;
  date: string;
}

export type RepoFileType = "file" | "dir";

export interface RepoFile {
  sha: string;
  name: string;
  type: RepoFileType;
  size: number | null;
}

export type SubmissionStatus = "submitted" | "not_submitted";

export interface SubmissionStatusRead {
  student_id: string;
  student_full_name: string;
  status: SubmissionStatus;
  last_commit_at: string | null;
  grade: number | null;
  final_grade: number | null;
  penalty_points: number;
  weeks_late: number;
  late_max_grade: number | null;
  comment: string | null;
  submitted_at: string | null;
  graded_at: string | null;
}

export interface MyGradeRead {
  grade: number | null;
  final_grade: number | null;
  penalty_points: number;
  weeks_late: number;
  late_max_grade: number | null;
  comment: string | null;
  graded_at: string | null;
  grade_max: number;
}

export type PlagiarismVerdict = "high" | "medium" | "low";

export interface PlagiarismStudent {
  id: string;
  full_name: string;
  email: string;
}

export interface PlagiarismPair {
  student1: PlagiarismStudent;
  student2: PlagiarismStudent;
  similarity: number;
  verdict: PlagiarismVerdict;
}

export interface PlagiarismCheckResult {
  pairs: PlagiarismPair[];
  checked_at: string;
}

export interface PlagiarismCompareResult {
  similarity: number;
  verdict: PlagiarismVerdict;
  common_features: string[];
  lines1: { line: string; status: "exact" | "similar" | "different" }[];
  lines2: { line: string; status: "exact" | "similar" | "different" }[];
}

export interface FileContent {
  filepath: string;
  content: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}


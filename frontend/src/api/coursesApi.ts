import { apiRequest } from "./client";
import type {
  Assignment,
  Commit,
  Course,
  FileContent,
  MyGradeRead,
  PlagiarismCompareResult,
  RepoFile,
  SubmissionStatusRead,
} from "./types";

export async function getCourses(): Promise<Course[]> {
  return apiRequest<Course[]>("/courses");
}

export async function createCourse(payload: {
  title: string;
  description: string;
  grade_max: number;
}): Promise<Course> {
  return apiRequest<Course>("/courses", {
    method: "POST",
    body: payload,
  });
}

export async function deleteCourse(courseId: string): Promise<void> {
  await apiRequest<unknown>(`/courses/${courseId}`, {
    method: "DELETE",
  });
}

export async function getAssignments(courseId: string): Promise<Assignment[]> {
  return apiRequest<Assignment[]>(`/courses/${courseId}/assignments`);
}

export async function createAssignment(
  courseId: string,
  payload: {
    title: string;
    description: string;
    start_date: string;
    deadline: string;
    late_penalty_periods: { weeks: number; max_grade: number }[];
  },
): Promise<Assignment> {
  return apiRequest<Assignment>(`/courses/${courseId}/assignments`, {
    method: "POST",
    body: payload,
  });
}

export async function getCommits(
  courseId: string,
  assignmentId: string,
  studentId?: string,
): Promise<Commit[]> {
  const params = studentId ? `?student_id=${encodeURIComponent(studentId)}` : "";
  return apiRequest<Commit[]>(
    `/courses/${courseId}/assignments/${assignmentId}/commits${params}`,
  );
}

export async function getSubmissions(
  courseId: string,
  assignmentId: string,
): Promise<SubmissionStatusRead[]> {
  return apiRequest<SubmissionStatusRead[]>(
    `/courses/${courseId}/assignments/${assignmentId}/submissions`,
  );
}

export async function gradeSubmission(
  courseId: string,
  assignmentId: string,
  studentId: string,
  payload: { grade: number; comment: string | null },
): Promise<SubmissionStatusRead> {
  return apiRequest<SubmissionStatusRead>(
    `/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}/grade`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function getMyGrade(
  courseId: string,
  assignmentId: string,
): Promise<MyGradeRead> {
  return apiRequest<MyGradeRead>(
    `/courses/${courseId}/assignments/${assignmentId}/my-grade`,
  );
}

export async function comparePlagiarism(
  courseId: string,
  assignmentId: string,
  payload: { student1_id: string; student2_id: string },
): Promise<PlagiarismCompareResult> {
  return apiRequest<PlagiarismCompareResult>(
    `/courses/${courseId}/assignments/${assignmentId}/compare`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function getFiles(
  courseId: string,
  assignmentId: string,
  studentId?: string,
): Promise<RepoFile[]> {
  const params = studentId ? `?student_id=${encodeURIComponent(studentId)}` : "";
  return apiRequest<RepoFile[]>(
    `/courses/${courseId}/assignments/${assignmentId}/files${params}`,
  );
}

function encodeRepoFilePath(filepath: string) {
  return filepath
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

export async function getFileContent(
  courseId: string,
  assignmentId: string,
  filepath: string,
  studentId?: string,
): Promise<FileContent> {
  const params = studentId ? `?student_id=${encodeURIComponent(studentId)}` : "";
  return apiRequest<FileContent>(
    `/courses/${courseId}/assignments/${assignmentId}/files/${encodeRepoFilePath(filepath)}${params}`,
  );
}


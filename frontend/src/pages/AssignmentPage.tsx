import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  comparePlagiarism,
  getSubmissions,
  getMyGrade,
  gradeSubmission,
  getCourses,
  getAssignments,
  getCommits,
  getFiles,
  getFileContent,
} from "../api/coursesApi";
import { getMe } from "../api/authApi";
import type {
  Assignment,
  Commit,
  Course,
  FileContent,
  MyGradeRead,
  PlagiarismCompareResult,
  RepoFile,
  SubmissionStatusRead,
  UserRead,
} from "../api/types";

type ViewState = {
  file: RepoFile | null;
  loading: boolean;
  content: string | null;
  error: string | null;
};

type AssignmentTab = "commits" | "files" | "grading" | "plagiarism";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function AssignmentPage() {
  const { courseId, assignmentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [me, setMe] = useState<UserRead | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionStatusRead[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [savingGradeFor, setSavingGradeFor] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [myGrade, setMyGrade] = useState<MyGradeRead | null>(null);
  const [myGradeLoading, setMyGradeLoading] = useState(false);
  const [myGradeError, setMyGradeError] = useState<string | null>(null);
  const [plagiarism, setPlagiarism] = useState<PlagiarismCompareResult | null>(null);
  const [plagiarismLoading, setPlagiarismLoading] = useState(false);
  const [plagiarismError, setPlagiarismError] = useState<string | null>(null);
  const [selectedStudent1Id, setSelectedStudent1Id] = useState("");
  const [selectedStudent2Id, setSelectedStudent2Id] = useState("");
  const [selectedRepoStudentId, setSelectedRepoStudentId] = useState("");
  const [activeTab, setActiveTab] = useState<AssignmentTab>("commits");

  const [view, setView] = useState<ViewState>({
    file: null,
    loading: false,
    content: null,
    error: null,
  });

  const headerTitle = useMemo(() => {
    if (!assignment) return "Assignment";
    return assignment.title;
  }, [assignment]);

  const selectedStudent1 = useMemo(
    () => submissions.find((s) => s.student_id === selectedStudent1Id) ?? null,
    [submissions, selectedStudent1Id],
  );
  const selectedStudent2 = useMemo(
    () => submissions.find((s) => s.student_id === selectedStudent2Id) ?? null,
    [submissions, selectedStudent2Id],
  );
  const sortedFiles = useMemo(
    () => [...files].sort((a, b) => a.name.localeCompare(b.name)),
    [files],
  );
  const sortedPenaltyPeriods = useMemo(
    () => (assignment ? [...assignment.late_penalty_periods].sort((a, b) => a.weeks - b.weeks) : []),
    [assignment],
  );

  useEffect(() => {
    if (!courseId || !assignmentId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const asList = await getAssignments(courseId);

        if (cancelled) return;

        const found = asList.find((a) => a.id === assignmentId) ?? null;
        setAssignment(found);
        setCommits([]);
        setFiles([]);
        const meResult = await getMe();
        if (cancelled) return;
        setMe(meResult);
        if (meResult.role === "teacher") {
          const courses = await getCourses();
          if (cancelled) return;
          setCourse(courses.find((c) => c.id === courseId) ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId, assignmentId]);

  useEffect(() => {
    if (!courseId || !assignmentId || !me) return;
    if (me.role === "teacher" && !selectedRepoStudentId) return;
    let cancelled = false;

    async function loadRepoData() {
      try {
        const [commitsRes, filesRes] = await Promise.all([
          getCommits(courseId, assignmentId, me.role === "teacher" ? selectedRepoStudentId : undefined),
          getFiles(courseId, assignmentId, me.role === "teacher" ? selectedRepoStudentId : undefined),
        ]);
        if (cancelled) return;
        setCommits(commitsRes);
        setFiles(filesRes);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed");
      }
    }

    loadRepoData();
    return () => {
      cancelled = true;
    };
  }, [courseId, assignmentId, me, selectedRepoStudentId]);

  useEffect(() => {
    if (!courseId || !assignmentId || me?.role !== "teacher") return;
    let cancelled = false;

    async function loadSubmissions() {
      setSubmissionsLoading(true);
      setSubmissionsError(null);
      try {
        const data = await getSubmissions(courseId, assignmentId);
        if (cancelled) return;
        setSubmissions(data);
        setGradeInputs(
          Object.fromEntries(data.map((s) => [s.student_id, s.grade !== null ? String(s.grade) : ""])),
        );
        setCommentInputs(Object.fromEntries(data.map((s) => [s.student_id, s.comment ?? ""])));
        if (data.length > 0) {
          setSelectedRepoStudentId((prev) => prev || data[0].student_id);
        }
      } catch (err) {
        if (!cancelled) {
          setSubmissionsError(err instanceof Error ? err.message : "Failed to load submissions");
        }
      } finally {
        if (!cancelled) setSubmissionsLoading(false);
      }
    }

    loadSubmissions();
    return () => {
      cancelled = true;
    };
  }, [courseId, assignmentId, me?.role]);

  useEffect(() => {
    if (!courseId || !assignmentId || me?.role !== "student") return;
    let cancelled = false;

    async function loadMyGrade() {
      setMyGradeLoading(true);
      setMyGradeError(null);
      try {
        const data = await getMyGrade(courseId, assignmentId);
        if (cancelled) return;
        setMyGrade(data);
      } catch (err) {
        if (!cancelled) setMyGradeError(err instanceof Error ? err.message : "Failed to load grade");
      } finally {
        if (!cancelled) setMyGradeLoading(false);
      }
    }

    loadMyGrade();
    return () => {
      cancelled = true;
    };
  }, [courseId, assignmentId, me?.role]);

  async function onViewFile(f: RepoFile) {
    if (!courseId || !assignmentId) return;
    setView({ file: f, loading: true, content: null, error: null });
    try {
      const res: FileContent = await getFileContent(
        courseId,
        assignmentId,
        f.name,
        me?.role === "teacher" ? selectedRepoStudentId : undefined,
      );
      setView({ file: f, loading: false, content: res.content, error: null });
    } catch (err) {
      setView({
        file: f,
        loading: false,
        content: null,
        error: err instanceof Error ? err.message : "Failed to load file",
      });
    }
  }

  async function onSaveGrade(studentId: string) {
    if (!courseId || !assignmentId) return;
    const gradeRaw = (gradeInputs[studentId] ?? "").trim();
    const commentRaw = commentInputs[studentId] ?? "";
    const parsed = Number(gradeRaw);
    const gradeMax = course?.grade_max ?? 100;
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > gradeMax) {
      setSubmissionsError(`Оценка должна быть целым числом от 0 до ${gradeMax}.`);
      return;
    }

    setSavingGradeFor(studentId);
    setSubmissionsError(null);
    try {
      const updated = await gradeSubmission(courseId, assignmentId, studentId, {
        grade: parsed,
        comment: commentRaw.trim() ? commentRaw.trim() : null,
      });
      setSubmissions((prev) => prev.map((s) => (s.student_id === studentId ? updated : s)));
      setGradeInputs((prev) => ({ ...prev, [studentId]: String(updated.grade ?? "") }));
      setCommentInputs((prev) => ({ ...prev, [studentId]: updated.comment ?? "" }));
    } catch (err) {
      setSubmissionsError(err instanceof Error ? err.message : "Failed to save grade");
    } finally {
      setSavingGradeFor(null);
    }
  }

  async function onComparePlagiarism() {
    if (!courseId || !assignmentId) return;
    if (!selectedStudent1Id || !selectedStudent2Id) {
      setPlagiarismError("Выберите двух студентов для сравнения.");
      return;
    }
    if (selectedStudent1Id === selectedStudent2Id) {
      setPlagiarismError("Нужно выбрать двух разных студентов.");
      return;
    }

    setPlagiarismLoading(true);
    setPlagiarismError(null);
    try {
      const result = await comparePlagiarism(courseId, assignmentId, {
        student1_id: selectedStudent1Id,
        student2_id: selectedStudent2Id,
      });
      setPlagiarism(result);
    } catch (err) {
      setPlagiarismError(err instanceof Error ? err.message : "Failed to compare submissions");
    } finally {
      setPlagiarismLoading(false);
    }
  }

  function verdictClass(verdict: "high" | "medium" | "low") {
    if (verdict === "high") return "bg-red-100 text-red-800";
    if (verdict === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  }

  function gaugeColor(similarity: number) {
    const percent = similarity * 100;
    if (percent > 80) return "#dc2626";
    if (percent >= 60) return "#ca8a04";
    return "#16a34a";
  }

  function featureBadgeClass(feature: string) {
    if (feature.startsWith("operator:")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (feature.startsWith("function:")) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  function lineStatusClass(status: "exact" | "similar" | "different") {
    if (status === "exact") return "bg-red-100/80";
    if (status === "similar") return "bg-yellow-100/80";
    return "bg-transparent";
  }

  function tabButtonClass(tab: AssignmentTab) {
    const base = "rounded-lg border px-3 py-2 text-sm font-medium transition";
    if (tab === activeTab) {
      return `${base} border-purple-200 bg-purple-100 text-purple-700`;
    }
    return `${base} border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:text-purple-700`;
  }

  if (!courseId || !assignmentId) return null;

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-3 text-sm text-gray-600">
        <Link to="/courses" className="text-purple-700 hover:text-purple-800">
          Курсы
        </Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <Link to={`/courses/${courseId}`} className="text-purple-700 hover:text-purple-800">
          {course?.title || "Курс"}
        </Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <span className="font-medium text-gray-800">{headerTitle}</span>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-md">
        <h1 className="text-3xl font-semibold text-gray-900">{headerTitle}</h1>
        {assignment?.description ? <div className="mt-2 text-sm text-gray-700">{assignment.description}</div> : null}
        {assignment?.deadline ? (
          <div className="mt-3 inline-flex rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-700">
            Deadline: <span className="ml-1 font-medium">{formatDate(assignment.deadline)}</span>
          </div>
        ) : null}
        {assignment && assignment.late_penalty_periods.length > 0 ? (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="mb-1 font-medium text-gray-700">Штрафы за просрочку</div>
            {sortedPenaltyPeriods.map((p, idx) => (
                <div key={`${p.weeks}-${idx}`} className="text-gray-600">
                  До {p.weeks} недели → макс. {p.max_grade}
                </div>
              ))}
            <div className="text-gray-700">Позже → макс. 0</div>
          </div>
        ) : null}
      </div>

      {loading ? <div className="text-sm text-gray-600">Loading...</div> : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {me?.role === "teacher" ? (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-md">
          <div className="mb-2 text-sm font-semibold">Репозиторий студента для просмотра файлов и коммитов</div>
          <select
            value={selectedRepoStudentId}
            onChange={(e) => setSelectedRepoStudentId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          >
            <option value="">Выберите студента</option>
            {submissions.map((s) => (
              <option key={`repo-${s.student_id}`} value={s.student_id}>
                {s.student_full_name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={tabButtonClass("commits")} onClick={() => setActiveTab("commits")}>
          Коммиты
        </button>
        <button type="button" className={tabButtonClass("files")} onClick={() => setActiveTab("files")}>
          Файлы
        </button>
        <button type="button" className={tabButtonClass("grading")} onClick={() => setActiveTab("grading")}>
          Оценивание
        </button>
        {me?.role === "teacher" ? (
          <button
            type="button"
            className={tabButtonClass("plagiarism")}
            onClick={() => setActiveTab("plagiarism")}
          >
            Антиплагиат
          </button>
        ) : null}
      </div>

      {activeTab === "commits" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
          <div className="mb-3 text-lg font-semibold text-gray-900">Commits timeline</div>
          <div className="space-y-4">
            {commits.map((c) => (
              <div key={c.sha} className="relative pl-6">
                <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-purple-500" />
                <div className="absolute left-[5px] top-5 h-[calc(100%-10px)] w-[2px] bg-purple-100" />
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-sm font-mono text-purple-700">{c.sha.slice(0, 7)}</div>
                  <div className="mt-1 text-sm font-medium">{c.message}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    {c.author.name}
                    {c.author.email ? ` (${c.author.email})` : ""}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{formatDate(c.date)}</div>
                </div>
              </div>
            ))}
            {!loading && commits.length === 0 ? <div className="text-sm text-gray-600">No commits found.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "files" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
          <div className="mb-3 text-lg font-semibold text-gray-900">Файлы (дерево)</div>
          <div className="space-y-2">
            {sortedFiles.map((f) => (
                <div
                  key={`${f.type}:${f.sha}:${f.name}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="min-w-0" style={{ paddingLeft: `${(f.name.match(/\//g)?.length ?? 0) * 14}px` }}>
                    <div className="truncate text-sm font-medium">
                      {f.type === "dir" ? "📁" : "📄"} {f.name}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {f.type === "dir" ? "dir" : "file"}{" "}
                      {f.size !== null && f.type === "file" ? `(${f.size} bytes)` : ""}
                    </div>
                  </div>
                  {f.type === "file" ? (
                    <button
                      onClick={() => onViewFile(f)}
                      className="rounded-lg bg-purple-600 px-3 py-1 text-sm text-white transition hover:bg-purple-700"
                    >
                      View
                    </button>
                  ) : (
                    <div className="text-xs text-gray-400">—</div>
                  )}
                </div>
              ))}

            {!loading && files.length === 0 ? <div className="text-sm text-gray-600">No files found.</div> : null}
          </div>
        </div>
      ) : null}

      {me?.role === "teacher" && activeTab === "plagiarism" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold">AI антиплагиат</div>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={selectedStudent1Id}
              onChange={(e) => setSelectedStudent1Id(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Студент 1</option>
              {submissions.map((s) => (
                <option key={`s1-${s.student_id}`} value={s.student_id}>
                  {s.student_full_name}
                </option>
              ))}
            </select>
            <select
              value={selectedStudent2Id}
              onChange={(e) => setSelectedStudent2Id(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Студент 2</option>
              {submissions.map((s) => (
                <option key={`s2-${s.student_id}`} value={s.student_id}>
                  {s.student_full_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onComparePlagiarism}
              disabled={plagiarismLoading || submissions.length < 2}
              className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white transition hover:bg-purple-700 disabled:opacity-60"
            >
              {plagiarismLoading ? "Сравнение..." : "Сравнить"}
            </button>
          </div>

          {plagiarismError ? (
            <div className="mb-3 mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {plagiarismError}
            </div>
          ) : null}

          {plagiarism ? (
            <div className="mb-4 mt-3 rounded-md border border-gray-200 p-3">
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div
                    className="relative h-40 w-40 rounded-full"
                    style={{
                      background: `conic-gradient(${gaugeColor(plagiarism.similarity)} ${
                        plagiarism.similarity * 360
                      }deg, #e5e7eb 0deg)`,
                    }}
                  >
                    <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {(plagiarism.similarity * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Similarity</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-700">
                    Вердикт:{" "}
                    <span className={`rounded px-2 py-0.5 text-xs ${verdictClass(plagiarism.verdict)}`}>
                      {plagiarism.verdict}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                          {getInitials(selectedStudent1?.student_full_name ?? "S1")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">
                            {selectedStudent1?.student_full_name ?? "Студент 1"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span>→</span>
                      <span>{(plagiarism.similarity * 100).toFixed(1)}%</span>
                      <span>→</span>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                          {getInitials(selectedStudent2?.student_full_name ?? "S2")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">
                            {selectedStudent2?.student_full_name ?? "Студент 2"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-800">Совпадающие AST элементы</div>
                    {plagiarism.common_features.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {plagiarism.common_features.map((feature) => (
                          <span
                            key={feature}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${featureBadgeClass(feature)}`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-600">Совпадающих AST элементов не найдено.</div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="mb-3 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
                      <div className="text-sm font-semibold text-gray-800">
                        {selectedStudent1?.student_full_name ?? "Студент 1"}
                      </div>
                      <div className="text-center text-xs font-semibold text-gray-600">
                        {(plagiarism.similarity * 100).toFixed(1)}%
                      </div>
                      <div className="text-right text-sm font-semibold text-gray-800">
                        {selectedStudent2?.student_full_name ?? "Студент 2"}
                      </div>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="overflow-hidden rounded-md border border-gray-200">
                        <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
                          {selectedStudent1?.student_full_name ?? "Студент 1"}
                        </div>
                        <div className="max-h-[420px] overflow-auto font-mono text-xs">
                          {plagiarism.lines1.map((row, idx) => (
                            <div
                              key={`l1-${idx}`}
                              className={`grid grid-cols-[48px_1fr] ${lineStatusClass(row.status)}`}
                            >
                              <div className="border-r border-gray-100 px-2 py-1 text-right text-gray-500">
                                {idx + 1}
                              </div>
                              <div className="px-2 py-1 whitespace-pre">{row.line || " "}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-md border border-gray-200">
                        <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
                          {selectedStudent2?.student_full_name ?? "Студент 2"}
                        </div>
                        <div className="max-h-[420px] overflow-auto font-mono text-xs">
                          {plagiarism.lines2.map((row, idx) => (
                            <div
                              key={`l2-${idx}`}
                              className={`grid grid-cols-[48px_1fr] ${lineStatusClass(row.status)}`}
                            >
                              <div className="border-r border-gray-100 px-2 py-1 text-right text-gray-500">
                                {idx + 1}
                              </div>
                              <div className="px-2 py-1 whitespace-pre">{row.line || " "}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

        </div>
      ) : null}

      {me?.role === "teacher" && activeTab === "grading" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
          <div className="mb-3 text-lg font-semibold">Оценивание студентов</div>
          {submissionsLoading ? <div className="text-sm text-gray-600">Loading submissions...</div> : null}
          {submissionsError ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submissionsError}
            </div>
          ) : null}

          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.student_id} className="rounded-md border border-gray-100 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm font-semibold">{s.student_full_name}</div>
                  <div
                    className={`rounded px-2 py-0.5 text-xs ${
                      s.status === "submitted" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {s.status === "submitted" ? "Сдано" : "Не сдано"}
                  </div>
                  <div className="text-xs text-gray-600">
                    Последний коммит: {s.last_commit_at ? formatDate(s.last_commit_at) : "—"}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">Оценка (0 — {course?.grade_max ?? 100})</div>
                <div className="mt-1 grid gap-2 md:grid-cols-[140px_1fr_auto]">
                  <input
                    type="number"
                    min={0}
                    max={course?.grade_max ?? 100}
                    step={1}
                    value={gradeInputs[s.student_id] ?? ""}
                    onChange={(e) =>
                      setGradeInputs((prev) => ({
                        ...prev,
                        [s.student_id]: e.target.value,
                      }))
                    }
                    placeholder={`0 — ${course?.grade_max ?? 100}`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                  <input
                    type="text"
                    value={commentInputs[s.student_id] ?? ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [s.student_id]: e.target.value,
                      }))
                    }
                    placeholder="Комментарий"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => onSaveGrade(s.student_id)}
                    disabled={savingGradeFor === s.student_id}
                    className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white transition hover:bg-purple-700 disabled:opacity-60"
                  >
                    {savingGradeFor === s.student_id ? "Сохранение..." : "Сохранить"}
                  </button>
                </div>

                <div className="mt-2 text-xs text-gray-600">
                  Оригинальная: {s.grade ?? "—"} | Штраф: -{(s.penalty_points ?? 0).toFixed(1)} | Итоговая:{" "}
                  {s.final_grade !== null ? s.final_grade.toFixed(1) : "—"} | Оценено:{" "}
                  {s.graded_at ? formatDate(s.graded_at) : "—"}
                </div>
              </div>
            ))}
            {!submissionsLoading && submissions.length === 0 ? (
              <div className="text-sm text-gray-600">В этом курсе пока нет студентов.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {me?.role === "student" && activeTab === "grading" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
          <div className="mb-2 text-lg font-semibold">Моя оценка</div>
          {myGradeLoading ? <div className="text-sm text-gray-600">Loading...</div> : null}
          {myGradeError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {myGradeError}
            </div>
          ) : null}
          {!myGradeLoading && !myGradeError && myGrade ? (
            <div>
              <div className="mb-2">
                {myGrade.grade === null ? (
                  <div className="text-sm text-gray-600">Статус сдачи будет рассчитан после выставления оценки.</div>
                ) : myGrade.weeks_late > 0 ? (
                  <div className="text-sm text-red-700">
                    Просрочено на {myGrade.weeks_late} нед., максимальная оценка теперь{" "}
                    {myGrade.late_max_grade !== null ? myGrade.late_max_grade : 0}
                  </div>
                ) : (
                  <div className="text-sm text-green-700">Сдано вовремя ✓</div>
                )}
              </div>
              {myGrade.grade !== null ? (
                <div className="text-base font-medium">
                  Моя оценка: {myGrade.grade} / {myGrade.grade_max}
                </div>
              ) : (
                <div className="text-sm text-gray-700">Оценка еще не выставлена</div>
              )}
              {myGrade.final_grade !== null ? (
                <div className="mt-1 text-base font-semibold text-purple-700">
                  Итоговая с учетом штрафа: {myGrade.final_grade.toFixed(1)} / {myGrade.grade_max}
                </div>
              ) : null}
              {myGrade.comment ? (
                <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  Комментарий преподавателя: {myGrade.comment}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {view.file ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">File: {view.file.name}</div>
                <div className="mt-1 text-xs text-gray-600">
                  {view.file.type} • {view.file.size ?? 0} bytes
                </div>
              </div>
              <button
                onClick={() =>
                  setView({ file: null, loading: false, content: null, error: null })
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {view.loading ? (
              <div className="text-sm text-gray-600">Loading file...</div>
            ) : view.error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {view.error}
              </div>
            ) : (
              <pre className="max-h-[60vh] overflow-auto rounded-md border border-gray-100 bg-gray-50 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                {view.content ?? ""}
              </pre>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}


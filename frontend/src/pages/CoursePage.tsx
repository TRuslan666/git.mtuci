import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getMe } from "../api/authApi";
import { createAssignment, getAssignments, getCourses, deleteAssignment } from "../api/coursesApi";
import type { Assignment, UserRead } from "../api/types";

export default function CoursePage() {
  const { courseId } = useParams();
  const today = useMemo(() => {
    // Get Moscow date (UTC+3)
    const moscowDate = new Date().toLocaleDateString('ru-RU', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // Convert from DD.MM.YYYY to YYYY-MM-DD
    const [day, month, year] = moscowDate.split('.');
    return `${year}-${month}-${day}`;
  }, []);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<UserRead | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createDeadline, setCreateDeadline] = useState("");
  const [latePenaltyPeriods, setLatePenaltyPeriods] = useState<Array<{ weeks: number; max_grade: number }>>([
    { weeks: 1, max_grade: 4 },
  ]);
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [penaltyValidationError, setPenaltyValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    const courseIdStr = courseId; // capture for TypeScript

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [meResult, as, cs] = await Promise.allSettled([
          getMe(),
          getAssignments(courseIdStr),
          getCourses(),
        ]);

        if (meResult.status === "fulfilled" && !cancelled) {
          setMe(meResult.value);
        }
        if (as.status === "fulfilled" && !cancelled) setAssignments(as.value);
        if (cs.status === "fulfilled" && !cancelled) {
          const found = cs.value.find((c) => c.id === courseIdStr);
          if (found) setCourseTitle(found.title);
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
  }, [courseId]);

  const canCreateAssignment = me?.role === "teacher";
  const sortedLatePenaltyPeriods = useMemo(
    () => [...latePenaltyPeriods].sort((a, b) => a.weeks - b.weeks),
    [latePenaltyPeriods],
  );

  function validatePenaltyPeriods(periods: Array<{ weeks: number; max_grade: number }>): string | null {
    let prevWeeks: number | null = null;
    let prevMaxGrade: number | null = null;
    for (const period of periods) {
      if (!Number.isFinite(period.weeks) || period.weeks <= 0) {
        return "Период должен быть больше 0 недель";
      }
      if (!Number.isFinite(period.max_grade) || period.max_grade < 0) {
        return "Максимальная оценка не может быть отрицательной";
      }
      if (prevWeeks !== null && period.weeks <= prevWeeks) {
        return "Периоды должны быть отсортированы по возрастанию недель";
      }
      if (prevMaxGrade !== null && period.max_grade >= prevMaxGrade) {
        return "Максимальная оценка должна убывать с увеличением срока просрочки";
      }
      prevWeeks = period.weeks;
      prevMaxGrade = period.max_grade;
    }
    return null;
  }

  async function onCreateAssignment(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;

    setCreateLoading(true);
    setCreateError(null);
    setPenaltyValidationError(null);
    try {
      // Validate deadline is not in the past
      if (createDeadline) {
        const deadlineDate = new Date(createDeadline);
        const now = new Date();
        if (deadlineDate < now) {
          setCreateError("Дедлайн не может быть в прошлом");
          setCreateLoading(false);
          return;
        }
      }
      
      // Validate start date is not after deadline
      if (createStartDate && createDeadline) {
        const start = new Date(createStartDate);
        const deadline = new Date(createDeadline);
        if (start > deadline) {
          setCreateError("Дата начала не может быть позже дедлайна");
          setCreateLoading(false);
          return;
        }
      }

      const validationError = validatePenaltyPeriods(latePenaltyPeriods);
      if (validationError) {
        setPenaltyValidationError(validationError);
        setCreateLoading(false);
        return;
      }
      const deadlineIso = new Date(createDeadline).toISOString();
      const startDateIso = new Date(createStartDate).toISOString();
      const created = await createAssignment(courseId, {
        title: createTitle.trim(),
        description: createDescription.trim(),
        start_date: startDateIso,
        deadline: deadlineIso,
        late_penalty_periods: latePenaltyPeriods,
        files: createFiles,
      });
      setAssignments((prev) => [...prev, created].sort((a, b) => a.deadline.localeCompare(b.deadline)));
      setCreateTitle("");
      setCreateDescription("");
      setCreateStartDate("");
      setCreateDeadline("");
      setLatePenaltyPeriods([{ weeks: 1, max_grade: 4 }]);
      setCreateFiles([]);
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    if (!courseId) return;
    if (!confirm("Удалить это задание? Это действие нельзя отменить.")) return;
    
    try {
      await deleteAssignment(courseId, assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assignment");
    }
  }

  if (!courseId) return null;

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-3 text-sm text-gray-600">
        <Link to="/courses" className="text-purple-700 hover:text-purple-800">
          Курсы
        </Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <span className="font-medium text-gray-800">{courseTitle ?? "Курс"}</span>
      </div>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-gray-900">{courseTitle ?? "Курс"}</h1>
        {canCreateAssignment ? (
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            {showCreateForm ? "Скрыть форму" : "Создать задание"}
          </button>
        ) : null}
      </div>

      {showCreateForm && canCreateAssignment ? (
        <form
          onSubmit={onCreateAssignment}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-md"
        >
          <div className="mb-3 text-sm font-semibold text-gray-900">Новое задание</div>
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              required
            />
            <textarea
              placeholder="description"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Файлы задания</label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setCreateFiles(files);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-purple-700 hover:file:bg-purple-200"
              />
              {createFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {createFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1 text-sm text-gray-700">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setCreateFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Дата начала</label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={createStartDate}
                  onChange={(e) => setCreateStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-24 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setCreateStartDate(today)}
                  className="absolute right-2 rounded-md bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 transition"
                >
                  Сегодня
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Дедлайн</label>
              <input
                type="datetime-local"
                value={createDeadline}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const selected = new Date(value);
                    const now = new Date();
                    if (selected < now) {
                      setCreateError("Дедлайн не может быть в прошлом");
                      return;
                    }
                  }
                  setCreateError(null);
                  setCreateDeadline(value);
                }}
                min={`${today}T00:00`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Штрафы за просрочку</label>
                <button
                  type="button"
                  onClick={() =>
                    setLatePenaltyPeriods((prev) => [
                      ...prev,
                      {
                        weeks: (prev.length > 0 ? prev[prev.length - 1].weeks : 1) + 1,
                        max_grade: prev.length > 0 ? Math.max(0, prev[prev.length - 1].max_grade - 1) : 0,
                      },
                    ])
                  }
                  className="rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200"
                >
                  Добавить период штрафа
                </button>
              </div>

              <div className="space-y-2">
                {latePenaltyPeriods.map((period, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      value={period.weeks}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=[1-9])/, "");
                        const nextWeeks = val === "" ? 0 : parseInt(val, 10);
                        const prevWeeks = idx > 0 ? latePenaltyPeriods[idx - 1].weeks : null;
                        if (prevWeeks !== null && nextWeeks <= prevWeeks && nextWeeks !== 0) {
                          setPenaltyValidationError(
                            "Нельзя добавить период с неделями меньше или равными предыдущему периоду",
                          );
                          return;
                        }
                        setPenaltyValidationError(null);
                        setLatePenaltyPeriods((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, weeks: nextWeeks } : p)),
                        );
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="до X недель"
                      required
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={0}
                      value={period.max_grade}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=[0-9])/, "");
                        const nextMax = val === "" ? 0 : parseInt(val, 10);
                        const prevMax = idx > 0 ? latePenaltyPeriods[idx - 1].max_grade : null;
                        if (prevMax !== null && nextMax > prevMax) {
                          setPenaltyValidationError(
                            "Максимальная оценка должна убывать с увеличением срока просрочки",
                          );
                          return;
                        }
                        setPenaltyValidationError(null);
                        setLatePenaltyPeriods((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, max_grade: nextMax } : p)),
                        );
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      placeholder="максимальная оценка"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setLatePenaltyPeriods((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                      disabled={latePenaltyPeriods.length === 1}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                <div className="mb-1 font-medium text-gray-700">Периоды:</div>
                {sortedLatePenaltyPeriods.map((p, idx) => (
                    <div key={`${p.weeks}-${idx}`} className="text-gray-600">
                      До {p.weeks} недели → макс. {p.max_grade}
                    </div>
                  ))}
                <div className="mt-1 text-gray-700">Позже → макс. 0</div>
              </div>
              {penaltyValidationError ? (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                  {penaltyValidationError}
                </div>
              ) : null}
            </div>
          </div>
          {createError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {createError}
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createLoading || !!penaltyValidationError}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {createLoading ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? <div className="text-sm text-gray-600">Loading...</div> : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
        <div className="mb-3 text-lg font-semibold text-gray-900">Задания</div>
        <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a.id} className="group relative">
            <Link
              to={`/courses/${courseId}/assignments/${a.id}`}
              className="block rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-purple-200 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <span>📘</span>
                    <span className="truncate">{a.title}</span>
                  </div>
                  {a.description ? (
                    <div className="mt-1 text-sm text-gray-600 line-clamp-3">
                      {a.description}
                    </div>
                  ) : null}
                </div>
                <div className="text-right text-sm text-gray-700">
                  <div>
                    Дедлайн: <span className="font-medium">{new Date(a.deadline).toLocaleString()}</span>
                  </div>
                  <div className="mt-1">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Активно
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            {canCreateAssignment && (
              <button
                onClick={() => handleDeleteAssignment(a.id)}
                className="absolute right-2 top-2 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 opacity-0 transition hover:bg-red-200 group-hover:opacity-100"
                title="Удалить задание"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
        </div>
      </div>

      {!loading && !error && assignments.length === 0 ? (
        <div className="mt-6 text-sm text-gray-600">No assignments found.</div>
      ) : null}
    </div>
  );
}


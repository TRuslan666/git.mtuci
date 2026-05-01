import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../api/authApi";
import { createCourse, deleteCourse, getCourses, getGroups } from "../api/coursesApi";
import type { Course, UserRead } from "../api/types";

interface CoursesPageProps {
  isDarkTheme?: boolean;
}

export default function CoursesPage({ isDarkTheme = true }: CoursesPageProps) {
  // Theme-based colors
  const pageBg = isDarkTheme ? "bg-[#111111]" : "bg-gray-50";
  const pageText = isDarkTheme ? "text-white" : "text-gray-900";
  const textPrimary = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-900";
  const textSecondary = isDarkTheme ? "text-[#8b949e]" : "text-gray-600";
  const textTertiary = isDarkTheme ? "text-[#6e7681]" : "text-gray-500";
  const cardBg = isDarkTheme ? "bg-[#161616]" : "bg-white";
  const cardBorder = isDarkTheme ? "border-[#2d2d2d]" : "border-gray-200";
  const inputBg = isDarkTheme ? "bg-[#0d1117]" : "bg-white";
  const inputBorder = isDarkTheme ? "border-[#30363d]" : "border-gray-300";
  const buttonPrimary = isDarkTheme ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white";
  const buttonSecondary = isDarkTheme ? "border-[#30363d] text-[#8b949e] hover:bg-[#2d2d2d]" : "border-gray-300 text-gray-700 hover:bg-gray-50";
  const errorBox = isDarkTheme ? "border-red-800 bg-red-900/20 text-red-300" : "border-red-200 bg-red-50 text-red-800";
  const infoBox = isDarkTheme ? "border-purple-800/50 bg-purple-900/20 text-purple-300" : "border-purple-100 bg-purple-50 text-purple-800";
  const badgeBg = isDarkTheme ? "bg-[#1f2937]" : "bg-gray-50";
  const gradeBadge = isDarkTheme ? "bg-purple-900/30 text-purple-300" : "bg-purple-50 text-purple-700";
  const deleteBtn = isDarkTheme ? "border-red-800 text-red-300 hover:bg-red-900/20" : "border-red-200 text-red-700 hover:bg-red-50";
  const groupChipActive = isDarkTheme ? "border-purple-500 bg-purple-600/20 text-purple-300" : "border-purple-500 bg-purple-50 text-purple-700";
  const groupChipInactive = isDarkTheme ? "border-[#30363d] bg-[#161616] text-[#8b949e] hover:border-purple-500/50" : "border-gray-200 bg-white text-gray-600 hover:border-purple-300";
  const linkCard = isDarkTheme ? "hover:border-purple-500/50 hover:-translate-y-1" : "hover:border-purple-200 hover:-translate-y-1";

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<UserRead | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createGradeMax, setCreateGradeMax] = useState(10);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  
  // Groups selection
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [meResult, coursesResult, groupsResult] = await Promise.allSettled([
          getMe(), 
          getCourses(),
          getGroups()
        ]);
        if (cancelled) return;

        if (meResult.status === "fulfilled") {
          setMe(meResult.value);
        } else {
          setError(meResult.reason instanceof Error ? meResult.reason.message : "Failed");
          setCourses([]);
          return;
        }

        if (coursesResult.status === "fulfilled") {
          setCourses(coursesResult.value);
        } else {
          setError(
            coursesResult.reason instanceof Error ? coursesResult.reason.message : "Failed",
          );
        }
        
        if (groupsResult.status === "fulfilled") {
          setAvailableGroups(groupsResult.value);
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
  }, []);

  const canCreateCourse = me?.role === "teacher";

  async function onCreateCourse(e: FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      if (!Number.isInteger(createGradeMax) || createGradeMax < 0 || createGradeMax > 50) {
        setCreateError("Максимальная оценка должна быть целым числом от 0 до 50.");
        return;
      }
      const created = await createCourse({
        title: createTitle.trim(),
        description: createDescription.trim(),
        grade_max: createGradeMax,
        target_groups: selectedGroups.length > 0 ? selectedGroups : undefined,
      });
      setCourses((prev) => [created, ...prev]);
      setCreateTitle("");
      setCreateDescription("");
      setCreateGradeMax(10);
      setSelectedGroups([]);
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setCreateLoading(false);
    }
  }

  async function onDeleteCourse(courseId: string) {
    const ok = window.confirm("Удалить курс? Будут удалены все задания и зачисления.");
    if (!ok) return;

    setDeletingCourseId(courseId);
    setError(null);
    try {
      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setDeletingCourseId(null);
    }
  }

  return (
    <div className={`mx-auto max-w-7xl px-4 ${pageBg} min-h-screen py-4`}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className={`text-3xl font-semibold ${textPrimary}`}>Мои курсы</h1>
        {canCreateCourse ? (
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${buttonPrimary}`}
          >
            {showCreateForm ? "Скрыть форму" : "Создать курс"}
          </button>
        ) : null}
      </div>

      {showCreateForm && canCreateCourse ? (
        <form
          onSubmit={onCreateCourse}
          className={`mb-6 rounded-xl border ${cardBorder} ${cardBg} p-5 shadow-md`}
        >
          <div className={`mb-3 text-sm font-semibold ${textPrimary}`}>Новый курс</div>
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              className={`w-full rounded-lg border ${inputBorder} px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 ${inputBg} ${textPrimary}`}
              required
            />
            <textarea
              placeholder="description"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className={`min-h-24 w-full rounded-lg border ${inputBorder} px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 ${inputBg} ${textPrimary}`}
            />
            <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${infoBox}`}>
              Максимальная оценка: {createGradeMax}
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              list="grade-marks"
              value={createGradeMax}
              onChange={(e) => setCreateGradeMax(Number(e.target.value))}
              className={`w-full ${isDarkTheme ? "accent-purple-500" : "accent-purple-600"}`}
              required
            />
            <datalist id="grade-marks">
              <option value="0">0</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="25">25</option>
              <option value="30">30</option>
              <option value="35">35</option>
              <option value="40">40</option>
              <option value="45">45</option>
              <option value="50">50</option>
            </datalist>
            <div className={`mt-1 flex justify-between text-xs ${textTertiary}`}>
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
              <span>30</span>
              <span>35</span>
              <span>40</span>
              <span>45</span>
              <span>50</span>
            </div>

            {/* Groups selection */}
            {availableGroups.length > 0 && (
              <div className="mt-4">
                <div className={`mb-2 text-sm font-medium ${textSecondary}`}>Доступные группы:</div>
                <div className="flex flex-wrap gap-2">
                  {availableGroups.map((group) => (
                    <label
                      key={group}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition ${
                        selectedGroups.includes(group) ? groupChipActive : groupChipInactive
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedGroups.includes(group)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups((prev) => [...prev, group]);
                          } else {
                            setSelectedGroups((prev) => prev.filter((g) => g !== group));
                          }
                        }}
                      />
                      {group}
                    </label>
                  ))}
                </div>
                {selectedGroups.length === 0 && (
                  <div className={`mt-1 text-xs ${textTertiary}`}>
                    Если не выбрано ни одной группы, курс будет доступен всем
                  </div>
                )}
              </div>
            )}
          </div>
          {createError ? (
            <div className={`mt-3 rounded-md border p-3 text-sm ${errorBox}`}>
              {createError}
            </div>
          ) : null}
          <div className="mt-3">
            <button
              type="submit"
              disabled={createLoading}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${buttonPrimary}`}
            >
              {createLoading ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? <div className={`text-sm ${textSecondary}`}>Loading...</div> : null}
      {error ? (
        <div className={`rounded-md border p-3 text-sm ${errorBox}`}>
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <div
            key={c.id}
            className={`rounded-xl border ${cardBorder} ${cardBg} p-5 shadow-md transition duration-200 ${linkCard}`}
          >
            <div className="flex items-start justify-between gap-3">
              <Link to={`/courses/${c.id}`} className="min-w-0 flex-1">
                <div className={`text-base font-semibold ${textPrimary}`}>{c.title}</div>
                {c.description ? (
                  <div className={`mt-1 text-sm line-clamp-3 ${textSecondary}`}>
                    {c.description}
                  </div>
                ) : null}
                <div className={`mt-4 grid grid-cols-2 gap-2 text-xs ${textSecondary}`}>
                  <div className={`rounded-md px-2 py-1 ${badgeBg}`}>Студентов: {c.enrolled_count ?? 0}</div>
                  <div className={`rounded-md px-2 py-1 ${gradeBadge}`}>
                    Макс. оценка: {c.grade_max}
                  </div>
                </div>
              </Link>

              {canCreateCourse ? (
                <button
                  type="button"
                  title="Удалить курс"
                  onClick={() => onDeleteCourse(c.id)}
                  disabled={deletingCourseId === c.id}
                  className={`rounded-lg border px-2 py-1 transition disabled:opacity-60 ${deleteBtn}`}
                >
                  🗑️
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && courses.length === 0 ? (
        <div className={`mt-6 text-sm ${textSecondary}`}>No courses found.</div>
      ) : null}
    </div>
  );
}


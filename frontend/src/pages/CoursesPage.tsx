import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../api/authApi";
import { createCourse, deleteCourse, getCourses } from "../api/coursesApi";
import type { Course, UserRead } from "../api/types";

export default function CoursesPage() {
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [meResult, coursesResult] = await Promise.allSettled([getMe(), getCourses()]);
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
      });
      setCourses((prev) => [created, ...prev]);
      setCreateTitle("");
      setCreateDescription("");
      setCreateGradeMax(10);
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
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-900">Мои курсы</h1>
        {canCreateCourse ? (
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            {showCreateForm ? "Скрыть форму" : "Создать курс"}
          </button>
        ) : null}
      </div>

      {showCreateForm && canCreateCourse ? (
        <form
          onSubmit={onCreateCourse}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-md"
        >
          <div className="mb-3 text-sm font-semibold text-gray-900">Новый курс</div>
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
            <div className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-800">
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
              className="w-full accent-purple-600"
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
            <div className="mt-1 flex justify-between text-xs text-gray-500">
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
          </div>
          {createError ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {createError}
            </div>
          ) : null}
          <div className="mt-3">
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-md transition duration-200 hover:-translate-y-1 hover:border-purple-200"
          >
            <div className="flex items-start justify-between gap-3">
              <Link to={`/courses/${c.id}`} className="min-w-0 flex-1">
                <div className="text-base font-semibold text-gray-900">{c.title}</div>
                {c.description ? (
                  <div className="mt-1 text-sm text-gray-600 line-clamp-3">
                    {c.description}
                  </div>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="rounded-md bg-gray-50 px-2 py-1">Студентов: —</div>
                  <div className="rounded-md bg-purple-50 px-2 py-1 text-purple-700">
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
                  className="rounded-lg border border-red-200 px-2 py-1 text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                >
                  🗑️
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && courses.length === 0 ? (
        <div className="mt-6 text-sm text-gray-600">No courses found.</div>
      ) : null}
    </div>
  );
}


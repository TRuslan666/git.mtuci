import { useEffect, useState } from "react";
import { getMe } from "../api/authApi";
import { getCourses } from "../api/coursesApi";
import type { UserRead, Course as CourseType } from "../api/types";

interface Activity {
  id: string;
  text: string;
  type: "submission" | "comment" | "deadline";
}

interface Course {
  id: string;
  name: string;
  rating: number;
}

interface Deadline {
  id: string;
  time: string;
  title: string;
  urgency: "today" | "tomorrow" | "later";
}

interface StudentRating {
  id: string;
  name: string;
  points: number;
}

const mockActivities: Activity[] = [
  { id: "1", text: "Сдал лаб. работу №3 (оценка 85)", type: "submission" },
  { id: "2", text: "Новый комментарий от преподавателя", type: "comment" },
  { id: "3", text: "Дедлайн через 2 дня: Лаб. №4", type: "deadline" },
];

interface CourseDisplay {
  id: string;
  name: string;
  rating: number;
}

const mockCourses: CourseDisplay[] = [
  { id: "1", name: "Базы данных", rating: 4 },
  { id: "2", name: "Web разработка", rating: 3 },
  { id: "3", name: "Python продвин.", rating: 5 },
];

const mockDeadlines: Deadline[] = [
  { id: "1", time: "17:00", title: "Лаб. №3", urgency: "today" },
  { id: "2", time: "23:59", title: "Тест по БД", urgency: "tomorrow" },
  { id: "3", time: "", title: "Курсовая", urgency: "later" },
];

const mockRatings: StudentRating[] = [
  { id: "1", name: "Петров И.", points: 450 },
  { id: "2", name: "Иванов А.", points: 420 },
  { id: "3", name: "Сидоров К.", points: 380 },
];

function getActivityIcon(type: Activity["type"]) {
  switch (type) {
    case "submission":
      return "✅";
    case "comment":
      return "💬";
    case "deadline":
      return "🔥";
  }
}

function StarRating({ rating, isDarkTheme }: { rating: number; isDarkTheme: boolean }) {
  return (
    <span className={isDarkTheme ? "text-yellow-400" : "text-yellow-500"}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < rating ? "⭐" : "☆"
      )}
    </span>
  );
}

function getUrgencyLabel(urgency: Deadline["urgency"]) {
  switch (urgency) {
    case "today":
      return "Сегодня";
    case "tomorrow":
      return "Завтра";
    case "later":
      return "Через 3 дня";
  }
}

function getUrgencyColor(urgency: Deadline["urgency"], isDarkTheme: boolean) {
  switch (urgency) {
    case "today":
      return isDarkTheme ? "text-red-400 font-medium" : "text-red-600 font-medium";
    case "tomorrow":
      return isDarkTheme ? "text-orange-400" : "text-orange-600";
    case "later":
      return isDarkTheme ? "text-[#8b949e]" : "text-gray-600";
  }
}

interface HomePageProps {
  isDarkTheme?: boolean;
}

export default function HomePage({ isDarkTheme = false }: HomePageProps) {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Theme-based colors
  const pageBg = isDarkTheme ? "bg-[#0f0f10]" : "bg-slate-50";
  const cardBg = isDarkTheme ? "bg-[#161616] border-[#2d2d2d]" : "bg-white border-[#d4cfe6]";
  const cardBgAlt = isDarkTheme ? "bg-[#0d0d0d]" : "bg-[#faf9fd]";
  const titleText = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-900";
  const bodyText = isDarkTheme ? "text-[#8b949e]" : "text-gray-700";
  const mutedText = isDarkTheme ? "text-[#6e7681]" : "text-gray-500";
  const selectBg = isDarkTheme ? "bg-[#0d0d0d] border-[#30363d] text-[#ccd0d4]" : "bg-white border-gray-300 text-gray-700";
  const progressBg = isDarkTheme ? "bg-[#30363d]" : "bg-gray-200";
  const progressFill = "bg-[#372579]";
  const ratingText = "text-[#372579]";
  const starColor = isDarkTheme ? "text-yellow-400" : "text-yellow-500";
  const deadlineBorder = isDarkTheme ? "border-[#30363d]" : "border-gray-200";
  const hoverBorder = isDarkTheme ? "hover:border-[#484f58]" : "hover:border-[#d4cfe6]";

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [me, coursesData] = await Promise.all([getMe(), getCourses()]);
        if (!cancelled) {
          setUser(me);
          setCourses(coursesData);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCoursesLoading(false);
        }
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const weeklyProgress = 75;

  return (
    <div className={`mx-auto max-w-6xl ${pageBg} transition-colors`}>
      {/* Приветствие */}
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold ${titleText} transition-colors`}>
          👋 Привет, {loading ? "..." : user?.full_name || user?.email || "Иван"}!
        </h1>
      </div>

      {/* Основная сетка: контент + сайдбар */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Левая колонка (основной контент) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Активность за неделю */}
          <div className={`rounded-xl border p-5 shadow-sm ${cardBg} transition-colors`}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-semibold ${titleText} transition-colors`}>📊 Активность за неделю</h2>
              </div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className={`rounded-md border px-3 py-1.5 text-sm outline-none focus:border-[#372579] focus:ring-1 focus:ring-[#372579] ${selectBg} transition-colors`}
              >
                <option value="all">Все курсы ▼</option>
                {coursesLoading ? (
                  <option disabled>Загрузка...</option>
                ) : courses.length === 0 ? (
                  <option disabled>Нет курсов</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Прогресс бар */}
            <div className="mb-2">
              <div className={`h-3 w-full rounded-full ${progressBg} transition-colors`}>
                <div
                  className={`h-3 rounded-full ${progressFill} transition-all`}
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            </div>
            <div className={`text-sm font-medium ${bodyText} transition-colors`}>{weeklyProgress}%</div>
          </div>

          {/* Последние действия */}
          <div className={`rounded-xl border p-5 shadow-sm ${cardBg} transition-colors`}>
            <h2 className={`mb-3 text-lg font-semibold ${titleText} transition-colors`}>🔥 Последние действия</h2>
            <ul className="space-y-2">
              {mockActivities.map((activity) => (
                <li key={activity.id} className={`flex items-start gap-2 text-sm ${bodyText} transition-colors`}>
                  <span>{getActivityIcon(activity.type)}</span>
                  <span>{activity.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Активные курсы */}
          <div className={`rounded-xl border p-5 shadow-sm ${cardBg} transition-colors`}>
            <h2 className={`mb-4 text-lg font-semibold ${titleText} transition-colors`}>📚 Активные курсы</h2>
            {coursesLoading ? (
              <div className={`text-sm ${mutedText} transition-colors`}>Загрузка курсов...</div>
            ) : courses.length === 0 ? (
              <div className={`text-sm ${mutedText} transition-colors`}>Нет доступных курсов</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`rounded-lg border p-4 transition hover:shadow-md ${cardBgAlt} ${isDarkTheme ? "border-[#30363d]" : "border-gray-200"} ${hoverBorder} transition-colors`}
                  >
                    <div className={`mb-2 text-sm font-medium ${titleText} transition-colors`}>{course.title}</div>
                    <div className={`text-xs ${mutedText} transition-colors`}>{course.description || "Без описания"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка (сайдбар) */}
        <div className="space-y-6">
          {/* Дедлайны */}
          <div className={`rounded-xl border p-5 shadow-sm ${cardBg} transition-colors`}>
            <h2 className={`mb-4 text-lg font-semibold ${titleText} transition-colors`}>📅 Дедлайны</h2>
            <ul className="space-y-3">
              {mockDeadlines.map((deadline) => (
                <li key={deadline.id} className={`border-l-2 pl-3 ${deadlineBorder} transition-colors`}>
                  <div className={`text-xs ${getUrgencyColor(deadline.urgency, isDarkTheme)} transition-colors`}>
                    {getUrgencyLabel(deadline.urgency)} {deadline.time}
                  </div>
                  <div className={`text-sm ${bodyText} transition-colors`}>{deadline.title}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Рейтинг */}
          <div className={`rounded-xl border p-5 shadow-sm ${cardBg} transition-colors`}>
            <h2 className={`mb-4 text-lg font-semibold ${titleText} transition-colors`}>🏆 Рейтинг</h2>
            <ul className="space-y-2">
              {mockRatings.map((student, index) => (
                <li key={student.id} className="flex items-center justify-between text-sm">
                  <span className={bodyText}>
                    <span className={`mr-2 font-medium ${mutedText}`}>{index + 1}.</span>
                    {student.name}
                  </span>
                  <span className={`font-medium ${ratingText}`}>{student.points}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Советы */}
          <div className={`rounded-xl border p-5 shadow-sm ${cardBgAlt} ${isDarkTheme ? "border-[#2d2d2d]" : "border-[#d4cfe6]"} transition-colors`}>
            <h2 className={`mb-3 text-lg font-semibold ${titleText} transition-colors`}>💡 Советы</h2>
            <p className={`text-sm italic ${mutedText} transition-colors`}>"Не забудь push"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

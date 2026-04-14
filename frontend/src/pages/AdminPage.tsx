import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GitBranch,
  Clock,
  TrendingUp,
  ArrowRight,
  MoreHorizontal,
  Download,
  Plus,
  Info,
  AlertOctagon,
  GitCommit,
  Cloud,
  RotateCcw,
  Database,
  Mail,
  CheckCircle2,
  AlertTriangle,
  GitPullRequest,
} from "lucide-react";
import type { AdminUserRead } from "../api/types";
import { getAdminUsers } from "../api/adminApi";

const mockRepositories = [
  { id: "1", name: "algorithms-course", author: "Иван Петров", commits: 24, isPublic: true, initials: "ИП", color: "bg-blue-500/20 text-blue-400" },
  { id: "2", name: "web-project-2024", author: "Мария Сидорова", commits: 18, isPublic: false, initials: "МС", color: "bg-purple-500/20 text-purple-400" },
  { id: "3", name: "database-labs", author: "Алексей Козлов", commits: 31, isPublic: true, initials: "АК", color: "bg-green-500/20 text-green-400" },
  { id: "4", name: "ml-research", author: "Ольга Новикова", commits: 12, isPublic: false, initials: "ОН", color: "bg-orange-500/20 text-orange-400" },
  { id: "5", name: "frontend-course", author: "Дмитрий Смирнов", commits: 45, isPublic: true, initials: "ДС", color: "bg-pink-500/20 text-pink-400" },
];

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ElementType;
}

function StatCard({ title, value, trend, trendUp, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white border-gray-200 rounded-xl border p-5 shadow-sm transition-colors dark:bg-[#1e1e1e] dark:border-[#2d2d2d]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className={`mt-1 text-xs font-medium ${trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-[#2d2d2d]">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400",
    active: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400",
    blocked: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400",
  };
  const labels = { pending: "Ожидает", active: "Активен", blocked: "Заблокирован" };
  const style = styles[status as keyof typeof styles] || styles.pending;
  const label = labels[status as keyof typeof labels] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserRead[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const list = await getAdminUsers();
        setUsers(list.slice(0, 5));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = [
    { title: "Всего пользователей", value: "1,248", trend: "+14 за неделю", trendUp: true, icon: Users },
    { title: "Репозиториев", value: "856", trend: "+32 за неделю", trendUp: true, icon: GitBranch },
    { title: "Активность", value: "94%", trend: "+5% за неделю", trendUp: true, icon: TrendingUp },
    { title: "Среднее время", value: "2.4ч", trend: "-12 мин", trendUp: true, icon: Clock },
  ];

  return (
    <div className="h-full overflow-auto bg-[#f8f9fa] transition-colors dark:bg-[#0f0f10]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] transition-colors dark:text-white">Панель администратора</h1>
            <p className="mt-1 text-sm text-gray-500 transition-colors dark:text-gray-400">Platform v1.0</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-[#1e1e1e] dark:border-[#2d2d2d] dark:text-gray-300 dark:hover:bg-[#2d2d2d]"
            >
              <Download className="h-4 w-4" />
              Экспорт отчёта
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Новый курс
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Bottom Row - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
          {/* Left - New Users Table (60%) */}
          <div className="lg:col-span-3 bg-white border-gray-200 rounded-xl border shadow-sm transition-colors dark:bg-[#1e1e1e] dark:border-[#2d2d2d]">
            <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-gray-900 transition-colors dark:text-white">Новые пользователи</h2>
              <Link to="/admin/users" className="text-sm flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Все <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="text-sm text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div>
              ) : (
                <table className="w-auto">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-3 pr-8 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Имя</th>
                      <th className="pb-3 pr-8 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Группа</th>
                      <th className="pb-3 pr-8 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Роль</th>
                      <th className="pb-3 pr-8 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Дата</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-left text-gray-500 dark:text-gray-400">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2d2d2d]">
                    {users.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#252525]">
                        <td className="py-3 pr-8">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-8 text-sm text-gray-600 dark:text-gray-300">{user.group_name || "—"}</td>
                        <td className="py-3 pr-8">
                          <span className="text-sm capitalize text-gray-600 dark:text-gray-300">{user.role}</span>
                        </td>
                        <td className="py-3 pr-8 text-sm text-gray-600 dark:text-gray-300">
                          {new Date(user.created_at).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="py-3 text-left">
                          {getStatusBadge(user.is_blocked ? "blocked" : "active")}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Нет данных</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right - Active Repositories (40%) */}
          <div className="lg:col-span-2 bg-white border-gray-200 rounded-xl border shadow-sm transition-colors dark:bg-[#1e1e1e] dark:border-[#2d2d2d]">
            <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-gray-900 transition-colors dark:text-white">Активные репозитории</h2>
              <button className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {mockRepositories.map((repo) => (
                  <div key={repo.id} className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-[#252525]">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${repo.color}`}>
                      {repo.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{repo.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{repo.author} • {repo.commits} коммитов</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${repo.isPublic ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-500/20" : "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-500/20"}`}>
                      {repo.isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Third Row - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Notifications */}
          <div className="bg-white border-gray-200 rounded-xl border shadow-sm transition-colors dark:bg-[#1e1e1e] dark:border-[#2d2d2d]">
            <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-gray-900 transition-colors dark:text-white">Уведомления</h2>
              <button className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-300">Очистить</button>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {[
                  { icon: AlertOctagon, iconBg: "bg-red-100 dark:bg-red-500/20", iconColor: "text-red-600 dark:text-red-400", text: "Дисковое пространство на 87%", time: "10 минут назад • Сервер 1" },
                  { icon: Users, iconBg: "bg-yellow-100 dark:bg-yellow-500/20", iconColor: "text-yellow-600 dark:text-yellow-400", text: "Новая регистрация без подтверждения домена", time: "32 мин назад • Пользователи" },
                  { icon: Cloud, iconBg: "bg-blue-100 dark:bg-blue-500/20", iconColor: "text-blue-600 dark:text-blue-400", text: "Импорт из GitHub: 4 репо (Группа ИСТ-21)", time: "1 час назад • Репозитории" },
                  { icon: GitCommit, iconBg: "bg-purple-100 dark:bg-purple-500/20", iconColor: "text-purple-600 dark:text-purple-400", text: "Pull request без проверки > 48 ч", time: "5 час назад • Code Review" },
                  { icon: Info, iconBg: "bg-green-100 dark:bg-green-500/20", iconColor: "text-green-600 dark:text-green-400", text: "Курс «Сети ЭВМ» опубликован", time: "Вчера • Контент" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-[#252525]">
                    <div className={`p-1.5 rounded ${item.iconBg}`}>
                      <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.text}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Commits by Department */}
          <div className="bg-white border-gray-200 rounded-xl border shadow-sm transition-colors dark:bg-[#1e1e1e] dark:border-[#2d2d2d]">
            <div className="p-5 border-b border-gray-100 dark:border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-gray-900 transition-colors dark:text-white">Коммиты по кафедрам</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4 mb-6">
                {[
                  { name: "Инф. системы", commits: 341, color: "bg-blue-500" },
                  { name: "Сети и тел.", commits: 265, color: "bg-green-500" },
                  { name: "Безопасность", commits: 199, color: "bg-purple-500" },
                  { name: "Математика", commits: 128, color: "bg-orange-500" },
                  { name: "Иностранные", commits: 48, color: "bg-pink-500" },
                ].map((dept) => (
                  <div key={dept.name} className="rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-[#252525]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{dept.name}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{dept.commits}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-[#2d2d2d]">
                      <div className={`h-full rounded-full ${dept.color}`} style={{ width: `${(dept.commits / 341) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 dark:border-[#2d2d2d]">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  <GitPullRequest className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  Code Review в очереди
                </h3>
                <div className="space-y-2">
                  {[
                    { name: "ist21/lab-db-pet...", pr: "3 PR", icon: AlertOctagon, iconColor: "text-red-500", status: "Срочно", statusClass: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
                    { name: "is22/networks-l...", pr: "1 PR", icon: Clock, iconColor: "text-yellow-500", status: "Сегодня", statusClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400" },
                    { name: "kuz/os-course-2026", pr: "7 PR", icon: CheckCircle2, iconColor: "text-green-500", status: "Норм", statusClass: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-xl p-3 bg-gray-50 dark:bg-[#252525] transition-colors hover:bg-gray-100 dark:hover:bg-[#2d2d2d]">
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon className={`h-4 w-4 flex-shrink-0 ${item.iconColor}`} />
                        <div>
                          <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.pr} на ревью</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.statusClass}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white border-gray-200 rounded-xl border shadow-sm transition-colors dark:bg-[#1e1e1e] dark:border-[#2d2d2d]">
            <div className="p-5 border-b border-gray-100 dark:border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-gray-900 transition-colors dark:text-white">Состояние системы</h2>
            </div>
            <div className="p-5">
              {/* Progress bars */}
              <div className="space-y-4 mb-6">
                {[
                  { label: "CPU", value: 42, color: "bg-blue-500" },
                  { label: "RAM", value: 61, color: "bg-green-500" },
                  { label: "Диск", value: 87, color: "bg-red-500" },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.value}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-[#2d2d2d]">
                      <div className={`h-full rounded-full ${metric.color} ${metric.value > 80 ? "brightness-110" : ""}`} style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Service status */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: GitBranch, label: "Git сервис", status: "OK", statusColor: "text-green-600 dark:text-green-400" },
                  { icon: Database, label: "БД (PostgreSQL)", status: "OK", statusColor: "text-green-600 dark:text-green-400" },
                  { icon: Mail, label: "Почтовый сервер", status: "Задержка", statusColor: "text-yellow-600 dark:text-yellow-400" },
                ].map((svc) => (
                  <div key={svc.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svc.icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{svc.label}</span>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium ${svc.statusColor}`}>
                      {svc.status === "OK" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {svc.status}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Бэкап</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">Вчера 03:00</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-[#2d2d2d]">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-[#2d2d2d] dark:border-[#3d3d3d] dark:text-gray-300 dark:hover:bg-[#3d3d3d]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Перезапустить
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <Database className="h-4 w-4" />
                  Бэкап сейчас
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

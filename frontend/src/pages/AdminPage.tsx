import { useEffect, useState, useCallback } from "react";
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
  BellOff,
  X,
  Search,
  Filter,
  type LucideIcon,
} from "lucide-react";
import type { AdminUserRead } from "../api/types";
import { getAdminUsers, getSystemMetrics, getServiceStatus, getBackups, createBackup, getCommitsByFaculty, getActiveRepositories } from "../api/adminApi";
import type { SystemMetrics, ServiceStatus, BackupInfo, FacultyCommitsStat, ActiveRepositoryStat } from "../api/types";
import toast from "react-hot-toast";

interface Stats {
  total: number;
  active: number;
  pending: number;
  blocked: number;
}

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ElementType;
}

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  category: 'server' | 'users' | 'git' | 'edu';
}

function getIcon(type: Notification['type']): LucideIcon {
  switch (type) {
    case 'critical':
      return AlertOctagon;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    case 'success':
      return CheckCircle2;
    default:
      return Info;
  }
}

function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'critical':
      return 'text-red-500 bg-red-500';
    case 'warning':
      return 'text-yellow-500 bg-yellow-500';
    case 'info':
      return 'text-blue-500 bg-blue-500';
    case 'success':
      return 'text-green-500 bg-green-500';
    default:
      return 'text-blue-500 bg-blue-500';
  }
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
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRead[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, blocked: 0 });
  const [systemStatus, setSystemStatus] = useState<{ api: "online" | "offline"; db: "online" | "offline" }>({ api: "offline", db: "offline" });
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [facultyStats, setFacultyStats] = useState<FacultyCommitsStat[]>([]);
  const [facultyStatsLoading, setFacultyStatsLoading] = useState(false);
  const [activeRepositories, setActiveRepositories] = useState<ActiveRepositoryStat[]>([]);
  const [activeRepositoriesLoading, setActiveRepositoriesLoading] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setFacultyStatsLoading(true);
    setActiveRepositoriesLoading(true);
    try {
      const [list, sysMetrics, svcStatus, backups, facultyData, repoData] = await Promise.all([
        getAdminUsers(),
        getSystemMetrics().catch(() => null),
        getServiceStatus().catch(() => null),
        getBackups().catch(() => null),
        getCommitsByFaculty().catch(() => []),
        getActiveRepositories(5).catch(() => []),
      ]);
      setUsers(list);
      setStats({
        total: list.length,
        active: list.filter((u) => !u.is_blocked).length,
        pending: list.filter((u) => u.is_pending).length,
        blocked: list.filter((u) => u.is_blocked).length,
      });
      setMetrics(sysMetrics);
      setServiceStatus(svcStatus);
      setBackupInfo(backups);
      setFacultyStats(facultyData);
      setActiveRepositories(repoData);

      // Check system metrics and add notifications if needed
      if (sysMetrics) {
        const newNotifications: Notification[] = [];
        
        // Check disk usage
        if (sysMetrics.disk_usage >= 85) {
          newNotifications.push({
            id: `disk-${Date.now()}`,
            type: sysMetrics.disk_usage >= 95 ? 'critical' : 'warning',
            title: 'Диск переполнен',
            message: `Использовано ${sysMetrics.disk_usage}% дискового пространства`,
            timestamp: 'только что',
            category: 'server',
          });
        }
        
        // Check memory usage
        if (sysMetrics.memory_usage >= 90) {
          newNotifications.push({
            id: `mem-${Date.now()}`,
            type: 'critical',
            title: 'Высокая загрузка RAM',
            message: `Использовано ${sysMetrics.memory_usage}% оперативной памяти`,
            timestamp: 'только что',
            category: 'server',
          });
        }
        
        // Check CPU usage
        if (sysMetrics.cpu_usage >= 95) {
          newNotifications.push({
            id: `cpu-${Date.now()}`,
            type: 'warning',
            title: 'Высокая загрузка CPU',
            message: `CPU загружен на ${sysMetrics.cpu_usage}%`,
            timestamp: 'только что',
            category: 'server',
          });
        }
        
        // Check service status
        if (svcStatus && !svcStatus.git) {
          newNotifications.push({
            id: `git-${Date.now()}`,
            type: 'critical',
            title: 'Git сервис недоступен',
            message: 'Gitea не отвечает на запросы',
            timestamp: 'только что',
            category: 'git',
          });
        }
        
        if (newNotifications.length > 0) {
          setNotifications((prev) => [...newNotifications, ...prev]);
        }
      }
      setSystemStatus({
        api: svcStatus?.api ? "online" : "offline",
        db: svcStatus?.db ? "online" : "offline",
      });
    } catch {
      setSystemStatus({ api: "offline", db: "offline" });
    } finally {
      setLoading(false);
      setFacultyStatsLoading(false);
      setActiveRepositoriesLoading(false);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showRepoDropdown && !(event.target as Element).closest('.repo-dropdown-container')) {
        setShowRepoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRepoDropdown]);

  const handleCreateBackup = useCallback(async () => {
    setBackupLoading(true);
    try {
      const result = await createBackup();
      // Refresh backup info
      const backups = await getBackups();
      setBackupInfo(backups);
      // Add notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'success',
        title: 'Бэкап создан',
        message: `Файл: ${result.file}`,
        timestamp: 'только что',
        category: 'server',
      };
      setNotifications((prev) => [newNotification, ...prev]);
      toast.success("Бэкап успешно создан!");
    } catch (err) {
      // Add error notification
      const errorNotification: Notification = {
        id: Date.now().toString(),
        type: 'critical',
        title: 'Ошибка бэкапа',
        message: err instanceof Error ? err.message : "Не удалось создать бэкап",
        timestamp: 'только что',
        category: 'server',
      };
      setNotifications((prev) => [errorNotification, ...prev]);
      toast.error(err instanceof Error ? err.message : "Ошибка создания бэкапа");
    } finally {
      setBackupLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Calculate weekly trends (compare current week vs previous week)
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const isInRange = (date: string, start: Date, end: Date) => {
    const d = new Date(date);
    return d >= start && d < end;
  };

  // Current week (last 7 days)
  const currentNew = users.filter((u) => isInRange(u.created_at, oneWeekAgo, now)).length;
  const currentActive = users.filter((u) => !u.is_blocked && isInRange(u.created_at, oneWeekAgo, now)).length;
  const currentPending = users.filter((u) => u.is_pending && isInRange(u.created_at, oneWeekAgo, now)).length;
  const currentBlocked = users.filter((u) => u.is_blocked && isInRange(u.created_at, oneWeekAgo, now)).length;

  // Previous week (7-14 days ago)
  const prevNew = users.filter((u) => isInRange(u.created_at, twoWeeksAgo, oneWeekAgo)).length;
  const prevActive = users.filter((u) => !u.is_blocked && isInRange(u.created_at, twoWeeksAgo, oneWeekAgo)).length;
  const prevPending = users.filter((u) => u.is_pending && isInRange(u.created_at, twoWeeksAgo, oneWeekAgo)).length;
  const prevBlocked = users.filter((u) => u.is_blocked && isInRange(u.created_at, twoWeeksAgo, oneWeekAgo)).length;

  const formatTrend = (current: number, previous: number) => {
    const diff = current - previous;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff} за неделю`;
  };

  const statCards = [
    { title: "Всего пользователей", value: stats.total.toLocaleString(), trend: formatTrend(currentNew, prevNew), trendUp: currentNew >= prevNew, icon: Users },
    { title: "Активных", value: stats.active.toLocaleString(), trend: formatTrend(currentActive, prevActive), trendUp: currentActive >= prevActive, icon: GitBranch },
    { title: "Ожидают", value: stats.pending.toLocaleString(), trend: formatTrend(currentPending, prevPending), trendUp: currentPending >= prevPending, icon: TrendingUp },
    { title: "Заблокировано", value: stats.blocked.toLocaleString(), trend: formatTrend(currentBlocked, prevBlocked), trendUp: currentBlocked >= prevBlocked, icon: Clock },
  ];

  return (
    <div className="h-full overflow-auto bg-[#f8f9fa] transition-colors dark:bg-[#0f0f10]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] transition-colors dark:text-white">Панель администратора</h1>
            <p className="mt-1 text-sm text-gray-500 transition-colors dark:text-gray-400">
              API: <span className={systemStatus.api === "online" ? "text-emerald-500" : "text-red-500"}>●</span> {systemStatus.api === "online" ? "Online" : "Offline"} | DB: <span className={systemStatus.db === "online" ? "text-emerald-500" : "text-red-500"}>●</span> {systemStatus.db === "online" ? "Online" : "Offline"}
            </p>
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
          {statCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Bottom Row - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
          {/* Left - New Users Table (60%) */}
          <div className="lg:col-span-3 bg-white border-gray-200 rounded-xl border shadow-sm transition-colors dark:bg-[#1e1e1e] dark:border-[#2d2d2d]">
            <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-gray-900 transition-colors dark:text-white">Новые пользователи</h2>
              <Link to="/users" className="group text-sm flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Все <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
                      <tr key={user.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg">
                        <td className="py-3 pr-8 first:rounded-l-lg last:rounded-r-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-8 text-sm text-gray-600 dark:text-gray-300 first:rounded-l-lg last:rounded-r-lg">{user.group_name || "—"}</td>
                        <td className="py-3 pr-8 first:rounded-l-lg last:rounded-r-lg">
                          <span className="text-sm capitalize text-gray-600 dark:text-gray-300">
                            {user.role === "admin" ? "Админ" : user.role === "teacher" ? "Препод" : user.role === "laborant" ? "Лаборант" : "Студент"}
                          </span>
                        </td>
                        <td className="py-3 pr-8 text-sm text-gray-600 dark:text-gray-300 first:rounded-l-lg last:rounded-r-lg">
                          {user.created_at && !isNaN(new Date(user.created_at).getTime())
                            ? new Date(user.created_at).toLocaleDateString("ru-RU")
                            : "—"}
                        </td>
                        <td className="py-3 text-left first:rounded-l-lg last:rounded-r-lg">
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
              <div className="relative repo-dropdown-container">
                <button
                  onClick={() => setShowRepoDropdown(!showRepoDropdown)}
                  className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {showRepoDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200/50 bg-white/95 backdrop-blur-md shadow-lg dark:bg-[#1e1e1e]/95 dark:border-[#2d2d2d]/50 z-50">
                    <div className="p-1.5 space-y-0.5">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100/80 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-[#2d2d2d]/80">
                        <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Создать репозиторий
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100/80 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-[#2d2d2d]/80">
                        <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Поиск проекта
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100/80 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-[#2d2d2d]/80">
                        <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Фильтр по кафедре
                      </button>
                      <div className="h-px bg-gray-200/50 dark:bg-[#2d2d2d]/50 mx-1" />
                      <button
                        onClick={() => { setActiveRepositoriesLoading(true); load(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100/80 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-[#2d2d2d]/80"
                      >
                        <RotateCcw className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Обновить список
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {activeRepositoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : activeRepositories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Нет активных репозиториев
                  </div>
                ) : (
                  activeRepositories.map((repo) => (
                    <div key={repo.id} className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-[#252525]">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${repo.color}`}>
                        {repo.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{repo.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{repo.author} • {repo.commits} коммитов</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${repo.is_public ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-500/20" : "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-500/20"}`}>
                        {repo.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                  ))
                )}
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
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="h-3 w-3" />
                  Очистить все
                </button>
              )}
            </div>
            <div className="p-5">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                  <BellOff className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">Уведомлений пока нет</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const Icon = getIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className="flex items-start gap-3 rounded-lg p-3 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-[#252525]"
                      >
                        <div className="mt-0.5">
                          <div className={`h-2 w-2 rounded-full ${colorClass.split(' ')[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <Icon className={`h-4 w-4 flex-shrink-0 ${colorClass.split(' ')[0]}`} />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {notification.timestamp} • {notification.category}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Commits by Department */}
          <div className="bg-white border-gray-200 rounded-xl border shadow-sm transition-colors dark:bg-[#1e1e1e] dark:border-[#2d2d2d]">
            <div className="p-5 border-b border-gray-100 dark:border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-gray-900 transition-colors dark:text-white">Коммиты по кафедрам</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4 mb-6">
                {facultyStatsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : facultyStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Нет данных о коммитах
                  </div>
                ) : (
                  facultyStats.map((dept) => (
                    <div key={dept.short_name} className="rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-[#252525]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{dept.faculty}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{dept.commits}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-[#2d2d2d]">
                        <div className={`h-full rounded-full ${dept.color}`} style={{ width: `${(dept.commits / Math.max(...facultyStats.map(s => s.commits))) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
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
                {metrics ? [
                  { label: "CPU", value: Math.round(metrics.cpu_percent), color: "bg-blue-500" },
                  { label: "RAM", value: Math.round(metrics.memory_percent), color: "bg-green-500" },
                  { label: "Диск", value: Math.round(metrics.disk_percent), color: "bg-red-500" },
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
                )) : (
                  <div className="text-sm text-gray-500">Загрузка метрик...</div>
                )}
              </div>

              {/* Service status */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: GitBranch, label: "Git сервис", status: serviceStatus?.git ? "Online" : "Offline", statusColor: serviceStatus?.git ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
                  { icon: Database, label: "БД (PostgreSQL)", status: serviceStatus?.db ? "Online" : "Offline", statusColor: serviceStatus?.db ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
                  { icon: Mail, label: "API", status: serviceStatus?.api ? "Online" : "Offline", statusColor: serviceStatus?.api ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
                ].map((svc) => (
                  <div key={svc.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svc.icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{svc.label}</span>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium ${svc.statusColor}`}>
                      {svc.status === "Online" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {svc.status}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Бэкап</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {backupInfo?.last_backup || "Нет данных"}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-[#2d2d2d]">
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-[#2d2d2d] dark:border-[#3d3d3d] dark:text-gray-300 dark:hover:bg-[#3d3d3d] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Обновление..." : "Обновить данные"}
                </button>
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={backupLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Database className={`h-4 w-4 ${backupLoading ? "animate-pulse" : ""}`} />
                  {backupLoading ? "Создание..." : "Бэкап сейчас"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

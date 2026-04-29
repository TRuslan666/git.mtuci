import { useState, useEffect, useRef } from "react";
import {
  Download,
  Upload,
  Plus,
  Search,
  Users,
  CheckCircle,
  Briefcase,
  Trash2,
  Eye,
  Edit,
  Lock,
  Unlock,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { getAdminUsers, patchAdminUser, approveUser, resetAdminUserPassword, getGroups } from "../api/adminApi";
import { getMe } from "../api/authApi";
import { usePermissions } from "../hooks/usePermissions";
import { usePendingCount } from "../context/PendingCountContext";
import type { AdminUserRead, UserRole, UserRead } from "../api/types";

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  group: string;
  role: "student" | "teacher" | "admin" | "laborant";
  status: "active" | "pending" | "blocked";
  repos: number;
  lastLogin: string;
}

function getRoleBadge(role: User["role"]) {
  const styles = {
    student: "bg-blue-500/20 text-blue-400",
    teacher: "bg-purple-500/20 text-purple-400",
    admin: "bg-yellow-500/20 text-yellow-400",
    laborant: "bg-pink-500/20 text-pink-400",
  };
  const labels = {
    student: "Студент",
    teacher: "Препод",
    admin: "Админ",
    laborant: "Лаборант",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
      {labels[role]}
    </span>
  );
}

function getStatusBadge(status: User["status"]) {
  const styles = {
    active: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    blocked: "bg-red-500/20 text-red-400",
  };
  const labels = {
    active: "Активен",
    pending: "Ожидает",
    blocked: "Заблокирован",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

interface UsersPageProps {
  isDarkTheme?: boolean;
}

export default function UsersPage({ isDarkTheme = true }: UsersPageProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { hasPermission } = usePermissions();

  // Search with debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.toLowerCase());
      setCurrentPage(1);
      setSelectedUsers([]); // Reset selection on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  // Toast notification
  const [toast, setToast] = useState<{message: string; type: 'error' | 'success'} | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Current user (for self-protection)
  const [currentUser, setCurrentUser] = useState<UserRead | null>(null);

  // Modals state
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then(setCurrentUser).catch(() => null);
  }, []);
  const [editForm, setEditForm] = useState<{
    role: UserRole;
    group_name: string;
    student_id: string;
  }>({
    role: "student",
    group_name: "",
    student_id: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);

  // Russian pluralization helper for records
  const pluralizeRecords = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return "записей";
    }
    if (lastDigit === 1) {
      return "запись";
    }
    if (lastDigit >= 2 && lastTwoDigits <= 4) {
      return "записи";
    }
    return "записей";
  };
  const perPageRef = useRef<HTMLDivElement>(null);

  // Role filter
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Group filter
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  // Close perPage dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (perPageRef.current && !perPageRef.current.contains(event.target as Node)) {
        setShowPerPageDropdown(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (groupRef.current && !groupRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load groups on mount
  useEffect(() => {
    getGroups().then(setAvailableGroups).catch(() => []);
  }, []);

  const handleBlockToggle = async (user: User) => {
    if (user.role === "admin") {
      showToast("Вы не можете изменить статус пользователя с ролью Администратор", "error");
      return;
    }
    setActionLoading(true);
    try {
      const currentlyBlocked = user.status === "blocked";
      await patchAdminUser(user.id, {
        role: user.role,
        is_blocked: !currentlyBlocked,
        is_pending: user.status === "pending",
      });
      const res = await getAdminUsers();
      updateUsers(res);
      showToast(currentlyBlocked ? "Пользователь разблокирован" : "Пользователь заблокирован", "success");
    } catch {
      showToast("Ошибка при изменении статуса", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const { decrementPending } = usePendingCount();

  const handleApprove = async (user: User) => {
    if (user.role === "admin") {
      showToast("Вы не можете подтвердить пользователя с ролью Администратор", "error");
      return;
    }
    setActionLoading(true);
    try {
      await approveUser(user.id);
      // Уменьшаем счётчик в сайдбаре сразу после успешного подтверждения
      decrementPending();
      const res = await getAdminUsers();
      updateUsers(res);
      showToast("Пользователь подтвержден", "success");
    } catch {
      showToast("Ошибка при подтверждении", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      role: user.role,
      group_name: user.group === "—" ? "" : user.group,
      student_id: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (editUser.role === "admin") {
      showToast("Вы не можете редактировать пользователя с ролью Администратор", "error");
      return;
    }
    setActionLoading(true);
    try {
      await patchAdminUser(editUser.id, {
        role: editForm.role,
        is_blocked: editUser.status === "blocked",
        is_pending: editUser.status === "pending",
        group_name: editForm.group_name || null,
      });
      setEditUser(null);
      const res = await getAdminUsers();
      updateUsers(res);
      showToast("Изменения сохранены", "success");
    } catch {
      showToast("Ошибка при сохранении", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const updateUsers = (res: AdminUserRead[]) => {
    setUsers(
      res.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        group: u.group_name || "—",
        role: u.role,
        status: u.is_blocked
          ? "blocked"
          : u.is_pending
          ? "pending"
          : "active",
        repos: 0,
        lastLogin: u.last_login
          ? new Date(u.last_login).toLocaleDateString()
          : "—",
        initials: u.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
        color: "bg-blue-500",
      }))
    );
    setTotalUsers(res.length);
  };

useEffect(() => {
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminUsers();
      setUsers(
        res.map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          group: u.group_name || "—",
          role: u.role,

          status: u.is_blocked
            ? "blocked"
            : u.is_pending
            ? "pending"
            : "active",

          repos: 0,
          lastLogin: u.last_login
            ? new Date(u.last_login).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",

          initials: u.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),

          color: "bg-blue-500",
        }))
      );

      setTotalUsers(res.length);

    } catch {
      setError("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };
    fetchUsers();
  }, []);



  const stats = [
    {
      label: "Всего",
      value: totalUsers,
      color: "text-white",
    },
    {
      label: "Активных",
      value: users.filter(u => u.status === "active").length,
      color: "text-white",
    },
    {
      label: "Ожидают",
      value: users.filter(u => u.status === "pending").length,
      color: "text-white",
    },
    {
      label: "Заблокировано",
      value: users.filter(u => u.status === "blocked").length,
      color: "text-red-400",
    },
  ];

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  // Apply filters and search (cumulative)
  const filteredUsers = users.filter((user) => {
    // Role filter
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    // Status filter
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    // Group filter
    if (groupFilter !== "all" && user.group !== groupFilter) return false;
    // Search filter (ФИО and Email, case-insensitive)
    if (debouncedSearch) {
      const searchLower = debouncedSearch;
      const nameMatch = user.name.toLowerCase().includes(searchLower);
      const emailMatch = user.email.toLowerCase().includes(searchLower);
      if (!nameMatch && !emailMatch) return false;
    }
    return true;
  });

  // Reset selection when filters change
  useEffect(() => {
    setSelectedUsers([]);
  }, [roleFilter, statusFilter, groupFilter, debouncedSearch]);

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setGroupFilter("all");
    setCurrentPage(1);
    setSelectedUsers([]);
  };

  // Theme-based colors
  const pageBg = isDarkTheme ? "bg-[#0f0f10]" : "bg-[#f5f3fa]";
  const textPrimary = isDarkTheme ? "text-white" : "text-gray-900";
  const cardBg = isDarkTheme ? "bg-[#1e1e1e] border-[#2d2d2d]" : "bg-white border-[#d4cfe6]";
  const cardHover = isDarkTheme ? "hover:bg-[#252525]" : "hover:bg-gray-50";
  const textSecondary = isDarkTheme ? "text-gray-400" : "text-gray-500";
  const textTertiary = isDarkTheme ? "text-gray-300" : "text-gray-600";
  const headerBg = isDarkTheme ? "bg-[#1e1e1e] border-[#2d2d2d]" : "bg-white border-gray-200";
  const inputBg = isDarkTheme ? "bg-[#252525] border-[#3d3d3d]" : "bg-white border-gray-300";
  const dividerColor = isDarkTheme ? "divide-[#2d2d2d]" : "divide-gray-100";
  const tableHover = isDarkTheme ? "hover:bg-[#252525]" : "hover:bg-gray-50";

  return (
    <div className={`h-full overflow-y-auto ${pageBg} ${textPrimary} transition-colors`}>
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Все пользователи</h1>
            <span className={`text-sm ${textSecondary}`}>
              {filteredUsers.length === totalUsers 
                ? `${totalUsers} ${pluralizeRecords(totalUsers)}` 
                : `Найдено ${filteredUsers.length} из ${totalUsers}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors shadow-sm ${cardBg} ${cardHover}`}>
              <Download className="h-4 w-4" />
              Экспорт CSV
            </button>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors shadow-sm ${cardBg} ${cardHover}`}>
              <Upload className="h-4 w-4" />
              Импорт
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="h-4 w-4" />
              Добавить
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#161616] rounded-xl p-5 border border-[#2d2d2d]">
              <p className="text-sm text-[#8b949e] mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color === "text-white" ? "text-[#ccd0d4]" : stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-[#161616] rounded-xl p-4 border border-[#2d2d2d] flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e7681]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ФИО или Email..."
              className="w-full pl-10 pr-10 py-2 bg-[#0d0d0d] border border-[#30363d] rounded-lg text-sm text-[#ccd0d4] placeholder-[#6e7681] focus:outline-none focus:border-[#484f58] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#30363d] rounded-full transition-colors"
              >
                <X className="h-3.5 w-3.5 text-[#6e7681]" />
              </button>
            )}
          </div>
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-[#30363d] rounded-lg text-sm text-[#8b949e] hover:text-[#ccd0d4] transition-colors"
            >
              <Users className="h-4 w-4" />
              {roleFilter === "all" ? "Все роли" : roleFilter === "admin" ? "Админ" : roleFilter === "teacher" ? "Препод" : roleFilter === "laborant" ? "Лаборант" : "Студент"}
              <ChevronDown className={`h-3 w-3 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} />
            </button>
            {showRoleDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-36 bg-[#161616] border border-[#2d2d2d] rounded-xl shadow-xl z-50 overflow-hidden">
                {[
                  { value: "all", label: "Все роли" },
                  { value: "admin", label: "Администратор" },
                  { value: "teacher", label: "Преподаватель" },
                  { value: "laborant", label: "Лаборант" },
                  { value: "student", label: "Студент" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setRoleFilter(opt.value); setShowRoleDropdown(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                      roleFilter === opt.value
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-[#8b949e] hover:bg-[#1f2937]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-[#30363d] rounded-lg text-sm text-[#8b949e] hover:text-[#ccd0d4] transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              {statusFilter === "all" ? "Все статусы" : statusFilter === "active" ? "Активен" : statusFilter === "pending" ? "Ожидает" : "Заблокирован"}
              <ChevronDown className={`h-3 w-3 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-36 bg-[#161616] border border-[#2d2d2d] rounded-xl shadow-xl z-50 overflow-hidden">
                {[
                  { value: "all", label: "Все статусы" },
                  { value: "active", label: "Активен" },
                  { value: "pending", label: "Ожидает" },
                  { value: "blocked", label: "Заблокирован" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setShowStatusDropdown(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                      statusFilter === opt.value
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-[#8b949e] hover:bg-[#1f2937]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={groupRef}>
            <button
              onClick={() => setShowGroupDropdown(!showGroupDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-[#30363d] rounded-lg text-sm text-[#8b949e] hover:text-[#ccd0d4] transition-colors"
            >
              <Briefcase className="h-4 w-4" />
              {groupFilter === "all" ? "Все группы" : groupFilter}
              <ChevronDown className={`h-3 w-3 transition-transform ${showGroupDropdown ? "rotate-180" : ""}`} />
            </button>
            {showGroupDropdown && (
              <div className="absolute top-full left-0 mt-1.5 min-w-[160px] max-w-[200px] bg-[#161616] border border-[#2d2d2d] rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                <button
                  onClick={() => { setGroupFilter("all"); setShowGroupDropdown(false); }}
                  className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                    groupFilter === "all"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-[#8b949e] hover:bg-[#1f2937]"
                  }`}
                >
                  Все группы
                </button>
                {availableGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => { setGroupFilter(group); setShowGroupDropdown(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors truncate ${
                      groupFilter === group
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-[#8b949e] hover:bg-[#1f2937]"
                    }`}
                  >
                    {group}
                  </button>
                ))}
                {availableGroups.length === 0 && (
                  <div className="px-4 py-2.5 text-sm text-[#6e7681]">Нет групп</div>
                )}
              </div>
            )}
          </div>
          {selectedUsers.length > 0 && (
            <button className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors ml-auto">
              <Trash2 className="h-4 w-4" />
              Удалить выбранных ({selectedUsers.length})
            </button>
          )}
        </div>

        {/* Users Table */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className="bg-[#161616] rounded-xl border border-[#2d2d2d] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d2d]">
                <th className="px-4 py-3 text-left">
                  <div
                    onClick={toggleSelectAll}
                    className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                      selectedUsers.length === users.length && users.length > 0
                        ? "bg-blue-500 border-blue-500"
                        : "bg-transparent border-[#484f58] hover:border-[#6e7681]"
                    }`}
                  >
                    {selectedUsers.length === users.length && users.length > 0 && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6e7681] uppercase">Пользователь</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6e7681] uppercase">Группа</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6e7681] uppercase">Роль</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6e7681] uppercase">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6e7681] uppercase">Репо</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6e7681] uppercase">Последний вход</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6e7681] uppercase">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-[#1f2937] rounded-full">
                        <Search className="h-8 w-8 text-[#6e7681]" />
                      </div>
                      <p className="text-[#8b949e]">Пользователи не найдены</p>
                      {(roleFilter !== "all" || statusFilter !== "all" || groupFilter !== "all" || debouncedSearch) && (
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          Сбросить фильтры
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#2d2d2d] last:border-b-0 hover:bg-[#1f2937] transition-colors">
                  <td className="px-4 py-3">
                    <div
                      onClick={() => toggleSelectUser(user.id)}
                      className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id)
                          ? "bg-blue-500 border-blue-500"
                          : "bg-transparent border-[#484f58] hover:border-[#6e7681]"
                      }`}
                    >
                      {selectedUsers.includes(user.id) && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full ${user.color} flex items-center justify-center text-sm font-medium text-white`}>
                        {user.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#ccd0d4]">{user.name}</p>
                        <p className="text-xs text-[#6e7681]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8b949e]">{user.group}</td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-3 text-sm text-[#8b949e]">{user.repos} репо</td>
                  <td className="px-4 py-3 text-sm text-[#8b949e]">{user.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewUser(user)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg hover:bg-[#30363d] text-[#6e7681] hover:text-[#ccd0d4] transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {hasPermission("user_edit") && (
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={actionLoading || user.role === "admin"}
                          title={user.role === "admin" ? "Недостаточно прав для изменения этого профиля" : ""}
                          className="p-1.5 rounded-lg hover:bg-[#30363d] text-[#6e7681] hover:text-[#ccd0d4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === "blocked" ? (
                        <button
                          onClick={() => handleBlockToggle(user)}
                          disabled={actionLoading || user.role === "admin"}
                          title={user.role === "admin" ? "Недостаточно прав для изменения этого профиля" : ""}
                          className="p-1.5 rounded-lg hover:bg-[#30363d] text-[#6e7681] hover:text-[#ccd0d4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockToggle(user)}
                          disabled={actionLoading || user.role === "admin"}
                          title={user.role === "admin" ? "Недостаточно прав для изменения этого профиля" : ""}
                          className="p-1.5 rounded-lg hover:bg-[#30363d] text-[#6e7681] hover:text-[#ccd0d4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === "pending" && (
                        <button
                          onClick={() => handleApprove(user)}
                          disabled={actionLoading || user.role === "admin"}
                          title={user.role === "admin" ? "Недостаточно прав для изменения этого профиля" : ""}
                          className="p-1.5 rounded-lg hover:bg-green-500/20 text-[#6e7681] hover:text-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${
            toast.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Pagination */}
        {(() => {
          const totalPages = Math.ceil(totalUsers / itemsPerPage) || 1;

          // Generate page numbers to show
          const getPageNumbers = () => {
            if (totalPages <= 5) {
              return Array.from({ length: totalPages }, (_, i) => i + 1);
            }
            // For many pages, show: 1, 2, 3, ..., last
            return [1, 2, 3, -1, totalPages]; // -1 represents ellipsis
          };

          const pageNumbers = getPageNumbers();

          return (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#6e7681]">
                  Показано {filteredUsers.length} из {totalUsers}
                  {roleFilter !== "all" || statusFilter !== "all" || groupFilter !== "all" ? " (отфильтровано)" : ""}
                </span>
                <div className="flex items-center gap-2" ref={perPageRef}>
                  <span className="text-sm text-[#6e7681]">На странице:</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowPerPageDropdown(!showPerPageDropdown)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#0d0d0d] border border-[#30363d] rounded-lg text-sm text-[#ccd0d4] hover:bg-[#161616] transition-colors"
                    >
                      {itemsPerPage}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPerPageDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {showPerPageDropdown && (
                      <div className="absolute top-full left-0 mt-1.5 w-20 bg-[#161616] border border-[#2d2d2d] rounded-xl shadow-xl z-50 overflow-hidden">
                        {[10, 25, 50].map((val) => (
                          <button
                            key={val}
                            onClick={() => {
                              setItemsPerPage(val);
                              setCurrentPage(1);
                              setShowPerPageDropdown(false);
                            }}
                            className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                              itemsPerPage === val
                                ? "bg-blue-500/20 text-blue-400"
                                : "text-[#8b949e] hover:bg-[#1f2937]"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-[#161616] border border-[#30363d] text-[#8b949e] hover:text-[#ccd0d4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {pageNumbers.map((page, idx) => (
                    page === -1 ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-[#6e7681]">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-[#161616] border border-[#30363d] text-[#8b949e] hover:text-[#ccd0d4]"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-[#161616] border border-[#30363d] text-[#8b949e] hover:text-[#ccd0d4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#161616] border border-[#2d2d2d] rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#ccd0d4]">Профиль пользователя</h3>
              <button onClick={() => setViewUser(null)} className="p-1 hover:bg-[#30363d] rounded text-[#6e7681]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-12 w-12 rounded-full ${viewUser.color} flex items-center justify-center text-sm font-medium text-white`}>
                  {viewUser.initials}
                </div>
                <div>
                  <p className="font-medium text-[#ccd0d4]">{viewUser.name}</p>
                  <p className="text-sm text-[#6e7681]">{viewUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#0d0d0d] p-3 rounded-lg">
                  <p className="text-[#6e7681]">Роль</p>
                  <p className="font-medium text-[#ccd0d4]">
                    {viewUser.role === "admin" ? "Администратор" :
                     viewUser.role === "teacher" ? "Преподаватель" :
                     viewUser.role === "laborant" ? "Лаборант" : "Студент"}
                  </p>
                </div>
                <div className="bg-[#0d0d0d] p-3 rounded-lg">
                  <p className="text-[#6e7681]">Группа</p>
                  <p className="font-medium text-[#ccd0d4]">{viewUser.group}</p>
                </div>
                <div className="bg-[#0d0d0d] p-3 rounded-lg">
                  <p className="text-[#6e7681]">Статус</p>
                  <p className="font-medium text-[#ccd0d4]">
                    {viewUser.status === "active" ? "Активен" :
                     viewUser.status === "blocked" ? "Заблокирован" : "Ожидает"}
                  </p>
                </div>
                <div className="bg-[#0d0d0d] p-3 rounded-lg">
                  <p className="text-[#6e7681]">Последний вход</p>
                  <p className="font-medium text-[#ccd0d4]">{viewUser.lastLogin}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#161616] border border-[#2d2d2d] rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#ccd0d4]">Редактирование пользователя</h3>
              <button onClick={() => setEditUser(null)} className="p-1 hover:bg-[#30363d] rounded text-[#6e7681]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#8b949e]">Роль</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-[#30363d] rounded-lg text-[#ccd0d4]"
                >
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="laborant">Лаборант</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#8b949e]">Группа</label>
                <select
                  value={editForm.group_name}
                  onChange={(e) => setEditForm({ ...editForm, group_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d0d0d] border border-[#30363d] rounded-lg text-[#ccd0d4]"
                >
                  <option value="">— Не выбрана —</option>
                  {availableGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 px-4 py-2 border border-[#30363d] rounded-lg hover:bg-[#1f2937] text-[#8b949e]"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

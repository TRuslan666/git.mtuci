import { useState } from "react";
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
} from "lucide-react";
import { useEffect } from "react";
import { getAdminUsers } from "../api/adminApi";

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  group: string;
  role: "student" | "teacher" | "admin";
  status: "active" | "pending" | "blocked";
  repos: number;
  lastLogin: string;
}

function getRoleBadge(role: User["role"]) {
  const styles = {
    student: "bg-blue-500/20 text-blue-400",
    teacher: "bg-purple-500/20 text-purple-400",
    admin: "bg-yellow-500/20 text-yellow-400",
  };
  const labels = {
    student: "Студент",
    teacher: "Препод",
    admin: "Админ",
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

export default function UsersPage() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);




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
          lastLogin: new Date(u.created_at).toLocaleDateString(),

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

  const totalPages = Math.ceil(totalUsers / perPage);

  return (
    <div className="h-full overflow-y-auto bg-[#f5f3fa] dark:bg-[#0f0f10] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Все пользователи</h1>
            <span className="text-sm text-gray-500">{totalUsers} записей</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-[#d4cfe6] dark:border-[#2d2d2d] text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors shadow-sm">
              <Download className="h-4 w-4" />
              Экспорт CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-[#d4cfe6] dark:border-[#2d2d2d] text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors shadow-sm">
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
            <div key={stat.label} className="bg-white dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#d4cfe6] dark:border-[#2d2d2d] shadow-sm">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color === "text-white" ? "text-gray-900 dark:text-white" : stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-4 border border-[#d4cfe6] dark:border-[#2d2d2d] flex items-center gap-3 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Пользователь..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#252525] border border-[#d4cfe6] dark:border-[#2d2d2d] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#252525] border border-[#d4cfe6] dark:border-[#2d2d2d] rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Users className="h-4 w-4" />
            Все роли
            <ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#252525] border border-[#d4cfe6] dark:border-[#2d2d2d] rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <CheckCircle className="h-4 w-4" />
            Все статусы
            <ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#252525] border border-[#d4cfe6] dark:border-[#2d2d2d] rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Briefcase className="h-4 w-4" />
            Все группы
            <ChevronDown className="h-3 w-3" />
          </button>
          {selectedUsers.length > 0 && (
            <button className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors ml-auto">
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
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-[#d4cfe6] dark:border-[#2d2d2d] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#d4cfe6] dark:border-[#2d2d2d]">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[#d4cfe6] dark:border-[#2d2d2d] bg-white dark:bg-[#252525] text-blue-600 focus:ring-0"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Группа</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Репо</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Последний вход</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#d4cfe6] dark:border-[#2d2d2d] last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="rounded border-[#d4cfe6] dark:border-[#2d2d2d] bg-white dark:bg-[#252525] text-blue-600 focus:ring-0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full ${user.color} flex items-center justify-center text-sm font-medium text-white`}>
                        {user.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.group}</td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.repos} репо</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.status === "blocked" ? (
                        <button className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                          <Unlock className="h-4 w-4" />
                        </button>
                      ) : (
                        <button className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                          <Lock className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === "pending" && (
                        <button className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Показано {users.length} из {totalUsers}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">На странице:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-3 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#d4cfe6] dark:border-[#2d2d2d] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-[#d4cfe6] dark:border-[#2d2d2d] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {[1, 2, 3].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-[#1e1e1e] border border-[#d4cfe6] dark:border-[#2d2d2d] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}

            <span className="px-2 text-gray-400">...</span>

            <button
              onClick={() => setCurrentPage(totalPages)}
              className="min-w-[36px] h-9 px-3 rounded-lg bg-white dark:bg-[#1e1e1e] border border-[#d4cfe6] dark:border-[#2d2d2d] text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
            >
              {totalPages}
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-[#d4cfe6] dark:border-[#2d2d2d] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Trash2,
  ChevronDown,
  Star,
  MoreHorizontal,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import { CustomCheckbox } from "../components/CustomCheckbox";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Repository {
  id: string;
  name: string;
  description: string | null;
  gitea_repo_name: string | null;
  clone_url: string | null;
  owner_id: string;
  owner_full_name: string | null;
  commits_count: number;
  is_public: boolean;
  repo_type: "public" | "private" | "course";
  language: string | null;
  is_blocked: boolean;
  faculty_id: string | null;
  created_at: string;
  updated_at: string;
}

interface OverviewStats {
  total_users: number;
  total_students: number;
  total_repositories: number;
  total_commits: number;
  repositories_by_type: {
    public: number;
    private: number;
    course: number;
  };
}

const languageColors: Record<string, string> = {
  Python: "#3b82f6",
  JavaScript: "#eab308",
  TypeScript: "#3178c6",
  Java: "#f97316",
  "C++": "#ec4899",
  C: "#6b7280",
  "C#": "#9333ea",
  Go: "#06b6d4",
  Rust: "#f97316",
  Ruby: "#ef4444",
  PHP: "#8b5cf6",
  Swift: "#f97316",
  Kotlin: "#7c3aed",
  HTML: "#f97316",
  CSS: "#3b82f6",
  SQL: "#6b7280",
};

function getTypeBadge(type: Repository["repo_type"]) {
  const styles = {
    public: "bg-emerald-500/15 text-emerald-400",
    private: "bg-gray-500/15 text-gray-400",
    course: "bg-blue-500/15 text-blue-400",
  };
  const labels = {
    public: "Публичный",
    private: "Приватный",
    course: "Курсовой",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

function getInitials(fullName: string | null): string {
  if (!fullName) return "??";
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return fullName.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Только что";
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} часа назад`;
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дня назад`;
  return date.toLocaleDateString("ru-RU");
}

function Dropdown({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] rounded-lg text-sm text-gray-300 transition-colors"
      >
        {options.find((o: {value: string, label: string}) => o.value === value)?.label || label}
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg shadow-lg z-50 min-w-[140px]">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[#2d2d2d] transition-colors ${
                  value === option.value ? "text-blue-400" : "text-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function RepositoriesPage() {
  // Data states
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [blockedFilter, setBlockedFilter] = useState<string>("");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Selection states
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch repositories when filters change
  useEffect(() => {
    fetchRepositories();
  }, [typeFilter, languageFilter, blockedFilter, limit, offset]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats/overview`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("skip", offset.toString());
      params.append("limit", limit.toString());
      if (typeFilter) params.append("repo_type", typeFilter);
      if (languageFilter) params.append("language", languageFilter);
      if (blockedFilter) params.append("is_blocked", blockedFilter);

      const response = await fetch(`${API_URL}/admin/repositories?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRepositories(data);
      // Estimate total from stats for now
      setTotalCount(stats?.total_repositories || data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (repoId: string) => {
    setTogglingId(repoId);
    try {
      const response = await fetch(`${API_URL}/admin/repositories/${repoId}/toggle-block`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle block status");
      }

      const updatedRepo = await response.json();

      // Update locally without refetching
      setRepositories((prev) =>
        prev.map((repo) =>
          repo.id === repoId ? { ...repo, is_blocked: updatedRepo.is_blocked } : repo
        )
      );
    } catch (err) {
      console.error("Toggle block error:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRepos(new Set());
    } else {
      setSelectedRepos(new Set(repositories.map((r) => r.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleRepo = (id: string) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRepos(newSelected);
    setSelectAll(newSelected.size === repositories.length);
  };

  const getStatsData = () => {
    if (!stats) return [];
    const blockedCount = repositories.filter((r) => r.is_blocked).length; // Approximate
    return [
      { label: "Всего репо", value: stats.total_repositories, color: "text-white" },
      { label: "Публичных", value: stats.repositories_by_type.public, color: "text-emerald-400" },
      { label: "Приватных", value: stats.repositories_by_type.private, color: "text-gray-400" },
      { label: "Курсовых", value: stats.repositories_by_type.course, color: "text-blue-400" },
      { label: "Заблокированных", value: blockedCount, color: "text-red-400" },
    ];
  };

  const typeOptions = [
    { value: "", label: "Все типы" },
    { value: "public", label: "Публичный" },
    { value: "private", label: "Приватный" },
    { value: "course", label: "Курсовой" },
  ];

  const blockedOptions = [
    { value: "", label: "Все статусы" },
    { value: "false", label: "Активные" },
    { value: "true", label: "Заблокированные" },
  ];

  const limitOptions = [
    { value: "10", label: "10" },
    { value: "20", label: "20" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#111111] text-white">
        <div className="text-center">
          <p className="text-red-400 mb-2">Ошибка загрузки</p>
          <p className="text-[#8b949e]">{error}</p>
          <button
            onClick={fetchRepositories}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-sm"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#111111] text-white">
      <div className="max-w-[1400px] mx-auto py-6 px-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Все репозитории</h1>
            <span className="text-sm text-gray-500">{totalCount} репозиториев</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#161616] hover:bg-[#1f2937] border border-[#30363d] rounded-lg text-sm text-[#8b949e] transition-colors">
              <Download className="h-4 w-4" />
              Экспорт CSV
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-all">
              <Plus className="h-4 w-4" />
              Создать репо
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {getStatsData().map((stat) => (
            <div key={stat.label} className="bg-[#161616] border border-[#2d2d2d] rounded-xl p-4">
              <p className="text-xs text-[#8b949e] mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e7681]" />
              <input
                type="text"
                placeholder="Поиск по наз..."
                className="w-64 pl-10 pr-4 py-1.5 bg-[#0d0d0d] border border-[#30363d] rounded-lg text-sm text-[#ccd0d4] placeholder-[#6e7681] focus:outline-none focus:border-[#484f58] transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Dropdown
                label="Все типы"
                value={typeFilter}
                options={typeOptions}
                onChange={setTypeFilter}
              />
              <Dropdown
                label="Все статусы"
                value={blockedFilter}
                options={blockedOptions}
                onChange={setBlockedFilter}
              />
            </div>
          </div>
          {selectedRepos.size > 0 && (
            <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors">
              <Trash2 className="h-4 w-4" />
              Удалить выбранные
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-[#161616] border border-[#2d2d2d] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d2d]">
                <th className="w-10 py-3 px-4">
                  <CustomCheckbox checked={selectAll} onChange={toggleSelectAll} />
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[#6e7681] uppercase tracking-wider">
                  Репозиторий
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[#6e7681] uppercase tracking-wider">
                  Тип
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[#6e7681] uppercase tracking-wider">
                  Язык
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[#6e7681] uppercase tracking-wider">
                  Владелец
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[#6e7681] uppercase tracking-wider">
                  Коммиты
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[#6e7681] uppercase tracking-wider">
                  Статус
                </th>
                <th className="w-10 py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#6e7681]" />
                  </td>
                </tr>
              ) : repositories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6e7681]">
                    Репозитории не найдены
                  </td>
                </tr>
              ) : (
                repositories.map((repo) => (
                  <tr
                    key={repo.id}
                    className={`hover:bg-[#1f2937] transition-colors ${repo.is_blocked ? "opacity-60" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <CustomCheckbox
                        checked={selectedRepos.has(repo.id)}
                        onChange={() => toggleRepo(repo.id)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#30363d] flex items-center justify-center text-xs font-medium text-[#ccd0d4]">
                          {getInitials(repo.owner_full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-[#ccd0d4] text-sm">
                            {repo.name}
                            {repo.is_blocked && (
                              <span className="ml-2 text-red-400 text-xs">(заблокирован)</span>
                            )}
                          </p>
                          <p className="text-xs text-[#6e7681]">{repo.gitea_repo_name || repo.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(repo.repo_type)}</td>
                    <td className="py-3 px-4">
                      {repo.language ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: languageColors[repo.language] || "#6b7280" }}
                          />
                          <span className="text-sm text-[#8b949e]">{repo.language}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#6e7681]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#8b949e]">
                      {repo.owner_full_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-[#ccd0d4]">
                      {repo.commits_count}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleBlock(repo.id)}
                        disabled={togglingId === repo.id}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          repo.is_blocked
                            ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                            : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                        }`}
                      >
                        {togglingId === repo.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : repo.is_blocked ? (
                          <>
                            <Lock className="h-3 w-3" />
                            Заблокирован
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3" />
                            Активен
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button className="p-1 hover:bg-[#30363d] rounded transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-[#6e7681]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#6e7681]">
            Показано {repositories.length} из {totalCount}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <button
                onClick={() => setOffset((p) => Math.max(0, p - limit))}
                className="px-3 py-1.5 bg-[#161616] hover:bg-[#1f2937] border border-[#30363d] text-[#8b949e] text-sm font-medium rounded-lg transition-colors"
              >
                ←
              </button>
            )}
            <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg">
              {currentPage}
            </span>
            {currentPage < totalPages && (
              <button
                onClick={() => setOffset((p) => p + limit)}
                className="px-3 py-1.5 bg-[#161616] hover:bg-[#1f2937] border border-[#30363d] text-[#8b949e] text-sm font-medium rounded-lg transition-colors"
              >
                →
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6e7681]">По</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
              className="bg-[#0d0d0d] border border-[#30363d] rounded-lg text-sm text-[#8b949e] py-1 px-2 focus:outline-none focus:border-[#484f58]"
            >
              {limitOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-[#6e7681]">на странице</span>
          </div>
        </div>
      </div>
    </div>
  );
}

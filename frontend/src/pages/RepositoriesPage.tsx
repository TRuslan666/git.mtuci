import { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Trash2,
  ChevronDown,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { CustomCheckbox } from "../components/CustomCheckbox";

interface Repository {
  id: string;
  name: string;
  path: string;
  type: "public" | "private" | "course";
  language: string;
  languageColor: string;
  owner: string;
  ownerInitials: string;
  commits: number;
  prCount: number;
  prUrgency: "high" | "medium" | "low";
  stars: number;
  updatedAt: string;
}

const repositories: Repository[] = [
  {
    id: "1",
    name: "lab-db-petrov",
    path: "ist21/lab-db-petrov",
    type: "public",
    language: "Python",
    languageColor: "#3b82f6",
    owner: "Петров И.А.",
    ownerInitials: "ИС",
    commits: 142,
    prCount: 3,
    prUrgency: "high",
    stars: 12,
    updatedAt: "3 мин назад",
  },
  {
    id: "2",
    name: "course-work-ai",
    path: "ivt22/course-work-ai",
    type: "course",
    language: "Python",
    languageColor: "#3b82f6",
    owner: "Николаев С.В.",
    ownerInitials: "НС",
    commits: 89,
    prCount: 1,
    prUrgency: "medium",
    stars: 8,
    updatedAt: "2 часа назад",
  },
  {
    id: "3",
    name: "algorithms-java",
    path: "ist20/algorithms-java",
    type: "private",
    language: "Java",
    languageColor: "#f97316",
    owner: "Кузнецов А.М.",
    ownerInitials: "КУ",
    commits: 234,
    prCount: 0,
    prUrgency: "low",
    stars: 5,
    updatedAt: "Вчера",
  },
  {
    id: "4",
    name: "cpp-labs",
    path: "ivt21/cpp-labs",
    type: "public",
    language: "C++",
    languageColor: "#ec4899",
    owner: "Сидоров В.К.",
    ownerInitials: "СВ",
    commits: 67,
    prCount: 2,
    prUrgency: "low",
    stars: 3,
    updatedAt: "2 дня назад",
  },
  {
    id: "5",
    name: "web-project",
    path: "ist22/web-project",
    type: "public",
    language: "JavaScript",
    languageColor: "#eab308",
    owner: "Михайлова Е.Н.",
    ownerInitials: "МЕ",
    commits: 156,
    prCount: 5,
    prUrgency: "high",
    stars: 21,
    updatedAt: "5 мин назад",
  },
  {
    id: "6",
    name: "data-science-ml",
    path: "ivt23/data-science-ml",
    type: "course",
    language: "Python",
    languageColor: "#3b82f6",
    owner: "Васильев Д.О.",
    ownerInitials: "ВД",
    commits: 78,
    prCount: 0,
    prUrgency: "low",
    stars: 15,
    updatedAt: "3 дня назад",
  },
];

const stats = [
  { label: "Всего репо", value: 342, color: "text-white" },
  { label: "Публичных", value: 198, color: "text-emerald-400" },
  { label: "Приватных", value: 112, color: "text-gray-400" },
  { label: "Курсовых", value: 27, color: "text-blue-400" },
  { label: "Заблокированных", value: 5, color: "text-red-400" },
];

function getTypeBadge(type: Repository["type"]) {
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

function getPrBadge(count: number, urgency: Repository["prUrgency"]) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400">
        0 PR
      </span>
    );
  }
  const styles = {
    high: "bg-red-500/15 text-red-400",
    medium: "bg-amber-500/15 text-amber-400",
    low: "bg-gray-500/15 text-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[urgency]}`}
    >
      {count} PR
    </span>
  );
}

function Dropdown({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] rounded-lg text-sm text-gray-300 transition-colors">
      {label}
      <ChevronDown className="h-4 w-4 text-gray-500" />
    </button>
  );
}

export default function RepositoriesPage() {
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

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

  return (
    <div className="h-full overflow-y-auto bg-[#0f0f10] text-white">
      <div className="max-w-[1400px] mx-auto py-6 px-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Все репозитории</h1>
            <span className="text-sm text-gray-500">342 репозитория</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-[#2d2d2d] rounded-lg text-sm text-gray-300 transition-colors">
              <Download className="h-4 w-4" />
              Экспорт CSV
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-lg text-sm font-medium text-white transition-all">
              <Plus className="h-4 w-4" />
              Создать репо
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1e1e1e] rounded-xl p-4"
            >
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Поиск по наз..."
                className="w-64 pl-10 pr-4 py-1.5 bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Dropdown label="Все типы" />
              <Dropdown label="Все языки" />
              <Dropdown label="Все кафедры" />
              <Dropdown label="Сортировка" />
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
        <div className="bg-[#1e1e1e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d2d]">
                <th className="w-10 py-3 px-4">
                  <CustomCheckbox checked={selectAll} onChange={toggleSelectAll} />
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Репозиторий
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Язык
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Владелец
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Коммиты
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PR
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Звёзды
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Обновлён
                </th>
                <th className="w-10 py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {repositories.map((repo) => (
                <tr
                  key={repo.id}
                  className="hover:bg-[#252525] transition-colors"
                >
                  <td className="py-3 px-4">
                    <CustomCheckbox
                      checked={selectedRepos.has(repo.id)}
                      onChange={() => toggleRepo(repo.id)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs font-medium text-white">
                        {repo.ownerInitials}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          {repo.name}
                        </p>
                        <p className="text-xs text-gray-500">{repo.path}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{getTypeBadge(repo.type)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: repo.languageColor }}
                      />
                      <span className="text-sm text-gray-300">
                        {repo.language}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {repo.owner}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-white">
                    {repo.commits}
                  </td>
                  <td className="py-3 px-4">
                    {getPrBadge(repo.prCount, repo.prUrgency)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                      <Star className="h-3.5 w-3.5 text-gray-500" />
                      {repo.stars}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {repo.updatedAt}
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-1 hover:bg-[#2d2d2d] rounded transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Показано 6 из 342</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg">
              1
            </button>
            <button className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] text-gray-400 text-sm font-medium rounded-lg transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] text-gray-400 text-sm font-medium rounded-lg transition-colors">
              3
            </button>
            <span className="text-gray-500 px-1">...</span>
            <button className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2d2d2d] text-gray-400 text-sm font-medium rounded-lg transition-colors">
              35
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">По</span>
            <select className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg text-sm text-gray-300 py-1 px-2 focus:outline-none">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-sm text-gray-500">на странице</span>
          </div>
        </div>
      </div>
    </div>
  );
}

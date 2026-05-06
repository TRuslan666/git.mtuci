import { GitFork, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

type ForkItem = {
  id: string;
  original_repo: string;
  original_path: string;
  owner_name: string;
  owner_path: string;
  type: "fork" | "clone";
  language: string;
  commits: number;
  plus_changes: number;
  minus_changes: number;
  status: "active" | "inactive";
  fork_date: string;
};

type ForksResponse = {
  stats: {
    total_forks: number;
    active_forks: number;
    clones_today: number;
    unique_students: number;
  };
  items: ForkItem[];
};

export default function ForksPage() {
  const [data, setData] = useState<ForksResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ForksResponse>("/stats/forks-clones")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="h-full overflow-y-auto bg-[#f5f3fa] dark:bg-[#0f0f10] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Форки и клоны</h1>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-[#d4cfe6] dark:border-[#2d2d2d] p-12 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-4">
              <GitFork className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 pb-20 space-y-4">
        <h1 className="text-2xl font-bold">Форки и клоны</h1>
        {loading && <div className="text-sm text-gray-500">Загрузка...</div>}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                ["Всего форков", data.stats.total_forks],
                ["Активных форков", data.stats.active_forks],
                ["Клонирований сегодня", data.stats.clones_today],
                ["Уникальных студентов", data.stats.unique_students],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-[#d4cfe6] dark:border-[#30363d] bg-white dark:bg-[#1e1e1e] p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                  <div className="mt-1 text-2xl font-semibold">{value}</div>
                </div>
              ))}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Страница в разработке
            </h2>
            <p className="text-gray-500 max-w-md mb-6">
              Раздел "Форки и клоны" находится в активной разработке. 
              Здесь будет отображаться информация о форках репозиториев студентов.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Ожидаемый запуск: скоро</span>

            <div className="rounded-xl border border-[#d4cfe6] dark:border-[#30363d] bg-white dark:bg-[#1e1e1e] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#111111] text-gray-500 dark:text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Оригинальный репо</th>
                    <th className="text-left p-3">Форк / Владелец</th>
                    <th className="text-left p-3">Тип</th>
                    <th className="text-left p-3">Язык</th>
                    <th className="text-left p-3">Коммиты</th>
                    <th className="text-left p-3">Изменения</th>
                    <th className="text-left p-3">Статус</th>
                    <th className="text-left p-3">Дата форка</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-[#e5e7eb] dark:border-[#30363d]">
                      <td className="p-3"><div className="font-medium">{item.original_repo}</div><div className="text-xs text-gray-500">{item.original_path}</div></td>
                      <td className="p-3"><div className="font-medium">{item.owner_name}</div><div className="text-xs text-gray-500">{item.owner_path}</div></td>
                      <td className="p-3">{item.type === "fork" ? "Форк" : "Клон"}</td>
                      <td className="p-3">{item.language}</td>
                      <td className="p-3">{item.commits}</td>
                      <td className="p-3">+{item.plus_changes} / -{item.minus_changes}</td>
                      <td className="p-3">{item.status === "active" ? "Активен" : "Неактивен"}</td>
                      <td className="p-3">{item.fork_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
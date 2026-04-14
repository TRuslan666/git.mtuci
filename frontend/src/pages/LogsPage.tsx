import { FileCode, Clock } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="h-full overflow-y-auto bg-[#f5f3fa] dark:bg-[#0f0f10] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Логи</h1>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-[#d4cfe6] dark:border-[#2d2d2d] p-12 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-4">
              <FileCode className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Страница в разработке
            </h2>
            <p className="text-gray-500 max-w-md mb-6">
              Раздел "Логи" находится в активной разработке.
              Здесь будет отображаться журнал системных событий и действий пользователей.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Ожидаемый запуск: скоро</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

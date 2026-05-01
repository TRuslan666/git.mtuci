import { FileCode, Clock } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";

interface LogsPageProps {
  isDarkTheme?: boolean;
}

export default function LogsPage({ isDarkTheme = false }: LogsPageProps) {
  // Theme-based colors
  const pageBg = isDarkTheme ? "bg-[#111111] text-white" : "bg-slate-50 text-slate-900";
  const titleText = isDarkTheme ? "text-[#ccd0d4]" : "text-slate-900";
  const cardBg = isDarkTheme ? "bg-[#161616] border-[#2d2d2d]" : "bg-white border-slate-200";
  const iconBg = isDarkTheme ? "bg-[#1f2937]" : "bg-gray-100";
  const iconColor = isDarkTheme ? "text-[#6e7681]" : "text-gray-500";
  const headingText = isDarkTheme ? "text-[#ccd0d4]" : "text-slate-900";
  const bodyText = isDarkTheme ? "text-[#8b949e]" : "text-slate-600";
  const mutedText = isDarkTheme ? "text-[#6e7681]" : "text-slate-500";

  return (
    <div className={`h-full overflow-y-auto ${pageBg} transition-colors`}>
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 pb-20">
        {/* Header */}
        <AdminPageHeader isDarkTheme={isDarkTheme} title="Логи" />

        <div className={`rounded-xl border p-12 ${cardBg} transition-colors`}>
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconBg} transition-colors`}>
              <FileCode className={`h-8 w-8 ${iconColor} transition-colors`} />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${headingText} transition-colors`}>
              Страница в разработке
            </h2>
            <p className={`max-w-md mb-6 ${bodyText} transition-colors`}>
              Раздел "Логи" находится в активной разработке.
              Здесь будет отображаться журнал системных событий и действий пользователей.
            </p>
            <div className={`flex items-center gap-2 text-sm ${mutedText} transition-colors`}>
              <Clock className="h-4 w-4" />
              <span>Ожидаемый запуск: скоро</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

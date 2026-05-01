import { Clock, AlertCircle } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";

interface MonitoringPageProps {
  isDarkTheme?: boolean;
}

export default function MonitoringPage({ isDarkTheme = false }: MonitoringPageProps) {
  // Theme-based colors
  const pageBgStyle = isDarkTheme ? { backgroundColor: "#111111", color: "white" } : { backgroundColor: "#f8fafc", color: "#0f172a" };
  const titleText = isDarkTheme ? "text-[#ccd0d4]" : "text-slate-900";
  const betaBadge = isDarkTheme ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-700";
  const cardBg = isDarkTheme ? "bg-[#161616] border-[#2d2d2d]" : "bg-white border-slate-200";
  const iconBg = isDarkTheme ? "bg-[#1f2937]" : "bg-gray-100";
  const iconColor = isDarkTheme ? "text-[#6e7681]" : "text-gray-500";
  const headingText = isDarkTheme ? "text-[#ccd0d4]" : "text-slate-900";
  const bodyText = isDarkTheme ? "text-[#8b949e]" : "text-slate-600";
  const mutedText = isDarkTheme ? "text-[#6e7681]" : "text-slate-500";

  return (
    <div className="h-full overflow-y-auto transition-colors">
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 pb-20">
        <div className="flex items-center justify-between mb-6">
          <AdminPageHeader
            isDarkTheme={isDarkTheme}
            title="Мониторинг"
            actions={
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${betaBadge} transition-colors`}>
                <AlertCircle className="h-3 w-3 mr-1" />
                Beta
              </span>
            }
          />
        </div>

        <div className={`rounded-xl border p-12 ${cardBg} transition-colors`}>
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconBg} transition-colors`}>
              <Clock className={`h-8 w-8 ${iconColor} transition-colors`} />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${headingText} transition-colors`}>
              Страница в разработке
            </h2>
            <p className={`max-w-md mb-6 ${bodyText} transition-colors`}>
              Раздел "Мониторинг" находится в активной разработке.
              Здесь будет отображаться состояние системы и метрики производительности.
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

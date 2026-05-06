import { Settings, Clock } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";

interface AdminSettingsPageProps {
  isDarkTheme?: boolean;
}

export default function AdminSettingsPage({ isDarkTheme = false }: AdminSettingsPageProps) {
  // Theme-based colors
  const pageBgStyle = isDarkTheme ? { backgroundColor: "#111111" } : { backgroundColor: "#f9fafb" };
  const pageText = isDarkTheme ? "text-white" : "text-gray-900";
  const titleColor = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-800";
  const cardBg = isDarkTheme ? "bg-[#161616]" : "bg-white";
  const cardBorder = isDarkTheme ? "border-[#2d2d2d]" : "border-gray-200";
  const iconBg = isDarkTheme ? "bg-[#1f2937]" : "bg-gray-100";
  const iconColor = isDarkTheme ? "text-[#6e7681]" : "text-gray-400";
  const subtitleColor = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-700";
  const descriptionColor = isDarkTheme ? "text-[#8b949e]" : "text-gray-600";
  const footerColor = isDarkTheme ? "text-[#6e7681]" : "text-gray-500";
  return (
    <div className={`h-full overflow-y-auto ${pageText}`}>
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 pb-20">
        <AdminPageHeader isDarkTheme={isDarkTheme} title="Настройки" />

        <div className={`${cardBg} rounded-xl border ${cardBorder} p-12`}>
          <div className="flex flex-col items-center justify-center text-center">
            <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
              <Settings className={`h-8 w-8 ${iconColor}`} />
            </div>
            <h2 className={`text-xl font-semibold ${subtitleColor} mb-2`}>
              Страница в разработке
            </h2>
            <p className={`${descriptionColor} max-w-md mb-6`}>
              Раздел "Настройки" находится в активной разработке.
              Здесь будет отображаться панель управления системными настройками.
            </p>
            <div className={`flex items-center gap-2 text-sm ${footerColor}`}>
              <Clock className="h-4 w-4" />
              <span>Ожидаемый запуск: скоро</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

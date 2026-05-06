interface DashboardPageProps {
  isDarkTheme?: boolean;
}

export default function DashboardPage({ isDarkTheme = false }: DashboardPageProps) {
  console.log("DashboardPage isDarkTheme:", isDarkTheme, "type:", typeof isDarkTheme);
  const isDark = Boolean(isDarkTheme);
  const pageBgStyle = isDark ? { backgroundColor: "#0f0f10" } : { backgroundColor: "#f8fafc" };
  const titleText = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-900";
  const bodyText = isDarkTheme ? "text-[#8b949e]" : "text-gray-600";

  return (
    <div className="mx-auto max-w-5xl transition-colors">
      <h1 className={`mb-6 text-2xl font-semibold ${titleText} transition-colors`}>Дашборд</h1>
      <p className={`${bodyText} transition-colors`}>Страница в разработке...</p>
    </div>
  );
}

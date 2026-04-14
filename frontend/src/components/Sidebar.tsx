import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Briefcase,
  FileText,
  GitFork,
  TrendingUp,
  FileCode,
  Clock,
  Settings,
  AlertCircle,
} from "lucide-react";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: {
    text: string;
    variant: "red" | "orange";
  };
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "ОБЗОР",
    items: [
      { path: "/admin", label: "Дашборд", icon: LayoutGrid },
    ],
  },
  {
    title: "ПОЛЬЗОВАТЕЛИ",
    items: [
      { path: "/users", label: "Все пользователи", icon: Users, badge: { text: "12", variant: "red" } },
      { path: "/roles", label: "Роли и доступ", icon: Briefcase },
    ],
  },
  {
    title: "РЕПОЗИТОРИИ",
    items: [
      { path: "/repositories", label: "Все репозитории", icon: FileText },
      { path: "/admin/forks", label: "Форки и клоны", icon: GitFork },
      { path: "/admin/activity", label: "Активность", icon: TrendingUp },
    ],
  },
  {
    title: "СИСТЕМА",
    items: [
      { path: "/logs", label: "Логи", icon: FileCode },
      { path: "/admin/monitoring", label: "Мониторинг", icon: Clock, badge: { text: "!", variant: "orange" } },
      { path: "/admin/settings", label: "Настройки", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className="w-[260px] flex-shrink-0 min-h-screen border-r border-gray-200 bg-[#f9fafb] transition-colors dark:bg-[#1c1c1e] dark:border-[#2d2d2d]">
      <nav className="p-4">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-3 text-[#9ca3af] transition-colors dark:text-gray-500">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#eff6ff] text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                          : "text-[#374151] hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[#2d2d2d] dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${
                          active 
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold ${
                            item.badge.variant === "red"
                              ? "bg-red-500 text-white dark:bg-red-500/80"
                              : "bg-orange-500 text-white dark:bg-orange-500/80"
                          }`}
                        >
                          {item.badge.text}
                        </span>
                      )}
                      {item.label === "Мониторинг" && !item.badge && (
                        <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

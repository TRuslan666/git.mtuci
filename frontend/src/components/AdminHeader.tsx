import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Command, ChevronDown, LogOut, User, Shield, Activity, Moon, Sun } from "lucide-react";
import { clearToken } from "../api/client";
import { getMe, invalidateMeCache } from "../api/authApi";
import type { UserRole } from "../api/types";

// Status indicator component
function StatusIndicator({ status, label, isDarkTheme = true }: { status: "online" | "offline" | "warning"; label: string; isDarkTheme?: boolean }) {
  const colors = {
    online: "bg-emerald-500",
    offline: "bg-red-500",
    warning: "bg-amber-500",
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer group ${isDarkTheme ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
        {status === "offline" && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${colors[status]} animate-ping`} />
        )}
      </div>
      <span className={`text-xs transition-colors ${isDarkTheme ? "text-[#9ca3af] group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"}`}>{label}</span>
    </div>
  );
}

interface AdminHeaderProps {
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

export default function AdminHeader({ isDarkTheme = true, onToggleTheme }: AdminHeaderProps) {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState("Admin");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDisplayMode, setAvatarDisplayMode] = useState<string>("cover");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNotifications, setHasNotifications] = useState(true);

  // System status (mock for now)
  const [systemStatus, setSystemStatus] = useState<{
    api: "online" | "offline";
    database: "online" | "offline";
  }>({ api: "online", database: "online" });

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const me = await getMe();
        if (!cancelled) {
          setUserName(me.full_name || me.email || "Admin");
          setUserRole(me.role);
          setAvatarUrl(me.avatar_url ? `${me.avatar_url}?t=${Date.now()}` : null);
          setAvatarDisplayMode(me.avatar_display_mode || "cover");
        }
      } catch {
        if (!cancelled) {
          setUserName("Admin");
          setUserRole(null);
          setAvatarUrl(null);
        }
      }
    }
    loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-profile-menu]")) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function onLogout() {
    clearToken();
    invalidateMeCache();
    navigate("/login", { replace: true });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Implement global search
    console.log("Searching for:", searchQuery);
  }

  // Theme-based colors
  const headerBg = isDarkTheme ? "bg-[#111111]" : "bg-white";
  const headerBorder = isDarkTheme ? "border-[#30363d]" : "border-gray-200";
  const logoText = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-900";
  const dividerColor = isDarkTheme ? "bg-[#30363d]" : "bg-gray-300";
  const subText = isDarkTheme ? "text-[#8b949e]" : "text-gray-500";
  const searchBg = isDarkTheme ? "bg-[#0d0d0d]" : "bg-gray-100";
  const searchBorder = isDarkTheme ? "border-[#30363d]" : "border-gray-300";
  const searchText = isDarkTheme ? "text-gray-300" : "text-gray-900";
  const searchPlaceholder = isDarkTheme ? "placeholder-[#8b949e]" : "placeholder-gray-500";
  const shortcutBg = isDarkTheme ? "bg-[#30363d]/50" : "bg-gray-200";
  const iconColor = isDarkTheme ? "text-[#8b949e] hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-black/5";
  const avatarRing = isDarkTheme ? "ring-[#30363d]" : "ring-gray-300";
  const avatarBg = isDarkTheme ? "bg-[#30363d] text-[#ccd0d4] ring-[#484f58]" : "bg-gray-200 text-gray-700 ring-gray-300";

  return (
    <header className={`${headerBg} border-b ${headerBorder} transition-colors`}>
      <div className="mx-auto max-w-[1400px] px-4">
        {/* Main header row */}
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className={`flex items-center justify-center w-8 h-8 font-bold text-lg transition-colors ${logoText}`}>
              M
            </div>
            <div className={`w-px h-5 transition-colors ${dividerColor}`} />
            <div className="flex flex-col">
              <span className={`text-sm font-semibold leading-tight transition-colors ${logoText}`}>GIT</span>
              <span className={`text-[10px] leading-tight tracking-wider transition-colors ${subText}`}>ADMIN PANEL</span>
            </div>
          </Link>

          {/* Center: Search - wider */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDarkTheme ? "text-gray-500 group-focus-within:text-gray-400" : "text-gray-400 group-focus-within:text-gray-600"}`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по системе..."
                className={`w-full h-9 pl-10 pr-12 rounded-lg text-sm outline-none transition-all duration-200 ${searchBg} ${searchBorder} ${searchText} ${searchPlaceholder} border focus:ring-2 focus:ring-blue-500/50 ${isDarkTheme ? "focus:bg-[#161616]" : "focus:bg-white"}`}
              />
              <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${shortcutBg} ${isDarkTheme ? "text-[#8b949e]" : "text-gray-500"}`}>
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </form>
          </div>

          {/* Right: Actions + Profile */}
          <div className="flex items-center gap-2">
            {/* System Status */}
            <div className="hidden xl:flex items-center mr-2">
              <StatusIndicator status={systemStatus.api} label="API" isDarkTheme={isDarkTheme} />
              <StatusIndicator status={systemStatus.database} label="БД" isDarkTheme={isDarkTheme} />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors mr-1 ${iconColor}`}
              title={isDarkTheme ? "Переключить на светлую тему" : "Переключить на темную тему"}
            >
              {isDarkTheme ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={() => setHasNotifications(false)}
              className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors mr-1 ${iconColor}`}
            >
              <Bell className="h-5 w-5" />
              {hasNotifications && (
                <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${isDarkTheme ? "border-[#111111]" : "border-white"}`}>
                  <span className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="relative ml-2" data-profile-menu>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-colors ${isDarkTheme ? "hover:bg-white/5" : "hover:bg-black/5"}`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className={`h-7 w-7 rounded-full object-${avatarDisplayMode} ring-2 transition-colors ${avatarRing}`}
                  />
                ) : (
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2 transition-colors ${avatarBg}`}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:flex flex-col items-start">
                  <span className={`text-sm font-medium leading-tight transition-colors ${logoText}`}>{userName}</span>
                  <span className={`text-[10px] leading-tight transition-colors ${subText}`}>Администратор</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${profileMenuOpen ? "rotate-180" : ""} ${isDarkTheme ? "text-[#8b949e]" : "text-gray-500"}`} />
              </button>

              {/* Profile dropdown */}
              {profileMenuOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-50 py-1 border ${isDarkTheme ? "bg-[#161616] border-[#30363d]" : "bg-white border-gray-200"}`}>
                  <div className={`px-3 py-2 border-b ${isDarkTheme ? "border-[#30363d]" : "border-gray-200"}`}>
                    <p className={`text-sm font-medium truncate transition-colors ${logoText}`}>{userName}</p>
                    <p className={`text-xs truncate transition-colors ${subText}`}>{userRole || "admin"}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${isDarkTheme ? "text-[#8b949e] hover:bg-white/5 hover:text-[#ccd0d4]" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    <User className="h-4 w-4" />
                    Профиль
                  </Link>

                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${isDarkTheme ? "text-[#8b949e] hover:bg-white/5 hover:text-[#ccd0d4]" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    <Shield className="h-4 w-4" />
                    Настройки безопасности
                  </Link>

                  <Link
                    to="/admin/monitoring"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${isDarkTheme ? "text-[#8b949e] hover:bg-white/5 hover:text-[#ccd0d4]" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    <Activity className="h-4 w-4" />
                    Мониторинг
                  </Link>

                  <div className={`border-t my-1 ${isDarkTheme ? "border-[#30363d]" : "border-gray-200"}`} />

                  <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${isDarkTheme ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" : "text-red-600 hover:bg-red-50 hover:text-red-700"}`}
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

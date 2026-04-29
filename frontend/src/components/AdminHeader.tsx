import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Command, ChevronDown, LogOut, User, Shield, Activity, Moon, Sun } from "lucide-react";
import { clearToken } from "../api/client";
import { getMe, invalidateMeCache } from "../api/authApi";
import type { UserRole } from "../api/types";

// Status indicator component
function StatusIndicator({ status, label }: { status: "online" | "offline" | "warning"; label: string }) {
  const colors = {
    online: "bg-emerald-500",
    offline: "bg-red-500",
    warning: "bg-amber-500",
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer group">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
        {status === "offline" && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${colors[status]} animate-ping`} />
        )}
      </div>
      <span className="text-xs text-[#9ca3af] group-hover:text-gray-300">{label}</span>
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

  return (
    <header className="bg-[#111111] border-b border-[#30363d]">
      <div className="mx-auto max-w-[1400px] px-4">
        {/* Main header row */}
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-8 h-8 text-[#ccd0d4] font-bold text-lg">
              M
            </div>
            <div className="w-px h-5 bg-[#30363d]" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#ccd0d4] leading-tight">GIT</span>
              <span className="text-[10px] text-[#8b949e] leading-tight tracking-wider">ADMIN PANEL</span>
            </div>
          </Link>

          {/* Center: Search - wider */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-gray-400 transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по системе..."
                className="w-full h-9 pl-10 pr-12 rounded-lg bg-[#0d0d0d] border border-[#30363d] text-sm text-gray-300 placeholder-[#8b949e] outline-none transition-all duration-200 focus:bg-[#161616] focus:border-[#484f58]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#30363d]/50 text-[10px] text-[#8b949e] font-medium">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </form>
          </div>

          {/* Right: Actions + Profile */}
          <div className="flex items-center gap-2">
            {/* System Status */}
            <div className="hidden xl:flex items-center mr-2">
              <StatusIndicator status={systemStatus.api} label="API" />
              <StatusIndicator status={systemStatus.database} label="БД" />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-[#8b949e] hover:text-white hover:bg-white/5 transition-colors mr-1"
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
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-[#8b949e] hover:text-white hover:bg-white/5 transition-colors mr-1"
            >
              <Bell className="h-5 w-5" />
              {hasNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111111]">
                  <span className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="relative ml-2" data-profile-menu>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className={`h-7 w-7 rounded-full object-${avatarDisplayMode} ring-2 ring-[#30363d]`}
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#30363d] text-xs font-bold text-[#ccd0d4] ring-2 ring-[#484f58]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-[#ccd0d4] leading-tight">{userName}</span>
                  <span className="text-[10px] text-[#8b949e] leading-tight">Администратор</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#8b949e] transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Profile dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#161616] border border-[#30363d] rounded-lg shadow-xl z-50 py-1">
                  <div className="px-3 py-2 border-b border-[#30363d]">
                    <p className="text-sm font-medium text-[#ccd0d4] truncate">{userName}</p>
                    <p className="text-xs text-[#8b949e] truncate">{userRole || "admin"}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:bg-white/5 hover:text-[#ccd0d4] transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Профиль
                  </Link>

                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:bg-white/5 hover:text-[#ccd0d4] transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    Настройки безопасности
                  </Link>

                  <Link
                    to="/admin/monitoring"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:bg-white/5 hover:text-[#ccd0d4] transition-colors"
                  >
                    <Activity className="h-4 w-4" />
                    Мониторинг
                  </Link>

                  <div className="border-t border-[#30363d] my-1" />

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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

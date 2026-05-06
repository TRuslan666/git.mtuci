import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../api/client";
import { getMe, invalidateMeCache } from "../api/authApi";
import type { UserRole } from "../api/types";

interface NavBarProps {
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

export default function NavBar({ isDarkTheme = false, onToggleTheme }: NavBarProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDisplayMode, setAvatarDisplayMode] = useState<string>("cover");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkTheme]);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const me = await getMe();
        if (!cancelled) {
          setUserName(me.full_name || me.email || "User");
          setUserRole(me.role);
          // Add cache-busting timestamp to force image reload
          setAvatarUrl(me.avatar_url ? `${me.avatar_url}?t=${Date.now()}` : null);
          setAvatarDisplayMode(me.avatar_display_mode || "cover");
        }
      } catch {
        if (!cancelled) {
          setUserName("User");
          setUserRole(null);
          setAvatarUrl(null);
          setAvatarDisplayMode("cover");
        }
      }
    }
    loadMe();

    // Listen for avatar updates
    const handleAvatarUpdate = (e: CustomEvent) => {
      const userData = e.detail;
      if (userData) {
        setUserName(userData.full_name || userData.email || "User");
        setUserRole(userData.role);
        // Add cache-busting timestamp to force image reload
        setAvatarUrl(userData.avatar_url ? `${userData.avatar_url}?t=${Date.now()}` : null);
        setAvatarDisplayMode(userData.avatar_display_mode || "cover");
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, []);

  function handleToggleTheme() {
    onToggleTheme?.();
  }

  function onLogout() {
    clearToken();
    invalidateMeCache();
    navigate("/login", { replace: true });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  }

  // Theme-based colors
  const navBg = isDarkTheme ? "bg-[#111111]" : "bg-white";
  const navBorder = isDarkTheme ? "border-[#30363d]" : "border-gray-200";
  const searchBg = isDarkTheme ? "bg-[#0d0d0d]" : "bg-gray-100";
  const searchBorder = isDarkTheme ? "border-[#30363d]" : "border-gray-300";
  const searchText = isDarkTheme ? "text-gray-300" : "text-gray-900";
  const searchPlaceholder = isDarkTheme ? "placeholder-[#8b949e]" : "placeholder-gray-500";
  const iconColor = isDarkTheme ? "text-[#8b949e]" : "text-gray-500";

  return (
    <div className={`border-b ${navBorder} ${navBg} transition-colors`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        {/* Left: Logo */}
        <Link to="/home" className="flex items-center">
          <img
            src="/logo_mtuci.png"
            alt="MTUCI"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className={`w-full rounded-md px-3 py-1.5 pl-9 text-sm outline-none transition border ${searchBg} ${searchBorder} ${searchText} ${searchPlaceholder} focus:ring-2 focus:ring-blue-500/50 ${isDarkTheme ? "focus:bg-[#161616]" : "focus:bg-white"}`}
            />
            <svg
              className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 ${iconColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
        </div>

        {/* Right: Navigation + User */}
        <div className="flex items-center gap-4">
          {userRole !== "admin" && (
            <nav className="flex items-center gap-2">
              <Link
                to="/courses"
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${isDarkTheme ? "text-[#ccd0d4] hover:bg-[#1a1a1a] hover:text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
              >
                {/* ЗАМЕНИ src НА ИКОНКУ КУРСОВ */}
                <img src="/icon-courses.png" alt="" className="h-5 w-5" />
                Курсы
              </Link>
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${isDarkTheme ? "text-[#ccd0d4] hover:bg-[#1a1a1a] hover:text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
              >
                {/* ЗАМЕНИ src НА ИКОНКУ ДАШБОРДА */}
                <img src="/icon-dashboard.png" alt="" className="h-5 w-5" />
                Дашборд
              </Link>
            </nav>
          )}

          {/* Theme toggle */}
          <button
            onClick={handleToggleTheme}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${isDarkTheme ? "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"}`}
            title={isDarkTheme ? "Светлая тема" : "Темная тема"}
          >
            {isDarkTheme ? "🌙" : "☀️"}
          </button>

          {/* User dropdown */}
          <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex items-center gap-2 rounded-full p-1 transition ${isDarkTheme ? "text-white/90 hover:bg-white/10 hover:text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className={`h-7 w-7 rounded-full object-${avatarDisplayMode}`}
              />
            ) : (
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isDarkTheme ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`max-w-[150px] truncate text-sm ${isDarkTheme ? "text-white" : "text-gray-900"}`}>{userName}</span>
            <svg className={`h-4 w-4 ${isDarkTheme ? "text-white" : "text-gray-500"}`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className={`absolute right-0 mt-1 w-48 rounded-md border py-1 shadow-lg ${isDarkTheme ? "border-[#30363d] bg-[#161616]" : "border-gray-200 bg-white"}`}>
              <div className={`border-b px-4 py-2 text-sm ${isDarkTheme ? "border-[#30363d] text-[#8b949e]" : "border-gray-200 text-gray-500"}`}>
                Вошли как <span className={`font-medium ${isDarkTheme ? "text-[#ccd0d4]" : "text-gray-900"}`}>{userName}</span>
              </div>
              <Link
                to="/profile"
                className={`block px-4 py-2 text-sm transition-colors ${isDarkTheme ? "text-[#8b949e] hover:bg-white/5 hover:text-[#ccd0d4]" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
                onClick={() => setMenuOpen(false)}
              >
                Профиль
              </Link>
              <div className={`border-t my-1 ${isDarkTheme ? "border-[#30363d]" : "border-gray-200"}`}></div>
              <button
                onClick={onLogout}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${isDarkTheme ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" : "text-red-600 hover:bg-red-50 hover:text-red-700"}`}
              >
                Выйти
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}


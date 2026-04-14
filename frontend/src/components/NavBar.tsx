import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../api/client";
import { getMe, invalidateMeCache } from "../api/authApi";
import type { UserRole } from "../api/types";

export default function NavBar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDisplayMode, setAvatarDisplayMode] = useState<string>("cover");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

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

  function toggleTheme() {
    setIsDark(!isDark);
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

  return (
    <div className="border-b border-[#2a1c5e] bg-[#372579]">
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
              className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-1.5 pl-9 text-sm text-white placeholder-white/50 outline-none transition focus:bg-white/20 focus:border-white/40"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50"
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
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
              >
                {/* ЗАМЕНИ src НА ИКОНКУ КУРСОВ */}
                <img src="/icon-courses.png" alt="" className="h-5 w-5" />
                Курсы
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
              >
                {/* ЗАМЕНИ src НА ИКОНКУ ДАШБОРДА */}
                <img src="/icon-dashboard.png" alt="" className="h-5 w-5" />
                Дашборд
              </Link>
            </nav>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/90 transition hover:bg-white/20 hover:text-white"
            title={isDark ? "Светлая тема" : "Темная тема"}
          >
            {isDark ? "🌙" : "☀️"}
          </button>

          {/* User dropdown */}
          <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-full p-1 text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className={`h-7 w-7 rounded-full object-${avatarDisplayMode}`}
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="max-w-[150px] truncate text-sm">{userName}</span>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-md border border-[#2a1c5e] bg-white py-1 shadow-lg">
              <div className="border-b border-gray-200 px-4 py-2 text-sm text-gray-500">
                Вошли как <span className="font-medium text-gray-900">{userName}</span>
              </div>
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setMenuOpen(false)}
              >
                Профиль
              </Link>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={onLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 hover:text-red-700"
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


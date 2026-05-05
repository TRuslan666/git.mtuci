import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { login } from "../api/authApi";

export default function LoginPage() {
  const navigate = useNavigate();

  // Read theme from localStorage (persisted across sessions)
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false;
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for theme changes from other pages
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("theme");
      setIsDarkTheme(saved ? saved === "dark" : false);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Theme-based colors - unified with project standard
  const pageBgStyle = isDarkTheme ? { backgroundColor: "#111111" } : { backgroundColor: "#f9fafb" };
  const cardBg = isDarkTheme ? "bg-[#1e1e1e] border-[#2d2d2d]" : "bg-white border-gray-200";
  const brandText = isDarkTheme ? "text-blue-400" : "text-blue-600";
  const titleText = isDarkTheme ? "text-white" : "text-gray-900";
  const subtitleText = isDarkTheme ? "text-gray-400" : "text-gray-600";
  const labelText = isDarkTheme ? "text-gray-400" : "text-gray-700";
  const inputBg = isDarkTheme ? "bg-[#111111] border-[#2d2d2d] text-white" : "bg-white border-gray-300 text-gray-900";
  const inputFocus = "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const eyeIconColor = isDarkTheme ? "text-gray-500 hover:text-gray-400" : "text-gray-400 hover:text-gray-600";
  const checkboxBorder = isDarkTheme ? "border-[#2d2d2d]" : "border-gray-300";
  const linkColor = isDarkTheme ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800";
  const errorBg = isDarkTheme ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-800";
  const primaryBtn = "bg-blue-600 hover:bg-blue-700 text-white";
  const secondaryBtn = isDarkTheme ? "bg-[#2d2d2d] border-[#3d3d3d] text-gray-300 hover:bg-[#3d3d3d]" : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password, rememberMe);
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={pageBgStyle}>
      <div className={`w-full max-w-md rounded-xl border p-8 shadow-md ${cardBg}`}>
        <div className="mb-6 text-center">
          <div className={`text-xl font-semibold ${brandText}`}>GIT.MTUCI</div>
          <h1 className={`mt-3 text-2xl font-semibold ${titleText}`}>Вход в систему</h1>
          <p className={`mt-1 text-sm ${subtitleText}`}>Войдите, чтобы просматривать курсы и задания.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={`mb-1 block text-sm font-medium ${labelText} transition-colors`}>Email</label>
            <input
              className={`w-full rounded-lg border px-3 py-2.5 outline-none transition ${inputBg} ${inputFocus}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className={`mb-1 block text-sm font-medium ${labelText} transition-colors`}>Password</label>
            <div className="relative">
              <input
                className={`w-full rounded-lg border px-3 py-2.5 pr-10 outline-none transition ${inputBg} ${inputFocus}`}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${eyeIconColor}`}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="mt-1 flex justify-between items-center">
              <label className={`flex items-center gap-2 text-sm cursor-pointer ${subtitleText} transition-colors`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`rounded text-blue-600 focus:ring-blue-500 ${checkboxBorder}`}
                />
                Запомнить меня
              </label>
              <Link
                to="/forgot-password"
                className={`text-sm transition hover:underline ${linkColor}`}
              >
                Забыли пароль?
              </Link>
            </div>
          </div>

          {error ? (
            <div className={`rounded-lg border p-3 text-sm ${errorBg} transition-colors`}>{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg px-3 py-2.5 font-medium transition disabled:opacity-60 ${primaryBtn}`}
          >
            {loading ? "Signing in..." : "Войти"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className={`w-full rounded-lg border px-3 py-2.5 transition ${secondaryBtn}`}
          >
            Регистрация
          </button>
        </form>
      </div>
    </div>
  );
}


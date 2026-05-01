import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { login } from "../api/authApi";

interface LoginPageProps {
  isDarkTheme?: boolean;
}

export default function LoginPage({ isDarkTheme = false }: LoginPageProps) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme-based colors
  const pageBg = isDarkTheme ? "bg-[#0f0f10]" : "bg-slate-50";
  const cardBg = isDarkTheme ? "bg-[#161616] border-[#2d2d2d]" : "bg-white border-gray-200";
  const brandText = isDarkTheme ? "text-purple-400" : "text-purple-700";
  const titleText = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-900";
  const subtitleText = isDarkTheme ? "text-[#8b949e]" : "text-gray-600";
  const labelText = isDarkTheme ? "text-[#8b949e]" : "text-gray-700";
  const inputBg = isDarkTheme ? "bg-[#0d0d0d] border-[#30363d] text-[#ccd0d4]" : "bg-white border-gray-300 text-gray-900";
  const inputFocus = "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20";
  const eyeIconColor = isDarkTheme ? "text-[#6e7681] hover:text-[#8b949e]" : "text-gray-400 hover:text-gray-600";
  const checkboxBorder = isDarkTheme ? "border-[#484f58]" : "border-gray-300";
  const linkColor = isDarkTheme ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-800";
  const errorBg = isDarkTheme ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-800";
  const primaryBtn = "bg-purple-600 hover:bg-purple-700 text-white";
  const secondaryBtn = isDarkTheme ? "bg-[#1f2937] border-[#30363d] text-[#ccd0d4] hover:bg-[#2d3748]" : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50";

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
    <div className={`flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 ${pageBg} transition-colors`}>
      <div className={`w-full max-w-md rounded-xl border p-8 shadow-md ${cardBg} transition-colors`}>
        <div className="mb-6 text-center">
          <div className={`text-xl font-semibold ${brandText} transition-colors`}>MTUCI Labs</div>
          <h1 className={`mt-3 text-2xl font-semibold ${titleText} transition-colors`}>Вход в систему</h1>
          <p className={`mt-1 text-sm ${subtitleText} transition-colors`}>Войдите, чтобы просматривать курсы и задания.</p>
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
                  className={`rounded text-purple-600 focus:ring-purple-500 ${checkboxBorder}`}
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


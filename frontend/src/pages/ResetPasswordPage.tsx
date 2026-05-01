import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";

interface ResetPasswordPageProps {
  isDarkTheme?: boolean;
}

export default function ResetPasswordPage({ isDarkTheme = false }: ResetPasswordPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Theme-based colors
  const pageBg = isDarkTheme ? "bg-[#0f0f10]" : "bg-slate-50";
  const cardBg = isDarkTheme ? "bg-[#161616] border-[#2d2d2d]" : "bg-white border-gray-200";
  const brandText = isDarkTheme ? "text-purple-400" : "text-purple-700";
  const titleText = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-900";
  const subtitleText = isDarkTheme ? "text-[#8b949e]" : "text-gray-600";
  const labelText = isDarkTheme ? "text-[#8b949e]" : "text-gray-700";
  const inputBg = isDarkTheme ? "bg-[#0d0d0d] border-[#30363d] text-[#ccd0d4]" : "bg-white border-gray-300 text-gray-900";
  const inputFocus = "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20";
  const successBg = isDarkTheme ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-green-50 border-green-200 text-green-800";
  const errorBg = isDarkTheme ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-800";
  const primaryBtn = "bg-purple-600 hover:bg-purple-700 text-white";
  const secondaryBtn = isDarkTheme ? "bg-[#1f2937] border-[#30363d] text-[#ccd0d4] hover:bg-[#2d3748]" : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50";

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Пароль должен содержать минимум 8 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (!token) {
      setError("Недействительная или отсутствующая ссылка для сброса пароля");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 ${pageBg} transition-colors`}>
      <div className={`w-full max-w-md rounded-xl border p-8 shadow-md ${cardBg} transition-colors`}>
        <div className="mb-6 text-center">
          <div className={`text-xl font-semibold ${brandText} transition-colors`}>MTUCI Labs</div>
          <h1 className={`mt-3 text-2xl font-semibold ${titleText} transition-colors`}>Новый пароль</h1>
          <p className={`mt-1 text-sm ${subtitleText} transition-colors`}>Введите новый пароль для вашего аккаунта.</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 text-sm ${successBg} transition-colors`}>
              Пароль успешно изменен! Теперь вы можете войти с новым паролем.
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={`w-full rounded-lg px-3 py-2.5 font-medium transition ${primaryBtn}`}
            >
              Войти в систему
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className={`mb-1 block text-sm font-medium ${labelText} transition-colors`}>Новый пароль</label>
              <input
                className={`w-full rounded-lg border px-3 py-2.5 outline-none transition ${inputBg} ${inputFocus}`}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Минимум 8 символов"
              />
            </div>

            <div>
              <label className={`mb-1 block text-sm font-medium ${labelText} transition-colors`}>Подтвердите пароль</label>
              <input
                className={`w-full rounded-lg border px-3 py-2.5 outline-none transition ${inputBg} ${inputFocus}`}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Повторите пароль"
              />
            </div>

            {error ? (
              <div className={`rounded-lg border p-3 text-sm ${errorBg} transition-colors`}>{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg px-3 py-2.5 font-medium transition disabled:opacity-60 ${primaryBtn}`}
            >
              {loading ? "Сохранение..." : "Сохранить новый пароль"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className={`w-full rounded-lg border px-3 py-2.5 transition ${secondaryBtn}`}
            >
              Отмена
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

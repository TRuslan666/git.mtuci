import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";

interface ForgotPasswordPageProps {
  isDarkTheme?: boolean;
}

export default function ForgotPasswordPage({ isDarkTheme = false }: ForgotPasswordPageProps) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 ${pageBg} transition-colors`}>
      <div className={`w-full max-w-md rounded-xl border p-8 shadow-md ${cardBg} transition-colors`}>
        <div className="mb-6 text-center">
          <div className={`text-xl font-semibold ${brandText} transition-colors`}>MTUCI Labs</div>
          <h1 className={`mt-3 text-2xl font-semibold ${titleText} transition-colors`}>Восстановление пароля</h1>
          <p className={`mt-1 text-sm ${subtitleText} transition-colors`}>
            Введите email, и мы отправим инструкции по сбросу пароля.
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 text-sm ${successBg} transition-colors`}>
              Если указанный email зарегистрирован в системе, инструкции по восстановлению пароля отправлены.
              Проверьте свою почту.
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={`w-full rounded-lg px-3 py-2.5 font-medium transition ${primaryBtn}`}
            >
              Вернуться ко входу
            </button>
          </div>
        ) : (
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
                placeholder="your@email.com"
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
              {loading ? "Отправка..." : "Отправить инструкции"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className={`w-full rounded-lg border px-3 py-2.5 transition ${secondaryBtn}`}
            >
              Назад ко входу
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

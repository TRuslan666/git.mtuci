import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold text-purple-700">MTUCI Labs</div>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">Новый пароль</h1>
          <p className="mt-1 text-sm text-gray-600">Введите новый пароль для вашего аккаунта.</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Пароль успешно изменен! Теперь вы можете войти с новым паролем.
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full rounded-lg bg-purple-600 px-3 py-2.5 font-medium text-white transition hover:bg-purple-700"
            >
              Войти в систему
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Новый пароль</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Подтвердите пароль</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
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
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-purple-600 px-3 py-2.5 font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? "Сохранение..." : "Сохранить новый пароль"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 transition hover:bg-gray-50"
            >
              Отмена
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

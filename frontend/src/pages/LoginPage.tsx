import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold text-purple-700">MTUCI Labs</div>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">Вход в систему</h1>
          <p className="mt-1 text-sm text-gray-600">Войдите, чтобы просматривать курсы и задания.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="mt-1 flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-purple-600 transition hover:text-purple-800 hover:underline"
              >
                Забыли пароль?
              </Link>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 px-3 py-2.5 font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Войти"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 transition hover:bg-gray-50"
          >
            Регистрация
          </button>
        </form>
      </div>
    </div>
  );
}


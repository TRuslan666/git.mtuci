import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { register, registerStudentMtuci } from "../api/authApi";
import type { FormEvent } from "react";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [useMtuci, setUseMtuci] = useState(false);
  const [mtuciLogin, setMtuciLogin] = useState("");
  const [mtuciPassword, setMtuciPassword] = useState("");
  const [showMtuciPassword, setShowMtuciPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (useMtuci && mtuciLogin && mtuciPassword) {
        await registerStudentMtuci(email, password, fullName, mtuciLogin, mtuciPassword);
      } else {
        await register(email, password, fullName);
      }
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold text-purple-700">MTUCI Labs</div>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">Создание аккаунта</h1>
          <p className="mt-1 text-sm text-gray-600">
            Создайте аккаунт преподавателя или студента (по умолчанию student).
          </p>
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
            <div className="relative">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className={`inline-block w-2 h-2 rounded-full ${password.length >= 8 ? "bg-green-500" : "bg-gray-300"}`} />
              <span className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
                Минимум 8 символов
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useMtuci}
                onChange={(e) => setUseMtuci(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-purple-900">
                Автозаполнение из ЛК МТУСИ
              </span>
            </label>
            <p className="mt-1 text-xs text-purple-700">
              Укажите логин/пароль от ЛК МТУСИ, и ФИО с группой подтянутся автоматически
            </p>
          </div>

          {useMtuci ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Логин ЛК МТУСИ</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  type="text"
                  value={mtuciLogin}
                  onChange={(e) => setMtuciLogin(e.target.value)}
                  required={useMtuci}
                  placeholder="ваш_логин"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Пароль ЛК МТУСИ</label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    type={showMtuciPassword ? "text" : "password"}
                    value={mtuciPassword}
                    onChange={(e) => setMtuciPassword(e.target.value)}
                    required={useMtuci}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMtuciPassword(!showMtuciPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showMtuciPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!useMtuci}
                autoComplete="name"
              />
            </div>
          )}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 px-3 py-2.5 font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : useMtuci ? "Создать через ЛК МТУСИ" : "Создать аккаунт"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 transition hover:bg-gray-50"
          >
            Назад ко входу
          </button>
        </form>
      </div>
    </div>
  );
}


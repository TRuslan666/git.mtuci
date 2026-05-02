import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import { changeMyPassword, getMe, uploadAvatarWithMode } from "../api/authApi";
import type { UserRead } from "../api/types";
import AvatarUploadModal from "../components/AvatarUploadModal";
import { GitBranch, Users, GitCommit, Shield, Mail, User, Calendar } from "lucide-react";

interface ProfilePageProps {
  isDarkTheme?: boolean;
}

// Цвета по ТЗ
const colors = {
  pageBg: "#111111",
  cardBg: "#1e1e1e",
  border: "#30363d",
  accent: "#2563eb",
  textPrimary: "#e6e6e6",
  textSecondary: "#888888",
};

// Статические данные для демо
const stats = {
  repositories: 12,
  users: 2,
  commits: 156,
};

// Функция склонения слов
function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

// Последние действия (демо)
const recentActions = [
  { id: 1, type: "login", text: "Вход в систему", time: "2 мин назад", color: "#22c55e" },
  { id: 2, type: "change", text: "Изменен пароль", time: "3 час назад", color: "#2563eb" },
  { id: 3, type: "critical", text: "Неудачная попытка входа", time: "1 день назад", color: "#ef4444" },
];

export default function ProfilePage({ isDarkTheme = false }: ProfilePageProps) {
  const [me, setMe] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatNewPassword, setRepeatNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsModalOpen(true);
  }

  async function handleUploadConfirm(file: File) {
    setAvatarLoading(true);
    setError(null);
    try {
      const updated = await uploadAvatarWithMode(file, "cover");
      setMe(updated);
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: updated }));
      setIsModalOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить аватар");
    } finally {
      setAvatarLoading(false);
    }
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      setLoading(true);
      try {
        const meData = await getMe();
        if (!cancelled) setMe(meData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== repeatNewPassword) {
      setError("Новые пароли не совпадают.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Новый пароль должен быть не короче 8 символов.");
      return;
    }

    setSaving(true);
    try {
      await changeMyPassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setRepeatNewPassword("");
      setSuccess("Пароль успешно изменен.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сменить пароль");
    } finally {
      setSaving(false);
    }
  }

  // Бейдж роли
  const roleBadge = me?.role === "admin" 
    ? { text: "Администратор", bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }
    : me?.role === "teacher"
    ? { text: "Преподаватель", bg: "rgba(37, 99, 235, 0.2)", color: "#2563eb" }
    : { text: "Студент", bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" };

  return (
    <>
    <style>{`
      input::placeholder {
        color: rgba(136, 136, 136, 0.4) !important;
      }
      button[type="submit"]:hover:not(:disabled) {
        background-color: #1d4ed8 !important;
      }
      button[type="button"]:hover {
        background-color: rgba(255, 255, 255, 0.05) !important;
      }
    `}</style>
    <div style={{ backgroundColor: colors.pageBg, minHeight: "100%", padding: "16px" }}>
      {/* Заголовок */}
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ color: colors.textPrimary, fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}>
          Профиль
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: "12px" }}>
          Управление аккаунтом и настройки безопасности
        </p>
      </div>

      {loading ? (
        <div style={{ color: colors.textSecondary }}>Загрузка...</div>
      ) : me ? (
        <>
        {/* Две колонки */}
        <div style={{ display: "grid", gridTemplateColumns: "0.4fr 1fr", gap: "20px", alignItems: "start" }}>
          {/* Левая колонка — обёртка */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Блок Профиль */}
            <div style={{  
              backgroundColor: "#141414", 
              border: `1px solid ${colors.border}`, 
              borderRadius: "12px", 
              padding: "20px 20px 16px 20px"
            }}>
              {/* Шапка профиля — горизонтальный layout */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              {/* Аватар слева — компактный */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: me?.avatar_url ? undefined : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: "600",
                  color: "#fff",
                  flexShrink: 0,
                  cursor: "pointer",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {me?.avatar_url ? (
                  <img
                    src={me.avatar_url}
                    alt={me?.full_name || ""}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  me?.full_name?.charAt(0).toUpperCase()
                )}
                {/* Hover overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <span style={{ fontSize: "10px", color: "#fff" }}>Изменить</span>
                </div>
              </div>
              {/* Скрытый input для загрузки */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />

              {/* Блок информации справа — вертикально */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {/* Имя */}
                <div style={{ color: colors.textPrimary, fontSize: "16px", fontWeight: "600" }}>
                  {me?.full_name}
                </div>

                {/* Email с иконкой */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: colors.textSecondary, fontSize: "12px" }}>
                  <Mail size={12} />
                  {me?.email}
                </div>

                {/* Бейдж роли */}
                <span style={{ 
                  display: "inline-block",
                  padding: "2px 8px", 
                  borderRadius: "9999px", 
                  fontSize: "10px",
                  fontWeight: "500",
                  backgroundColor: roleBadge.bg,
                  color: roleBadge.color,
                  alignSelf: "flex-start"
                }}>
                  {roleBadge.text}
                </span>
              </div>
            </div>

            {/* Горизонтальный разделитель */}
            <div style={{ 
              height: "1px", 
              backgroundColor: colors.border, 
              marginBottom: "16px" 
            }} />

            {/* Блок статистики — 3 карточки с темным фоном (вдавленность) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {/* Репозитории — темный фон */}
              <div style={{ 
                backgroundColor: "#0a0a0a", 
                borderRadius: "6px", 
                padding: "16px 12px",
                textAlign: "center"
              }}>
                <div style={{ color: colors.textPrimary, fontSize: "18px", fontWeight: "700", marginBottom: "2px" }}>
                  {stats.repositories}
                </div>
                <div style={{ color: colors.textSecondary, fontSize: "10px" }}>
                  {pluralize(stats.repositories, ['Репозиторий', 'Репозитория', 'Репозиториев'])}
                </div>
              </div>

              {/* Пользователи — темный фон */}
              <div style={{ 
                backgroundColor: "#0a0a0a", 
                borderRadius: "6px", 
                padding: "16px 12px",
                textAlign: "center"
              }}>
                <div style={{ color: colors.textPrimary, fontSize: "18px", fontWeight: "700", marginBottom: "2px" }}>
                  {stats.users}
                </div>
                <div style={{ color: colors.textSecondary, fontSize: "10px" }}>
                  {pluralize(stats.users, ['Пользователь', 'Пользователя', 'Пользователей'])}
                </div>
              </div>

              {/* Коммиты — темный фон */}
              <div style={{ 
                backgroundColor: "#0a0a0a", 
                borderRadius: "6px", 
                padding: "16px 12px",
                textAlign: "center"
              }}>
                <div style={{ color: colors.textPrimary, fontSize: "18px", fontWeight: "700", marginBottom: "2px" }}>
                  {stats.commits}
                </div>
                <div style={{ color: colors.textSecondary, fontSize: "10px" }}>
                  {pluralize(stats.commits, ['Коммит', 'Коммита', 'Коммитов'])}
                </div>
              </div>
            </div>
          </div>

          {/* Блок ИНФОРМАЦИЯ */}
          <div style={{  
            backgroundColor: "#141414", 
            border: `1px solid ${colors.border}`, 
            borderRadius: "12px", 
            padding: "16px 20px",
          }}>
            {/* Заголовок с 'Только чтение' */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <h4 style={{ color: colors.textPrimary, fontSize: "12px", fontWeight: "600", margin: 0 }}>
                ИНФОРМАЦИЯ
              </h4>
              <span style={{ color: colors.textSecondary, fontSize: "10px" }}>
                Только чтение
              </span>
            </div>

            {/* Список данных */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Имя */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`
              }}>
                <span style={{ color: colors.textSecondary, fontSize: "11px" }}>Имя</span>
                <span style={{ color: colors.textPrimary, fontSize: "11px" }}>{me?.name || me?.login || "-"}</span>
              </div>

              {/* Email */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`
              }}>
                <span style={{ color: colors.textSecondary, fontSize: "11px" }}>Email</span>
                <span style={{ color: colors.textPrimary, fontSize: "11px" }}>{me?.email || "—"}</span>
              </div>

              {/* Роль */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`
              }}>
                <span style={{ color: colors.textSecondary, fontSize: "11px" }}>Роль</span>
                <span style={{ color: colors.textPrimary, fontSize: "11px" }}>
                  {me?.role === "admin" ? "Администратор" : "Пользователь"}
                </span>
              </div>

              {/* Дата регистрации */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`
              }}>
                <span style={{ color: colors.textSecondary, fontSize: "11px" }}>Дата регистрации</span>
                <span style={{ color: colors.textPrimary, fontSize: "11px" }}>{me?.created_at ? new Date(me.created_at).toLocaleDateString("ru-RU") : "—"}</span>
              </div>

              {/* Последний вход */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`
              }}>
                <span style={{ color: colors.textSecondary, fontSize: "11px" }}>Последний вход</span>
                <span style={{ color: colors.textPrimary, fontSize: "11px" }}>{me?.last_login ? new Date(me.last_login).toLocaleDateString("ru-RU") : "—"}</span>
              </div>

              {/* Статус */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0 0 0"
              }}>
                <span style={{ color: colors.textSecondary, fontSize: "11px" }}>Статус</span>
                <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "500" }}>Активен</span>
              </div>
            </div>
          </div>
          </div>

          {/* Правая колонка — обёртка */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Блок Смена пароля */}
            <div style={{  
              backgroundColor: "#141414", 
              border: `1px solid ${colors.border}`, 
              borderRadius: "12px", 
              padding: "20px"
            }}>
              <h3 style={{ color: colors.textPrimary, fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>
                Смена пароля
              </h3>

              <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ color: colors.textSecondary, fontSize: "12px", display: "block", marginBottom: "4px" }}>
                  Старый пароль
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  style={{
                    width: "100%",
                    backgroundColor: "#0a0a0a",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    padding: "10px 12px",
                    color: colors.textPrimary,
                    fontSize: "12px",
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: colors.textSecondary, fontSize: "12px", display: "block", marginBottom: "4px" }}>
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  style={{
                    width: "100%",
                    backgroundColor: "#0a0a0a",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    padding: "10px 12px",
                    color: colors.textPrimary,
                    fontSize: "12px",
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: colors.textSecondary, fontSize: "12px", display: "block", marginBottom: "4px" }}>
                  Повторите новый пароль
                </label>
                <input
                  type="password"
                  value={repeatNewPassword}
                  onChange={(e) => setRepeatNewPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  style={{
                    width: "100%",
                    backgroundColor: "#0a0a0a",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    padding: "10px 12px",
                    color: colors.textPrimary,
                    fontSize: "12px",
                    outline: "none",
                  }}
                  required
                />
              </div>

              {error && (
                <div style={{ 
                  backgroundColor: "rgba(239, 68, 68, 0.1)", 
                  border: "1px solid rgba(239, 68, 68, 0.3)", 
                  borderRadius: "6px", 
                  padding: "8px 12px",
                  color: "#ef4444",
                  fontSize: "12px"
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ 
                  backgroundColor: "rgba(34, 197, 94, 0.1)", 
                  border: "1px solid rgba(34, 197, 94, 0.3)", 
                  borderRadius: "6px", 
                  padding: "8px 12px",
                  color: "#22c55e",
                  fontSize: "12px"
                }}>
                  {success}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    backgroundColor: colors.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Смена..." : "Сменить пароль"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOldPassword("");
                    setNewPassword("");
                    setRepeatNewPassword("");
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{
                    backgroundColor: "transparent",
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    padding: "8px 20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>

          {/* Блок Последние действия */}
          <div style={{  
            backgroundColor: "#141414", 
            border: `1px solid ${colors.border}`, 
            borderRadius: "12px", 
            padding: "16px 20px",
            marginTop: "16px"
          }}>
            {/* Заголовок */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <h4 style={{ color: colors.textPrimary, fontSize: "12px", fontWeight: "600", margin: 0 }}>
                ПОСЛЕДНИЕ ДЕЙСТВИЯ
              </h4>
              <span style={{ color: colors.textSecondary, fontSize: "10px" }}>
                Последние 24 часа
              </span>
            </div>

            {/* Список действий */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Действие 1 */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`
              }}>
                <div>
                  <div style={{ color: colors.textPrimary, fontSize: "11px" }}>Изменение пароля</div>
                  <div style={{ color: colors.textSecondary, fontSize: "10px" }}>Успешно выполнено</div>
                </div>
                <span style={{ color: colors.textSecondary, fontSize: "10px" }}>2 часа назад</span>
              </div>

              {/* Действие 2 */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`
              }}>
                <div>
                  <div style={{ color: colors.textPrimary, fontSize: "11px" }}>Вход в систему</div>
                  <div style={{ color: colors.textSecondary, fontSize: "10px" }}>Chrome • Windows</div>
                </div>
                <span style={{ color: colors.textSecondary, fontSize: "10px" }}>5 часов назад</span>
              </div>

              {/* Действие 3 */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 0 0 0"
              }}>
                <div>
                  <div style={{ color: colors.textPrimary, fontSize: "11px" }}>Обновление профиля</div>
                  <div style={{ color: colors.textSecondary, fontSize: "10px" }}>Изменён аватар</div>
                </div>
                <span style={{ color: colors.textSecondary, fontSize: "10px" }}>Вчера</span>
              </div>
            </div>
          </div>
          </div>
        </div>
        </>
      ) : null}

      {/* Модал аватара */}
      {isModalOpen && (
        <AvatarUploadModal
          file={selectedFile}
          onClose={handleModalClose}
          onConfirm={handleUploadConfirm}
          isUploading={avatarLoading}
        />
      )}
    </div>
    </>
  );
}


import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import { changeMyPassword, getMe, uploadAvatarWithMode, updateAvatarDisplayMode } from "../api/authApi";
import type { UserRead } from "../api/types";
import AvatarUploadModal from "../components/AvatarUploadModal";

interface ProfilePageProps {
  isDarkTheme?: boolean;
}

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

  // Theme-based colors
  const pageBgStyle = isDarkTheme ? { backgroundColor: "#0f0f10" } : { backgroundColor: "#f8fafc" };
  const cardBg = isDarkTheme ? "bg-[#161616] border-[#2d2d2d]" : "bg-[#faf9fd] border-[#d4cfe6]";
  const titleText = isDarkTheme ? "text-[#ccd0d4]" : "text-gray-900";
  const loadingText = isDarkTheme ? "text-[#6e7681]" : "text-gray-600";
  const infoText = isDarkTheme ? "text-[#8b949e]" : "text-gray-800";
  const labelText = isDarkTheme ? "text-[#8b949e]" : "text-gray-700";
  const inputBg = isDarkTheme ? "bg-[#0d0d0d] border-[#30363d] text-[#ccd0d4]" : "bg-white border-gray-300 text-gray-900";
  const inputFocus = "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20";
  const avatarGradient = "bg-gradient-to-br from-[#372579] to-[#5a3d8a]";
  const avatarBtnBg = isDarkTheme ? "bg-[#161616] border-[#30363d] text-[#6e7681]" : "bg-white border-gray-200 text-gray-600";
  const avatarBtnHover = isDarkTheme ? "hover:text-purple-400" : "hover:text-[#372579]";
  const errorBg = isDarkTheme ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-800";
  const successBg = isDarkTheme ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-green-50 border-green-200 text-green-800";
  const primaryBtn = "bg-[#372579] hover:bg-[#2a1c5e] text-white";

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsModalOpen(true);
  }

  async function handleUploadConfirm(file: File, cropData: { x: number; y: number; zoom: number }) {
    setAvatarLoading(true);
    setError(null);
    try {
      // For now, just upload the file. Backend can use cropData later.
      const updated = await uploadAvatarWithMode(file, "cover");
      setMe(updated);
      // Notify NavBar to refresh avatar
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: updated }));
      setIsModalOpen(false);
      setSelectedFile(null);
      // Clear file input after successful upload
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
    // Clear file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      setLoading(true);
      setError(null);
      try {
        const meData = await getMe();
        if (!cancelled) setMe(meData);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
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

  return (
    <div style={pageBgStyle}>
      <h1 style={{ color: titleText === "text-[#ccd0d4]" ? "#ccd0d4" : "#000" }}>Профиль</h1>

      <div className={`mb-6 rounded-xl border p-5 shadow-sm ${cardBg} transition-colors`}>
        {loading ? <div style={pageBgStyle}>Loading...</div> : null}
        {me ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              {me.avatar_url ? (
                <img
                  src={`${me.avatar_url}?t=${Date.now()}`}
                  alt=""
                  className={`h-16 w-16 rounded-full object-${me.avatar_display_mode || "cover"}`}
                />
              ) : (
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${avatarGradient} text-xl font-bold text-white`}>
                  {me.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={triggerFileInput}
                disabled={avatarLoading}
                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-md border transition disabled:opacity-60 ${avatarBtnBg} ${avatarBtnHover}`}
                title="Изменить аватар"
              >
                {avatarLoading ? (
                  <span className="text-xs">...</span>
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className={`grid gap-1 text-sm flex-1 ${infoText} transition-colors`}>
              <div><span className="font-medium">Имя:</span> {me.full_name}</div>
              <div><span className="font-medium">Email:</span> {me.email}</div>
              <div><span className="font-medium">Роль:</span> {me.role}</div>
            </div>
          </div>
        ) : null}
      </div>

      {isModalOpen && (
        <AvatarUploadModal
          file={selectedFile}
          onClose={handleModalClose}
          onConfirm={handleUploadConfirm}
          isUploading={avatarLoading}
        />
      )}

      <form onSubmit={onSubmit} className={`rounded-xl border p-5 shadow-sm ${cardBg} transition-colors`}>
        <h2 className={`mb-4 text-lg font-semibold ${titleText} transition-colors`}>Смена пароля</h2>

        <div className="mb-3">
          <label className={`mb-1 block text-sm font-medium ${labelText} transition-colors`}>Старый пароль</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 outline-none transition ${inputBg} ${inputFocus}`}
            required
          />
        </div>

        <div className="mb-3">
          <label className={`mb-1 block text-sm font-medium ${labelText} transition-colors`}>Новый пароль</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 outline-none transition ${inputBg} ${inputFocus}`}
            required
          />
        </div>

        <div className="mb-4">
          <label className={`mb-1 block text-sm font-medium ${labelText} transition-colors`}>Повторите новый пароль</label>
          <input
            type="password"
            value={repeatNewPassword}
            onChange={(e) => setRepeatNewPassword(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 outline-none transition ${inputBg} ${inputFocus}`}
            required
          />
        </div>

        {error ? (
          <div className={`mb-3 rounded-lg border p-3 text-sm ${errorBg} transition-colors`}>
            {error}
          </div>
        ) : null}
        {success ? (
          <div className={`mb-3 rounded-lg border p-3 text-sm ${successBg} transition-colors`}>
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${primaryBtn}`}
        >
          {saving ? "Смена..." : "Сменить пароль"}
        </button>
      </form>
    </div>
  );
}


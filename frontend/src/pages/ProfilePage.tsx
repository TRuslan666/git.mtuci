import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import { changeMyPassword, getMe, uploadAvatarWithMode, updateAvatarDisplayMode } from "../api/authApi";
import type { UserRead } from "../api/types";
import AvatarUploadModal from "../components/AvatarUploadModal";

export default function ProfilePage() {
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
    <div className="mx-auto max-w-3xl px-4">
      <h1 className="mb-5 text-3xl font-semibold text-gray-900">Профиль</h1>

      <div className="mb-6 rounded-xl border border-[#d4cfe6] bg-[#faf9fd] p-5 shadow-sm">
        {loading ? <div className="text-sm text-gray-600">Loading...</div> : null}
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
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#372579] to-[#5a3d8a] text-xl font-bold text-white">
                  {me.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={triggerFileInput}
                disabled={avatarLoading}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:text-[#372579] transition disabled:opacity-60"
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
            <div className="grid gap-1 text-sm text-gray-800 flex-1">
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

      <form onSubmit={onSubmit} className="rounded-xl border border-[#d4cfe6] bg-[#faf9fd] p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Смена пароля</h2>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">Старый пароль</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            required
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">Новый пароль</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            required
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Повторите новый пароль</label>
          <input
            type="password"
            value={repeatNewPassword}
            onChange={(e) => setRepeatNewPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            required
          />
        </div>

        {error ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#372579] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2a1c5e] disabled:opacity-60"
        >
          {saving ? "Смена..." : "Сменить пароль"}
        </button>
      </form>
    </div>
  );
}


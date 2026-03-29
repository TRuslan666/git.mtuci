import { useEffect, useMemo, useState } from "react";
import type { AdminUserRead, UserRole } from "../api/types";
import { getAdminUsers, patchAdminUser, resetAdminUserPassword, deleteAdminUser } from "../api/adminApi";

type UserEdit = { role: UserRole; is_blocked: boolean; group_name: string | null; student_id: string | null };

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRead[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, UserEdit>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getAdminUsers();
        if (cancelled) return;
        setUsers(list);
        const initialEdits: Record<string, UserEdit> = {};
        for (const u of list) {
          initialEdits[u.id] = { 
            role: u.role, 
            is_blocked: u.is_blocked,
            group_name: u.group_name ?? null,
            student_id: u.student_id ?? null,
          };
        }
        setEdits(initialEdits);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const roleOptions: UserRole[] = useMemo(() => ["student", "teacher", "admin"], []);

  async function onApply(user: AdminUserRead) {
    const edit = edits[user.id];
    if (!edit) return;

    setUpdatingUserId(user.id);
    setError(null);
    try {
      const updated = await patchAdminUser(user.id, edit);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setEdits((prev) => ({ ...prev, [user.id]: { role: updated.role, is_blocked: updated.is_blocked, group_name: updated.group_name ?? null, student_id: updated.student_id ?? null } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUpdatingUserId(null);
    }
  }

  function setEdit(userId: string, next: Partial<UserEdit>) {
    setEdits((prev) => {
      const cur = prev[userId];
      if (!cur) return prev;
      return { ...prev, [userId]: { ...cur, ...next } };
    });
  }

  async function onDelete(user: AdminUserRead) {
    const ok = window.confirm(`Удалить пользователя ${user.email}?`);
    if (!ok) return;

    setUpdatingUserId(user.id);
    setError(null);
    try {
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function onResetPassword(user: AdminUserRead) {
    const ok = window.confirm(`Сбросить пароль для ${user.email}?`);
    if (!ok) return;

    setUpdatingUserId(user.id);
    setError(null);
    try {
      const res = await resetAdminUserPassword(user.id);
      window.alert(`Новый пароль для ${user.email}: ${res.new_password}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-4">
        <h1 className="text-3xl font-semibold text-gray-900">Admin</h1>
        <p className="mt-2 text-sm text-gray-600">Управление пользователями и группами.</p>
      </div>

      {loading ? <div className="text-sm text-gray-600">Loading...</div> : null}
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!loading ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Full name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Blocked</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const edit = edits[u.id] ?? { role: u.role, is_blocked: u.is_blocked, group_name: u.group_name ?? null, student_id: u.student_id ?? null };
                const isBusy = updatingUserId === u.id;
                return (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                    <td className="px-4 py-3 text-gray-700">{u.full_name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={edit.role}
                        onChange={(e) => setEdit(u.id, { role: e.target.value as UserRole })}
                        disabled={isBusy}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-500"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={edit.group_name ?? ""}
                        onChange={(e) => setEdit(u.id, { group_name: e.target.value || null })}
                        disabled={isBusy}
                        placeholder="Group name"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={edit.student_id ?? ""}
                        onChange={(e) => setEdit(u.id, { student_id: e.target.value || null })}
                        disabled={isBusy}
                        placeholder="Student ID"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={edit.is_blocked}
                          onChange={(e) => setEdit(u.id, { is_blocked: e.target.checked })}
                          disabled={isBusy}
                        />
                        <span className="text-gray-700">{edit.is_blocked ? "Yes" : "No"}</span>
                      </label>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{new Date(u.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onApply(u)}
                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
                        >
                          {isBusy ? "Working..." : "Update"}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onResetPassword(u)}
                          className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-50 disabled:opacity-60"
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onDelete(u)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-600">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}


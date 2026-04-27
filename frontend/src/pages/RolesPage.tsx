import { useState, useEffect } from "react";
import {
  Shield,
  Briefcase,
  User,
  UserPlus,
  Microscope,
  Check,
  RotateCcw,
  Save,
  GitBranch,
  Users,
  GraduationCap,
  Settings,
  Loader2,
} from "lucide-react";
import {
  getRoles,
  getRolePermissions,
  getLaborants,
  saveRolePermissions,
  resetRolePermissions,
  trustLaborant,
  untrustLaborant,
  type Role,
  type PermissionCategory,
  type Laborant
} from "../api/rolesApi";
import toast from "react-hot-toast";

type RoleType = "admin" | "teacher" | "student" | "laborant";
type PermissionLevel = "read" | "write" | "delete" | "none";

// Russian pluralization helper
function pluralizeUsers(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "пользователей";
  }
  if (lastDigit === 1) {
    return "пользователь";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "пользователя";
  }
  return "пользователей";
}

interface Permission {
  id: string;
  name: string;
  description: string;
  level: PermissionLevel;
  enabled: boolean;
}

interface PermissionCategoryState {
  title: string;
  icon: React.ElementType;
  permissions: Permission[];
}

// Icon mapping for role icons from API
const iconMap: Record<string, React.ElementType> = {
  Shield,
  Briefcase,
  Microscope,
  User,
  UserPlus,
  GitBranch,
  Users,
  GraduationCap,
  Settings,
};

function getLevelBadge(level: PermissionLevel) {
  const styles = {
    read: "bg-blue-500/20 text-blue-400",
    write: "bg-white text-gray-900",
    delete: "bg-red-500/20 text-red-400",
    none: "bg-gray-700 text-gray-400",
  };
  const labels = {
    read: "Чтение",
    write: "Запись",
    delete: "Удаление",
    none: "Нет",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-700"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<RoleType>("admin");
  const [categories, setCategories] = useState<PermissionCategoryState[]>([]);
  const [initialCategories, setInitialCategories] = useState<PermissionCategoryState[]>([]);
  const [assistants, setAssistants] = useState<Laborant[]>([]);
  const [allowAssistantGrading, setAllowAssistantGrading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Check if permissions have changed
  const hasChanges = JSON.stringify(categories) !== JSON.stringify(initialCategories);

  // Load roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await getRoles();
        setRoles(data);
      } catch (error) {
        console.error("Failed to load roles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // Load permissions and laborants when role changes
  useEffect(() => {
    const fetchData = async () => {
      setPermissionsLoading(true);
      // Reset assistants immediately to avoid showing old data
      setAssistants([]);
      try {
        const [permsData, laborantsData] = await Promise.all([
          getRolePermissions(selectedRole),
          selectedRole === "teacher" ? getLaborants() : Promise.resolve([]),
        ]);
        
        console.log("Loaded permissions for", selectedRole, permsData);
        console.log("Loaded laborants:", laborantsData);
        
        // Map API categories to component format with icons
        const mappedCategories: PermissionCategoryState[] = permsData.map((cat) => {
          const iconMap: Record<string, React.ElementType> = {
            "РЕПОЗИТОРИИ": GitBranch,
            "ПОЛЬЗОВАТЕЛИ И ГРУППЫ": Users,
            "ОЦЕНКИ И ЗАДАНИЯ": GraduationCap,
            "СИСТЕМА": Settings,
          };
          return {
            title: cat.title,
            icon: iconMap[cat.title] || Settings,
            permissions: cat.permissions,
          };
        });
        
        setCategories(mappedCategories);
        setInitialCategories(mappedCategories);
        setAssistants(laborantsData);
      } catch (error) {
        console.error("Failed to load role data:", error);
      } finally {
        setPermissionsLoading(false);
      }
    };
    fetchData();
  }, [selectedRole]);

  const currentRole = roles.find((r) => r.id === selectedRole);

  // Update permissions when role changes
  const handleRoleChange = (role: RoleType) => {
    setSelectedRole(role);
  };

  const togglePermission = (categoryIndex: number, permissionIndex: number) => {
    setCategories((prev) => {
      const next = [...prev];
      next[categoryIndex] = {
        ...next[categoryIndex],
        permissions: [...next[categoryIndex].permissions],
      };
      next[categoryIndex].permissions[permissionIndex] = {
        ...next[categoryIndex].permissions[permissionIndex],
        enabled: !next[categoryIndex].permissions[permissionIndex].enabled,
      };
      return next;
    });
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleAssistantTrust = async (id: string) => {
    const assistant = assistants.find((a) => a.id === id);
    if (!assistant || togglingId) return;

    setTogglingId(id);
    try {
      if (assistant.trusted) {
        await untrustLaborant(id);
        toast.success("Лаборант убран из доверенных");
      } else {
        await trustLaborant(id);
        toast.success("Лаборант добавлен в доверенные");
      }
      // Update local state
      setAssistants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, trusted: !a.trusted } : a))
      );
    } catch (error) {
      toast.error("Ошибка при изменении доверия");
      console.error(error);
    } finally {
      setTogglingId(null);
    }
  };

  // Save permissions
  const handleSave = async () => {
    if (!currentRole) return;
    try {
      const permissionsData = categories.map((cat) => ({
        title: cat.title,
        permissions: cat.permissions.map((p) => ({
          id: p.id,
          enabled: p.enabled,
        })),
      }));
      console.log("Saving permissions for role:", currentRole.id, permissionsData);
      const result = await saveRolePermissions(currentRole.id, permissionsData);
      console.log("Save result:", result);
      // Update initial state to reflect saved changes
      setInitialCategories(categories);
      toast.success("Права доступа сохранены");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Ошибка при сохранении прав. Проверьте консоль (F12)");
    }
  };

  // Reset permissions to defaults
  const handleReset = async () => {
    if (!currentRole) return;
    try {
      console.log("Resetting permissions for role:", currentRole.id);
      const defaultPerms = await resetRolePermissions(currentRole.id);
      console.log("Reset result:", defaultPerms);
      const mappedCategories: PermissionCategoryState[] = defaultPerms.map((cat) => ({
        title: cat.title,
        icon: iconMap[cat.title] || Settings,
        permissions: cat.permissions,
      }));
      setCategories(mappedCategories);
      toast.success("Права сброшены по умолчанию");
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Ошибка при сбросе прав. Проверьте консоль (F12)");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f5f3fa] dark:bg-[#0f0f10] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Роли и доступ</h1>
          <span className="text-sm text-gray-500">{roles.length} ролей</span>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-5 gap-4">
          {roles.map((role) => {
            const Icon = iconMap[role.icon] || User;
            const isActive = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role.id as RoleType)}
                className={`text-left p-5 rounded-xl bg-white dark:bg-[#1e1e1e] border transition-all shadow-sm ${
                  isActive
                    ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
                    : "border-[#d4cfe6] dark:border-[#2d2d2d] hover:border-[#b8b0d9] dark:hover:border-[#3f3f46]"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${role.icon_bg} flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{role.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{role.description}</p>
                <p className="text-sm text-gray-400">{role.user_count} {pluralizeUsers(role.user_count)}</p>
              </button>
            );
          })}
        </div>

        {/* Split Screen */}
        <div className="grid grid-cols-[35%_1fr] gap-6">
          {/* Left Column - Role Selection */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-[#d4cfe6] dark:border-[#2d2d2d] p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Выбрать роль для редактирования
            </h2>
            <div className="space-y-2">
              {roles.map((role) => {
                const Icon = iconMap[role.icon] || User;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id as RoleType)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isSelected ? "bg-gray-100 dark:bg-[#252525]" : "hover:bg-gray-100 dark:hover:bg-[#252525]"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${role.icon_bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</p>
                      <p className="text-xs text-gray-500">{role.user_count} {pluralizeUsers(role.user_count)}</p>
                    </div>
                    {isSelected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        Выбрана
                      </span>
                    ) : role.is_system ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
                        Системная
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column - Permission Settings */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-[#d4cfe6] dark:border-[#2d2d2d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentRole?.name || "Роль"}</h2>
                <span className="text-gray-500">—</span>
                <span className="text-gray-400">права доступа</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  disabled={permissionsLoading || (!hasChanges && categories.length > 0)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-[#252525] border border-[#d4cfe6] dark:border-[#2d2d2d] text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Сбросить
                </button>
                <button
                  onClick={handleSave}
                  disabled={permissionsLoading || !hasChanges}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                    hasChanges
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {categories.map((category, categoryIndex: number) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={category.title}>
                    {categoryIndex > 0 && <div className="border-t border-[#2d2d2d] mb-6" />}
                    <div className="flex items-center gap-2 mb-4">
                      <CategoryIcon className="h-4 w-4 text-gray-500" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {category.title}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {category.permissions.map((permission: Permission, permissionIndex: number) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#252525]"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</p>
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getLevelBadge(permission.level)}
                            <Toggle
                              checked={permission.enabled}
                              onChange={() => togglePermission(categoryIndex, permissionIndex)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Assistant Management - Only for Teacher role */}
              {selectedRole === "teacher" && (
                <>
                  <div className="border-t border-[#2d2d2d] mb-6" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-4 w-4 text-gray-500" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        УПРАВЛЕНИЕ АССИСТЕНТАМИ
                      </h3>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252525]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Разрешить лаборантам проверку моих курсов</p>
                          <p className="text-xs text-gray-500">Доверенные лаборанты смогут выставлять оценки</p>
                        </div>
                        <Toggle
                          checked={allowAssistantGrading}
                          onChange={() => setAllowAssistantGrading(!allowAssistantGrading)}
                        />
                      </div>

                      {allowAssistantGrading && (
                        <div className="mt-4 pt-4 border-t border-[#2d2d2d]">
                          <p className="text-xs text-gray-400 mb-3">
                            Только выбранные лаборанты смогут выставлять оценки и менять статусы работ в ваших курсах
                          </p>
                          <div className="space-y-2">
                            {assistants.map((assistant) => (
                              <div
                                key={assistant.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#1e1e1e] border border-[#d4cfe6] dark:border-transparent"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <span className="text-xs font-medium text-emerald-400">{assistant.initials}</span>
                                  </div>
                                  <span className="text-sm text-gray-900 dark:text-white">{assistant.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${assistant.trusted ? "text-emerald-400" : "text-gray-500"}`}>
                                    {assistant.trusted ? "Доверенный" : "Не доверенный"}
                                  </span>
                                  <Toggle
                                    checked={assistant.trusted}
                                    onChange={() => toggleAssistantTrust(assistant.id)}
                                    disabled={togglingId === assistant.id}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

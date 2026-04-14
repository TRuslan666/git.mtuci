import { useState } from "react";
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
} from "lucide-react";

type RoleType = "admin" | "teacher" | "student" | "assistant" | "guest";
type PermissionLevel = "read" | "write" | "delete" | "none";

interface Role {
  id: RoleType;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  userCount: number;
  isSystem: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  level: PermissionLevel;
  enabled: boolean;
}

interface PermissionCategory {
  title: string;
  icon: React.ElementType;
  permissions: Permission[];
}

const roles: Role[] = [
  {
    id: "admin",
    name: "Администратор",
    description: "Полный доступ ко всем функциям системы",
    icon: Shield,
    iconBg: "bg-yellow-500/20 text-yellow-400",
    userCount: 12,
    isSystem: true,
  },
  {
    id: "teacher",
    name: "Преподаватель",
    description: "Управление курсами и оценками студентов",
    icon: Briefcase,
    iconBg: "bg-purple-500/20 text-purple-400",
    userCount: 56,
    isSystem: true,
  },
  {
    id: "assistant",
    name: "Лаборант",
    description: "Проверка лабораторных работ, консультирование студентов и модерирование репозиториев по поручению преподавателя",
    icon: Microscope,
    iconBg: "bg-emerald-500/20 text-emerald-400",
    userCount: 23,
    isSystem: false,
  },
  {
    id: "student",
    name: "Студент",
    description: "Доступ к курсам и сдача заданий",
    icon: User,
    iconBg: "bg-blue-500/20 text-blue-400",
    userCount: 1189,
    isSystem: false,
  },
  {
    id: "guest",
    name: "Гость",
    description: "Только просмотр общедоступных материалов",
    icon: UserPlus,
    iconBg: "bg-gray-500/20 text-gray-400",
    userCount: 47,
    isSystem: false,
  },
];

const basePermissionCategories: PermissionCategory[] = [
  {
    title: "РЕПОЗИТОРИИ",
    icon: GitBranch,
    permissions: [
      { id: "repo_view", name: "Просмотр репозиториев", description: "Видеть список и содержимое репозиториев", level: "read", enabled: true },
      { id: "repo_view_students", name: "Просмотр репозиториев студентов", description: "Доступ к репозиториям студентов по поручению преподавателя", level: "read", enabled: false },
      { id: "repo_create", name: "Создание репозиториев", description: "Создавать новые репозитории", level: "write", enabled: false },
      { id: "repo_delete", name: "Удаление репозиториев", description: "Удалять репозитории", level: "delete", enabled: false },
      { id: "repo_comment", name: "Добавление комментариев к коду", description: "Оставлять комментарии в pull requests", level: "write", enabled: false },
    ],
  },
  {
    title: "ПОЛЬЗОВАТЕЛИ И ГРУППЫ",
    icon: Users,
    permissions: [
      { id: "user_view", name: "Просмотр пользователей", description: "Видеть профили других пользователей", level: "read", enabled: true },
      { id: "user_edit", name: "Редактирование пользователей", description: "Изменять данные пользователей", level: "write", enabled: false },
      { id: "group_manage", name: "Управление группами", description: "Создавать и редактировать группы", level: "write", enabled: false },
    ],
  },
  {
    title: "ОЦЕНКИ И ЗАДАНИЯ",
    icon: GraduationCap,
    permissions: [
      { id: "assignment_view", name: "Просмотр заданий", description: "Видеть список всех заданий", level: "read", enabled: true },
      { id: "assignment_create", name: "Создание заданий", description: "Создавать новые задания", level: "write", enabled: false },
      { id: "grade_edit", name: "Выставление оценок", description: "Изменять оценки студентов", level: "write", enabled: false },
      { id: "lab_accept", name: "Прием лабораторных работ", description: "Смена статуса на 'Зачтено/Пересдача'", level: "write", enabled: false },
      { id: "grade_view_groups", name: "Просмотр оценок в своих группах", description: "Видеть оценки студентов по поручению преподавателя", level: "read", enabled: false },
    ],
  },
  {
    title: "СИСТЕМА",
    icon: Settings,
    permissions: [
      { id: "settings_view", name: "Просмотр настроек", description: "Видеть системные настройки", level: "read", enabled: true },
      { id: "settings_edit", name: "Изменение настроек", description: "Модифицировать системные параметры", level: "delete", enabled: false },
      { id: "logs_view", name: "Просмотр логов", description: "Доступ к системным логам", level: "read", enabled: false },
    ],
  },
];

// Role-specific permission overrides
const rolePermissionOverrides: Record<RoleType, Record<string, boolean>> = {
  admin: {
    repo_create: true,
    repo_delete: true,
    user_edit: true,
    group_manage: true,
    assignment_create: true,
    grade_edit: true,
    lab_accept: true,
    settings_edit: true,
    logs_view: true,
  },
  teacher: {
    repo_create: true,
    user_edit: true,
    group_manage: true,
    assignment_create: true,
    grade_edit: true,
    lab_accept: true,
    logs_view: true,
  },
  assistant: {
    repo_view_students: true,
    repo_comment: true,
    lab_accept: true,
    grade_view_groups: true,
    logs_view: true,
  },
  student: {
    repo_create: true,
  },
  guest: {},
};

function getPermissionsForRole(role: RoleType): PermissionCategory[] {
  const overrides = rolePermissionOverrides[role];
  return basePermissionCategories.map((category) => ({
    ...category,
    permissions: category.permissions.map((permission) => ({
      ...permission,
      enabled: overrides[permission.id] ?? permission.enabled,
    })),
  }));
}

// Trusted assistants for teacher role
interface TrustedAssistant {
  id: string;
  name: string;
  initials: string;
  trusted: boolean;
}

const mockAssistants: TrustedAssistant[] = [
  { id: "1", name: "Петров И.А.", initials: "ПИ", trusted: true },
  { id: "2", name: "Смирнова Е.К.", initials: "СЕ", trusted: false },
  { id: "3", name: "Кузнецов Д.М.", initials: "КД", trusted: true },
];

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

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-700"}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<RoleType>("teacher");
  const [categories, setCategories] = useState(() => getPermissionsForRole("teacher"));
  const [assistants, setAssistants] = useState(mockAssistants);
  const [allowAssistantGrading, setAllowAssistantGrading] = useState(true);

  const currentRole = roles.find((r) => r.id === selectedRole)!;

  // Update permissions when role changes
  const handleRoleChange = (role: RoleType) => {
    setSelectedRole(role);
    setCategories(getPermissionsForRole(role));
  };

  const togglePermission = (categoryIndex: number, permissionIndex: number) => {
    setCategories((prev: PermissionCategory[]) => {
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

  const toggleAssistantTrust = (id: string) => {
    setAssistants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, trusted: !a.trusted } : a))
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f5f3fa] dark:bg-[#0f0f10] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto py-6 px-6 pr-2 space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Роли и доступ</h1>
          <span className="text-sm text-gray-500">5 ролей</span>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-5 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role.id)}
                className={`text-left p-5 rounded-xl bg-white dark:bg-[#1e1e1e] border transition-all shadow-sm ${
                  isActive
                    ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
                    : "border-[#d4cfe6] dark:border-[#2d2d2d] hover:border-[#b8b0d9] dark:hover:border-[#3f3f46]"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${role.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{role.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{role.description}</p>
                <p className="text-sm text-gray-400">{role.userCount} пользователей</p>
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
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isSelected ? "bg-gray-100 dark:bg-[#252525]" : "hover:bg-gray-100 dark:hover:bg-[#252525]"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${role.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</p>
                      <p className="text-xs text-gray-500">{role.userCount} пользователей</p>
                    </div>
                    {isSelected ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        Выбрана
                      </span>
                    ) : role.isSystem ? (
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentRole.name}</h2>
                <span className="text-gray-500">—</span>
                <span className="text-gray-400">права доступа</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-[#252525] border border-[#d4cfe6] dark:border-[#2d2d2d] text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <RotateCcw className="h-4 w-4" />
                  Сбросить
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 transition-colors">
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {categories.map((category: PermissionCategory, categoryIndex: number) => {
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

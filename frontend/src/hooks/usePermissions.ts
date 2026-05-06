import { useState, useEffect, useCallback } from "react";
import { getMyPermissions } from "../api/rolesApi";

export function usePermissions() {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const perms = await getMyPermissions();
        setPermissions(new Set(perms));
      } catch (error) {
        console.error("Failed to load permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = useCallback(
    (permissionId: string) => permissions.has(permissionId),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...permissionIds: string[]) =>
      permissionIds.some((id) => permissions.has(id)),
    [permissions]
  );

  return { hasPermission, hasAnyPermission, loading, permissions };
}

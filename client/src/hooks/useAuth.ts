import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export type UserRole = "admin" | "admin_dica" | "operator_dica" | "fiscal_petrobras" | "viewer";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const userRole = user?.role as UserRole | undefined;
  
  const isAdmin = userRole === "admin" || userRole === "admin_dica";
  const canEdit = isAdmin || userRole === "operator_dica";
  const isViewOnly = userRole === "viewer" || userRole === "fiscal_petrobras";
  const canExport = isAdmin || userRole === "fiscal_petrobras";

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    isViewer: userRole === "viewer",
    userRole,
    canEdit,
    isViewOnly,
    canExport,
    error,
  };
}

import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { useDevRole, mapDevRoleToUserRole } from "@/contexts/DevRoleContext";

export type UserRole = "admin" | "admin_dica" | "operator_dica" | "fiscal_petrobras" | "viewer";

/**
 * Authentication hook with development role override support.
 * 
 * DEVELOPMENT MODE OVERRIDE:
 * When a dev role is set via the DevRoleSwitcher component, this hook will
 * use the dev role instead of the user's actual role for permission calculations.
 * This allows testing different role behaviors without changing the authenticated user.
 * 
 * The override only affects frontend permission checks. For backend enforcement,
 * API requests include an X-Dev-Role header (see queryClient.ts).
 */
export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Get dev role from context (only active in development mode)
  const { devRole, isDevMode } = useDevRole();
  
  // Map dev role to actual DB role value, or use real user role
  const mappedDevRole = mapDevRoleToUserRole(devRole) as UserRole | null;
  
  // Use dev role override if set (dev mode only), otherwise use real role
  const effectiveRole: UserRole | undefined = 
    (isDevMode && mappedDevRole) ? mappedDevRole : (user?.role as UserRole | undefined);
  
  // Calculate permissions based on effective role (dev override or real)
  const isAdmin = effectiveRole === "admin" || effectiveRole === "admin_dica";
  const canEdit = isAdmin || effectiveRole === "operator_dica";
  const isViewOnly = effectiveRole === "viewer" || effectiveRole === "fiscal_petrobras";
  const canExport = isAdmin || effectiveRole === "fiscal_petrobras";

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    isViewer: effectiveRole === "viewer",
    userRole: effectiveRole,
    realUserRole: user?.role as UserRole | undefined, // Expose real role for reference
    canEdit,
    isViewOnly,
    canExport,
    error,
    isDevRoleActive: isDevMode && !!devRole, // Flag to indicate dev role is in use
  };
}

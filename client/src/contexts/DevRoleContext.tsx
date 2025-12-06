import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/**
 * Development Role Context
 * 
 * This context provides a way to override the user's role during development
 * for testing purposes. The role switcher only appears and functions when
 * NODE_ENV === "development" (checked via import.meta.env.DEV in Vite).
 * 
 * HOW IT WORKS:
 * 1. The DevRoleProvider wraps the app and provides the dev role state
 * 2. The useDevRole hook gives access to the current dev role and setter
 * 3. The useAuth hook checks for a dev role override before using the real role
 * 4. API requests include a X-Dev-Role header when a dev role is active
 * 5. Backend middleware checks for this header in development mode only
 * 
 * TO DISABLE:
 * - Set devRole to null in the context
 * - Or simply deploy to production (the switcher won't appear)
 */

export type DevRole = "admin" | "fiscal" | "operador" | "visualizador" | null;

interface DevRoleContextType {
  devRole: DevRole;
  setDevRole: (role: DevRole) => void;
  isDevMode: boolean;
  clearDevRole: () => void;
}

const DevRoleContext = createContext<DevRoleContextType | undefined>(undefined);

interface DevRoleProviderProps {
  children: ReactNode;
}

export function DevRoleProvider({ children }: DevRoleProviderProps) {
  // Check if we're in development mode using Vite's env variable
  const isDevMode = import.meta.env.DEV;
  
  // Initialize from localStorage to persist across page refreshes (dev only)
  const [devRole, setDevRoleState] = useState<DevRole>(() => {
    if (!isDevMode) return null;
    const stored = localStorage.getItem("dev-role-override");
    if (stored && ["admin", "fiscal", "operador", "visualizador"].includes(stored)) {
      return stored as DevRole;
    }
    return null;
  });

  const setDevRole = useCallback((role: DevRole) => {
    if (!isDevMode) return;
    setDevRoleState(role);
    if (role) {
      localStorage.setItem("dev-role-override", role);
    } else {
      localStorage.removeItem("dev-role-override");
    }
  }, [isDevMode]);

  const clearDevRole = useCallback(() => {
    setDevRole(null);
  }, [setDevRole]);

  return (
    <DevRoleContext.Provider value={{ devRole, setDevRole, isDevMode, clearDevRole }}>
      {children}
    </DevRoleContext.Provider>
  );
}

export function useDevRole() {
  const context = useContext(DevRoleContext);
  if (context === undefined) {
    throw new Error("useDevRole must be used within a DevRoleProvider");
  }
  return context;
}

/**
 * Maps development role names to the actual database role values.
 * This allows using simplified role names in the switcher UI.
 */
export function mapDevRoleToUserRole(devRole: DevRole): string | null {
  if (!devRole) return null;
  
  const roleMap: Record<string, string> = {
    "admin": "admin",
    "fiscal": "fiscal_petrobras",
    "operador": "operator_dica",
    "visualizador": "viewer",
  };
  
  return roleMap[devRole] || null;
}

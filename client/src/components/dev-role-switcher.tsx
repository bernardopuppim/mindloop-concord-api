import { useDevRole, type DevRole } from "@/contexts/DevRoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bug, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Development Role Switcher Component
 * 
 * A floating UI panel that appears in the bottom-right corner of the screen
 * ONLY in development mode. It allows developers to quickly switch between
 * different user roles to test role-based access control without logging
 * out or modifying the database.
 * 
 * IMPORTANT: This component only renders when import.meta.env.DEV is true
 * (i.e., NODE_ENV !== "production"). In production builds, this component
 * returns null and has zero impact on the application.
 * 
 * ROLES:
 * - admin: Full administrative access (maps to "admin" role)
 * - fiscal: Fiscal Petrobras role with export permissions (maps to "fiscal_petrobras")
 * - operador: Operator role with edit permissions (maps to "operator_dica")
 * - visualizador: Read-only viewer role (maps to "viewer")
 * 
 * TO DISABLE THIS FEATURE:
 * 1. Remove this component from App.tsx, or
 * 2. Simply deploy to production - it won't appear
 */

const ROLE_OPTIONS: { value: DevRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Acesso total" },
  { value: "fiscal", label: "Fiscal", description: "Visualizar + Exportar" },
  { value: "operador", label: "Operador", description: "Visualizar + Editar" },
  { value: "visualizador", label: "Visualizador", description: "Apenas visualizar" },
];

export function DevRoleSwitcher() {
  const { devRole, setDevRole, isDevMode, clearDevRole } = useDevRole();

  // Only render in development mode
  if (!isDevMode) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-md p-3 shadow-lg max-w-[220px]"
      data-testid="dev-role-switcher"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Bug className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium text-muted-foreground">Dev Mode</span>
        </div>
        {devRole && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={clearDevRole}
            title="Clear role override"
            data-testid="button-clear-dev-role"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <Select
        value={devRole || ""}
        onValueChange={(value) => setDevRole(value as DevRole)}
      >
        <SelectTrigger 
          className="h-8 text-xs"
          data-testid="select-dev-role"
        >
          <SelectValue placeholder="Usar role real" />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((option) => (
            <SelectItem 
              key={option.value!} 
              value={option.value!}
              data-testid={`option-role-${option.value}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground text-xs">({option.description})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {devRole && (
        <div className="mt-2 flex items-center gap-1">
          <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">
            Override: {devRole}
          </Badge>
        </div>
      )}
      
      <p className="text-[10px] text-muted-foreground mt-2">
        Role override ativo apenas em dev
      </p>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Download, ChevronDown, ChevronRight, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";
import { formatDateTime } from "@/lib/authUtils";
import type { User, AuditLog } from "@shared/schema";

type AuditLogWithUser = AuditLog & { user?: User | null };

const entityTypeLabels: Record<string, string> = {
  employee: "Funcionário",
  service_post: "Posto de Serviço",
  allocation: "Alocação",
  occurrence: "Ocorrência",
  document: "Documento",
  user: "Usuário",
  notification_settings: "Configurações de Notificação",
  alert: "Alerta",
};

const actionLabels: Record<string, string> = {
  create: "Criar",
  update: "Atualizar",
  delete: "Excluir",
  bulk_copy: "Copiar em Lote",
  bulk_import: "Importar em Lote",
  send_notification: "Enviar Notificação",
  mark_treated: "Marcar Tratada",
  resolve: "Resolver",
  CREATE: "Criar",
  UPDATE: "Atualizar",
  DELETE: "Excluir",
};

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  const upperAction = action.toUpperCase();
  if (upperAction === "CREATE") return "default";
  if (upperAction === "UPDATE") return "secondary";
  if (upperAction === "DELETE") return "destructive";
  return "outline";
}

function DiffViewer({ title, data }: { title: string; data: Record<string, unknown> | null | undefined }) {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Sem dados
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-64 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLogWithUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasDiff = log.diffBefore || log.diffAfter;
  
  const userName = log.user 
    ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email || "Usuário"
    : "Sistema";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="cursor-pointer" data-testid={`row-audit-${log.id}`}>
        <TableCell>
          {hasDiff ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-expand-${log.id}`}>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}
        </TableCell>
        <TableCell className="text-sm" data-testid={`text-timestamp-${log.id}`}>
          {log.timestamp ? formatDateTime(log.timestamp) : "-"}
        </TableCell>
        <TableCell className="text-sm" data-testid={`text-user-${log.id}`}>
          {userName}
        </TableCell>
        <TableCell data-testid={`badge-action-${log.id}`}>
          <Badge variant={getActionBadgeVariant(log.action)}>
            {actionLabels[log.action] || actionLabels[log.action.toUpperCase()] || log.action}
          </Badge>
        </TableCell>
        <TableCell className="text-sm" data-testid={`text-entity-${log.id}`}>
          {entityTypeLabels[log.entityType] || log.entityType}
        </TableCell>
        <TableCell className="text-sm font-mono" data-testid={`text-entityid-${log.id}`}>
          {log.entityId || "-"}
        </TableCell>
      </TableRow>
      {hasDiff && (
        <CollapsibleContent asChild>
          <TableRow className="bg-muted/30">
            <TableCell colSpan={6} className="py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <DiffViewer title="Antes da alteração" data={log.diffBefore as Record<string, unknown> | null} />
                <DiffViewer title="Depois da alteração" data={log.diffAfter as Record<string, unknown> | null} />
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export default function AuditoriaPage() {
  const { isAdmin } = useAuth();
  
  const [filters, setFilters] = useState({
    userId: "",
    entityType: "",
    action: "",
    startDate: "",
    endDate: "",
  });
  const [activeFilters, setActiveFilters] = useState(filters);
  const [limit, setLimit] = useState("100");

  const queryParams = new URLSearchParams();
  if (activeFilters.userId) queryParams.set("userId", activeFilters.userId);
  if (activeFilters.entityType) queryParams.set("entityType", activeFilters.entityType);
  if (activeFilters.action) queryParams.set("action", activeFilters.action);
  if (activeFilters.startDate) queryParams.set("startDate", activeFilters.startDate);
  if (activeFilters.endDate) queryParams.set("endDate", activeFilters.endDate);
  if (limit) queryParams.set("limit", limit);

  const { data: logs, isLoading: logsLoading } = useQuery<AuditLogWithUser[]>({
    queryKey: ["/api/admin/audit-logs", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
    enabled: isAdmin,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const { data: entityTypes } = useQuery<string[]>({
    queryKey: ["/api/admin/audit-logs/entity-types"],
    queryFn: async () => {
      const response = await fetch("/api/admin/audit-logs/entity-types", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch entity types");
      return response.json();
    },
    enabled: isAdmin,
  });

  const { data: actions } = useQuery<string[]>({
    queryKey: ["/api/admin/audit-logs/actions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/audit-logs/actions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch actions");
      return response.json();
    },
    enabled: isAdmin,
  });

  const handleApplyFilters = () => {
    setActiveFilters(filters);
  };

  const handleClearFilters = () => {
    const cleared = { userId: "", entityType: "", action: "", startDate: "", endDate: "" };
    setFilters(cleared);
    setActiveFilters(cleared);
  };

  const handleExportCsv = () => {
    const exportParams = new URLSearchParams();
    if (activeFilters.userId) exportParams.set("userId", activeFilters.userId);
    if (activeFilters.entityType) exportParams.set("entityType", activeFilters.entityType);
    if (activeFilters.action) exportParams.set("action", activeFilters.action);
    if (activeFilters.startDate) exportParams.set("startDate", activeFilters.startDate);
    if (activeFilters.endDate) exportParams.set("endDate", activeFilters.endDate);
    
    window.open(`/api/admin/audit-logs/export?${exportParams.toString()}`, "_blank");
  };

  if (!isAdmin) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Auditoria" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Acesso Negado</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Auditoria"
        description="Histórico completo de alterações no sistema"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>Refine a busca por logs de auditoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="filter-user">Usuário</Label>
              <Select
                value={filters.userId || "_all"}
                onValueChange={(value) => setFilters({ ...filters, userId: value === "_all" ? "" : value })}
              >
                <SelectTrigger id="filter-user" data-testid="select-filter-user">
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos os usuários</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-entity">Tipo de Entidade</Label>
              <Select
                value={filters.entityType || "_all"}
                onValueChange={(value) => setFilters({ ...filters, entityType: value === "_all" ? "" : value })}
              >
                <SelectTrigger id="filter-entity" data-testid="select-filter-entity">
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas as entidades</SelectItem>
                  {entityTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {entityTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-action">Ação</Label>
              <Select
                value={filters.action || "_all"}
                onValueChange={(value) => setFilters({ ...filters, action: value === "_all" ? "" : value })}
              >
                <SelectTrigger id="filter-action" data-testid="select-filter-action">
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas as ações</SelectItem>
                  {actions?.map((action) => (
                    <SelectItem key={action} value={action}>
                      {actionLabels[action] || actionLabels[action.toUpperCase()] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-start-date">Data Inicial</Label>
              <Input
                id="filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                data-testid="input-filter-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-end-date">Data Final</Label>
              <Input
                id="filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                data-testid="input-filter-end-date"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button onClick={handleApplyFilters} data-testid="button-apply-filters">
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={handleClearFilters} data-testid="button-clear-filters">
              Limpar Filtros
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Label htmlFor="limit" className="text-sm text-muted-foreground">Limite:</Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger id="limit" className="w-24" data-testid="select-limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExportCsv} data-testid="button-export-csv">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registros de Auditoria
          </CardTitle>
          <CardDescription>
            {logs?.length !== undefined ? `${logs.length} registros encontrados` : "Carregando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs?.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum registro de auditoria encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID da Entidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <AuditLogRow key={log.id} log={log} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

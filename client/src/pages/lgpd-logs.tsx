import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Download, Filter, Search, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/authUtils";
import type { User, LgpdLog } from "@shared/schema";

type LgpdLogWithUser = LgpdLog & { user?: User | null };

const accessTypeLabels: Record<string, string> = {
  view: "Visualização",
  export: "Exportação",
  search: "Busca",
};

const dataCategoryLabels: Record<string, string> = {
  personal_data: "Dados Pessoais",
  sensitive_data: "Dados Sensíveis",
  financial_data: "Dados Financeiros",
};

const entityTypeLabels: Record<string, string> = {
  employee: "Funcionário",
  employees_list: "Lista de Funcionários",
  employees_search: "Busca de Funcionários",
};

function getAccessTypeBadgeVariant(accessType: string): "default" | "secondary" | "destructive" | "outline" {
  if (accessType === "view") return "default";
  if (accessType === "export") return "destructive";
  if (accessType === "search") return "secondary";
  return "outline";
}

function getDataCategoryBadgeVariant(category: string): "default" | "secondary" | "destructive" | "outline" {
  if (category === "personal_data") return "default";
  if (category === "sensitive_data") return "destructive";
  if (category === "financial_data") return "secondary";
  return "outline";
}

export default function LgpdLogsPage() {
  const { isAdmin } = useAuth();
  
  const [filters, setFilters] = useState({
    userId: "",
    accessType: "",
    dataCategory: "",
    entityType: "",
    startDate: "",
    endDate: "",
  });
  const [activeFilters, setActiveFilters] = useState(filters);
  const [limit, setLimit] = useState("100");

  const queryParams = new URLSearchParams();
  if (activeFilters.userId) queryParams.set("userId", activeFilters.userId);
  if (activeFilters.accessType) queryParams.set("accessType", activeFilters.accessType);
  if (activeFilters.dataCategory) queryParams.set("dataCategory", activeFilters.dataCategory);
  if (activeFilters.entityType) queryParams.set("entityType", activeFilters.entityType);
  if (activeFilters.startDate) queryParams.set("startDate", activeFilters.startDate);
  if (activeFilters.endDate) queryParams.set("endDate", activeFilters.endDate);
  if (limit) queryParams.set("limit", limit);

  const { data: logs, isLoading: logsLoading } = useQuery<LgpdLogWithUser[]>({
    queryKey: ["/api/admin/lgpd-logs", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/admin/lgpd-logs?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch LGPD logs");
      return response.json();
    },
    enabled: isAdmin,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const { data: accessTypes } = useQuery<string[]>({
    queryKey: ["/api/admin/lgpd-logs/access-types"],
    queryFn: async () => {
      const response = await fetch("/api/admin/lgpd-logs/access-types", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch access types");
      return response.json();
    },
    enabled: isAdmin,
  });

  const { data: dataCategories } = useQuery<string[]>({
    queryKey: ["/api/admin/lgpd-logs/data-categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/lgpd-logs/data-categories", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch data categories");
      return response.json();
    },
    enabled: isAdmin,
  });

  const { data: entityTypes } = useQuery<string[]>({
    queryKey: ["/api/admin/lgpd-logs/entity-types"],
    queryFn: async () => {
      const response = await fetch("/api/admin/lgpd-logs/entity-types", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch entity types");
      return response.json();
    },
    enabled: isAdmin,
  });

  const handleApplyFilters = () => {
    setActiveFilters(filters);
  };

  const handleClearFilters = () => {
    const cleared = { userId: "", accessType: "", dataCategory: "", entityType: "", startDate: "", endDate: "" };
    setFilters(cleared);
    setActiveFilters(cleared);
  };

  const handleExportCsv = () => {
    const exportParams = new URLSearchParams();
    if (activeFilters.userId) exportParams.set("userId", activeFilters.userId);
    if (activeFilters.accessType) exportParams.set("accessType", activeFilters.accessType);
    if (activeFilters.dataCategory) exportParams.set("dataCategory", activeFilters.dataCategory);
    if (activeFilters.entityType) exportParams.set("entityType", activeFilters.entityType);
    if (activeFilters.startDate) exportParams.set("startDate", activeFilters.startDate);
    if (activeFilters.endDate) exportParams.set("endDate", activeFilters.endDate);
    
    window.open(`/api/admin/lgpd-logs/export?${exportParams.toString()}`, "_blank");
  };

  if (!isAdmin) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Logs LGPD" />
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
        title="Logs LGPD"
        description="Registro de acessos a dados pessoais conforme Lei Geral de Proteção de Dados"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>Refine a busca por registros de acesso a dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
              <Label htmlFor="filter-access-type">Tipo de Acesso</Label>
              <Select
                value={filters.accessType || "_all"}
                onValueChange={(value) => setFilters({ ...filters, accessType: value === "_all" ? "" : value })}
              >
                <SelectTrigger id="filter-access-type" data-testid="select-filter-access-type">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos os tipos</SelectItem>
                  {accessTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {accessTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-data-category">Categoria de Dados</Label>
              <Select
                value={filters.dataCategory || "_all"}
                onValueChange={(value) => setFilters({ ...filters, dataCategory: value === "_all" ? "" : value })}
              >
                <SelectTrigger id="filter-data-category" data-testid="select-filter-data-category">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas as categorias</SelectItem>
                  {dataCategories?.map((category) => (
                    <SelectItem key={category} value={category}>
                      {dataCategoryLabels[category] || category}
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
            <Eye className="h-5 w-5" />
            Registros de Acesso LGPD
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
              <p className="text-muted-foreground">Nenhum registro de acesso LGPD encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo de Acesso</TableHead>
                    <TableHead>Categoria de Dados</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID da Entidade</TableHead>
                    <TableHead>Endereço IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => {
                    const userName = log.user 
                      ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email || "Usuário"
                      : "Sistema";
                    
                    return (
                      <TableRow key={log.id} data-testid={`row-lgpd-${log.id}`}>
                        <TableCell className="text-sm" data-testid={`text-timestamp-${log.id}`}>
                          {log.timestamp ? formatDateTime(log.timestamp) : "-"}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-user-${log.id}`}>
                          {userName}
                        </TableCell>
                        <TableCell data-testid={`badge-access-type-${log.id}`}>
                          <Badge variant={getAccessTypeBadgeVariant(log.accessType)}>
                            {accessTypeLabels[log.accessType] || log.accessType}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`badge-data-category-${log.id}`}>
                          <Badge variant={getDataCategoryBadgeVariant(log.dataCategory)}>
                            {dataCategoryLabels[log.dataCategory] || log.dataCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-entity-${log.id}`}>
                          {entityTypeLabels[log.entityType] || log.entityType}
                        </TableCell>
                        <TableCell className="text-sm font-mono" data-testid={`text-entityid-${log.id}`}>
                          {log.entityId || "-"}
                        </TableCell>
                        <TableCell className="text-sm font-mono" data-testid={`text-ip-${log.id}`}>
                          {log.ipAddress || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

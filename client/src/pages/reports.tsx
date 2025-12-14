import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, FileSpreadsheet, Calendar, AlertCircle, FileText, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, CategoryBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getMonthYearOptions, formatDate } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import type { Allocation, Occurrence, Document, Employee, ServicePost } from "@shared/types";

type PrevistoRealizadoReport = {
  summary: { totalPrevisto: number; totalRealizado: number; compliancePercentage: number };
  byPost: Array<{
    postId: number;
    postCode: string;
    postName: string;
    previsto: number;
    realizado: number;
    compliance: number;
  }>;
  byDate: Array<{
    date: string;
    previsto: number;
    realizado: number;
  }>;
};

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedPostId, setSelectedPostId] = useState<string>("all");
  const monthYearOptions = getMonthYearOptions();

  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: servicePosts } = useQuery<ServicePost[]>({ queryKey: ["/api/service-posts"] });
  const { data: allocations, isLoading: allocationsLoading } = useQuery<Allocation[]>({ queryKey: ["/api/allocations"] });
  const { data: occurrences, isLoading: occurrencesLoading } = useQuery<Occurrence[]>({ queryKey: ["/api/occurrences"] });
  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({ queryKey: ["/api/documents"] });

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const startDateStr = format(monthStart, "yyyy-MM-dd");
  const endDateStr = format(monthEnd, "yyyy-MM-dd");

  const { data: previstoRealizadoReport, isLoading: previstoLoading } = useQuery<PrevistoRealizadoReport>({
    queryKey: ["/api/reports/previsto-realizado", startDateStr, endDateStr, selectedPostId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDateStr,
        endDate: endDateStr,
      });
      if (selectedPostId !== "all") {
        params.append("postId", selectedPostId);
      }
      const res = await fetch(`/api/reports/previsto-realizado?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
  });

  const employeeMap = new Map(employees?.map(e => [e.id, e]) || []);
  const postMap = new Map(servicePosts?.map(p => [p.id, p]) || []);

  const filteredAllocations = allocations?.filter(a => {
    const d = new Date(a.date);
    return d >= monthStart && d <= monthEnd;
  }) || [];

  const filteredOccurrences = occurrences?.filter(o => {
    const d = new Date(o.date);
    return d >= monthStart && d <= monthEnd;
  }) || [];

  const downloadAllocationCSV = () => {
    const headers = ["Data", "Funcionário", "Posto de Serviço", "Status", "Observações"];
    const rows = filteredAllocations.map(a => [
      a.date,
      employeeMap.get(a.employeeId)?.name || "",
      postMap.get(a.postId)?.postName || "",
      a.status,
      a.notes || "",
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alocacoes-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadOccurrenceCSV = () => {
    const headers = ["Data", "Categoria", "Funcionário", "Descrição"];
    const rows = filteredOccurrences.map(o => [
      o.date,
      o.category,
      o.employeeId ? (employeeMap.get(o.employeeId)?.name || "") : "",
      o.description,
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocorrencias-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={translations.reports.title}
        description={translations.reports.description}
      />

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Período:</span>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]" data-testid="select-report-month">
            <SelectValue placeholder={translations.reports.selectMonth} />
          </SelectTrigger>
          <SelectContent>
            {monthYearOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="allocations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocations" data-testid="tab-allocations">
            <Calendar className="h-4 w-4 mr-2" />
            {translations.nav.allocation}
          </TabsTrigger>
          <TabsTrigger value="occurrences" data-testid="tab-occurrences">
            <AlertCircle className="h-4 w-4 mr-2" />
            {translations.nav.occurrences}
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FileText className="h-4 w-4 mr-2" />
            {translations.nav.documents}
          </TabsTrigger>
          <TabsTrigger value="previsto-realizado" data-testid="tab-previsto-realizado">
            <BarChart3 className="h-4 w-4 mr-2" />
            Previsto x Realizado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allocations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{translations.reports.dailyAllocation}</CardTitle>
                <CardDescription>
                  {filteredAllocations.length} registros de alocação para {format(monthStart, "MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={downloadAllocationCSV} data-testid="button-download-allocations">
                <Download className="h-4 w-4 mr-2" />
                {translations.reports.exportCsv}
              </Button>
            </CardHeader>
            <CardContent>
              {allocationsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredAllocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{translations.allocation.noAllocationsInMonth}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{translations.common.date}</TableHead>
                        <TableHead>{translations.occurrences.employee}</TableHead>
                        <TableHead>{translations.nav.servicePosts}</TableHead>
                        <TableHead>{translations.common.status}</TableHead>
                        <TableHead>{translations.allocation.notes}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAllocations.slice(0, 50).map((allocation) => (
                        <TableRow key={allocation.id}>
                          <TableCell>{formatDate(allocation.date)}</TableCell>
                          <TableCell>{employeeMap.get(allocation.employeeId)?.name || "-"}</TableCell>
                          <TableCell>{postMap.get(allocation.postId)?.postName || "-"}</TableCell>
                          <TableCell><StatusBadge status={allocation.status} /></TableCell>
                          <TableCell className="max-w-[200px] truncate">{allocation.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredAllocations.length > 50 && (
                    <p className="text-sm text-muted-foreground mt-2">Mostrando 50 de {filteredAllocations.length} registros. Exporte o CSV para dados completos.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occurrences">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{translations.reports.occurrencesList}</CardTitle>
                <CardDescription>
                  {filteredOccurrences.length} ocorrências para {format(monthStart, "MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={downloadOccurrenceCSV} data-testid="button-download-occurrences">
                <Download className="h-4 w-4 mr-2" />
                {translations.reports.exportCsv}
              </Button>
            </CardHeader>
            <CardContent>
              {occurrencesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredOccurrences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{translations.occurrences.noOccurrences}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{translations.common.date}</TableHead>
                        <TableHead>{translations.occurrences.category}</TableHead>
                        <TableHead>{translations.occurrences.employee}</TableHead>
                        <TableHead>{translations.common.description}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOccurrences.map((occurrence) => (
                        <TableRow key={occurrence.id}>
                          <TableCell>{formatDate(occurrence.date)}</TableCell>
                          <TableCell><CategoryBadge category={occurrence.category} /></TableCell>
                          <TableCell>{occurrence.employeeId ? employeeMap.get(occurrence.employeeId)?.name : "-"}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{occurrence.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>{translations.reports.documentsSent}</CardTitle>
              <CardDescription>Resumo de todos os documentos enviados</CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-semibold">{documents?.filter(d => d.documentType === "aso").length || 0}</div>
                      <div className="text-sm text-muted-foreground">{translations.documents.aso}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-semibold">{documents?.filter(d => d.documentType === "certification").length || 0}</div>
                      <div className="text-sm text-muted-foreground">{translations.documents.certification}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-semibold">{documents?.filter(d => d.documentType === "evidence").length || 0}</div>
                      <div className="text-sm text-muted-foreground">{translations.documents.evidence}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-semibold">{documents?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Total de Documentos</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previsto-realizado">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted-foreground">Filtrar por Posto:</span>
              <Select value={selectedPostId} onValueChange={setSelectedPostId}>
                <SelectTrigger className="w-[250px]" data-testid="select-post-filter">
                  <SelectValue placeholder="Todos os Postos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Postos</SelectItem>
                  {servicePosts?.map((post) => (
                    <SelectItem key={post.id} value={post.id.toString()}>
                      {post.postCode} - {post.postName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Previsto</span>
                  </div>
                  <div className="text-3xl font-bold mt-2" data-testid="text-total-previsto">
                    {previstoLoading ? <Skeleton className="h-9 w-20" /> : previstoRealizadoReport?.summary.totalPrevisto || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">alocações planejadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Realizado</span>
                  </div>
                  <div className="text-3xl font-bold mt-2" data-testid="text-total-realizado">
                    {previstoLoading ? <Skeleton className="h-9 w-20" /> : previstoRealizadoReport?.summary.totalRealizado || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">presenças confirmadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Taxa de Cumprimento</span>
                  </div>
                  <div className="text-3xl font-bold mt-2" data-testid="text-compliance-rate">
                    {previstoLoading ? <Skeleton className="h-9 w-20" /> : (
                      <span className={
                        (previstoRealizadoReport?.summary.compliancePercentage || 0) >= 90 ? "text-green-600 dark:text-green-400" :
                        (previstoRealizadoReport?.summary.compliancePercentage || 0) >= 70 ? "text-yellow-600 dark:text-yellow-400" :
                        "text-red-600 dark:text-red-400"
                      }>
                        {previstoRealizadoReport?.summary.compliancePercentage || 0}%
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">realizado / previsto</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Comparativo por Posto de Serviço</CardTitle>
                <CardDescription>Previstos vs Realizados para {format(monthStart, "MMMM 'de' yyyy", { locale: ptBR })}</CardDescription>
              </CardHeader>
              <CardContent>
                {previstoLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : !previstoRealizadoReport?.byPost.length ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum dado disponível para o período selecionado</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={previstoRealizadoReport.byPost} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="postCode" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis className="fill-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                      <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="realizado" name="Realizado" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução Diária</CardTitle>
                <CardDescription>Tendência de presenças ao longo do mês</CardDescription>
              </CardHeader>
              <CardContent>
                {previstoLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : !previstoRealizadoReport?.byDate.length ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum dado disponível para o período selecionado</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={previstoRealizadoReport.byDate} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => format(new Date(value), "dd/MM")}
                        className="fill-muted-foreground"
                      />
                      <YAxis className="fill-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        labelFormatter={(value) => format(new Date(value), "dd/MM/yyyy")}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="previsto" name="Previsto" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="realizado" name="Realizado" stroke="hsl(142.1 76.2% 36.3%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Posto</CardTitle>
                <CardDescription>Dados completos de previsto vs realizado</CardDescription>
              </CardHeader>
              <CardContent>
                {previstoLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !previstoRealizadoReport?.byPost.length ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum dado disponível para o período selecionado</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Posto de Serviço</TableHead>
                          <TableHead className="text-right">Previsto</TableHead>
                          <TableHead className="text-right">Realizado</TableHead>
                          <TableHead className="text-right">Diferença</TableHead>
                          <TableHead className="text-right">Cumprimento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previstoRealizadoReport.byPost.map((row) => (
                          <TableRow key={row.postId} data-testid={`row-post-${row.postId}`}>
                            <TableCell className="font-medium">{row.postCode}</TableCell>
                            <TableCell>{row.postName}</TableCell>
                            <TableCell className="text-right">{row.previsto}</TableCell>
                            <TableCell className="text-right">{row.realizado}</TableCell>
                            <TableCell className="text-right">
                              <span className={row.realizado - row.previsto >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                {row.realizado - row.previsto >= 0 ? "+" : ""}{row.realizado - row.previsto}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={row.compliance >= 90 ? "default" : row.compliance >= 70 ? "secondary" : "destructive"}>
                                {row.compliance}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

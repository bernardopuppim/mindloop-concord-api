import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Download, Trash2, Search, Filter, FileText, Image, File, Eye, X, AlertTriangle, Clock, Calendar, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { DocTypeBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import type { Document, Employee, ServicePost } from "@shared/schema";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

function getExpirationStatus(expirationDate: string | null): { status: "expired" | "expiring" | "valid" | "none"; daysLeft: number | null } {
  if (!expirationDate) return { status: "none", daysLeft: null };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  
  const diffTime = expDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= 30) return { status: "expiring", daysLeft };
  return { status: "valid", daysLeft };
}

function ExpirationBadge({ expirationDate }: { expirationDate: string | null }) {
  const { status, daysLeft } = getExpirationStatus(expirationDate);
  
  if (status === "none") return null;
  
  if (status === "expired") {
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <AlertTriangle className="h-3 w-3" />
        {translations.documents.expired}
      </Badge>
    );
  }
  
  if (status === "expiring") {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-yellow-500 text-yellow-600 dark:text-yellow-400">
        <Clock className="h-3 w-3" />
        {daysLeft === 0 ? translations.common.today : `${daysLeft}d`}
      </Badge>
    );
  }
  
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <Calendar className="h-3 w-3" />
      {expirationDate ? formatDate(expirationDate) : "-"}
    </span>
  );
}

export default function DocumentsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [postFilter, setPostFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [versionHistoryDocId, setVersionHistoryDocId] = useState<number | null>(null);

  const { data: documentVersions, isLoading: isLoadingVersions } = useQuery<Document[]>({
    queryKey: ["/api/documents", versionHistoryDocId, "versions"],
    queryFn: async () => {
      if (!versionHistoryDocId) return [];
      const res = await fetch(`/api/documents/${versionHistoryDocId}/versions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json();
    },
    enabled: !!versionHistoryDocId,
  });

  const params = new URLSearchParams(location.split("?")[1] || "");
  const employeeIdParam = params.get("employeeId");
  const postIdParam = params.get("postId");

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: expiringDocuments, isLoading: isLoadingExpiring } = useQuery<Document[]>({
    queryKey: ["/api/documents/expiring"],
  });

  const { data: expiredDocuments, isLoading: isLoadingExpired } = useQuery<Document[]>({
    queryKey: ["/api/documents/expired"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: servicePosts } = useQuery<ServicePost[]>({
    queryKey: ["/api/service-posts"],
  });

  const employeeMap = new Map(employees?.map(e => [e.id, e]) || []);
  const postMap = new Map(servicePosts?.map(p => [p.id, p]) || []);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/expiring"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/expired"] });
      toast({ title: translations.common.success, description: translations.documents.documentDeleted });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: translations.common.error, description: translations.errors.deleteError, variant: "destructive" });
    },
  });

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || doc.documentType === typeFilter;
    const matchesEmployeeUrl = !employeeIdParam || doc.employeeId?.toString() === employeeIdParam;
    const matchesPostUrl = !postIdParam || doc.postId?.toString() === postIdParam;
    const matchesEmployeeFilter = employeeFilter === "all" || doc.employeeId?.toString() === employeeFilter;
    const matchesPostFilter = postFilter === "all" || doc.postId?.toString() === postFilter;
    return matchesSearch && matchesType && matchesEmployeeUrl && matchesPostUrl && matchesEmployeeFilter && matchesPostFilter;
  }) || [];

  const activeFilters = [
    typeFilter !== "all" ? `${translations.common.type}: ${typeFilter}` : null,
    employeeFilter !== "all" ? `${translations.documents.employee}: ${employeeMap.get(Number(employeeFilter))?.name || employeeFilter}` : null,
    postFilter !== "all" ? `${translations.documents.post}: ${postMap.get(Number(postFilter))?.postName || postFilter}` : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setTypeFilter("all");
    setEmployeeFilter("all");
    setPostFilter("all");
  };

  const columns = [
    {
      key: "name",
      header: translations.documents.filename,
      cell: (doc: Document) => {
        const Icon = getFileIcon(doc.mimeType);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[200px]" data-testid={`text-doc-name-${doc.id}`}>
              {doc.originalName}
            </span>
          </div>
        );
      },
    },
    {
      key: "type",
      header: translations.common.type,
      cell: (doc: Document) => <DocTypeBadge type={doc.documentType} />,
    },
    {
      key: "linkedTo",
      header: translations.documents.linkedTo,
      cell: (doc: Document) => {
        if (doc.employeeId) {
          const employee = employeeMap.get(doc.employeeId);
          return <span className="text-sm">{employee?.name || `Funcionário #${doc.employeeId}`}</span>;
        }
        if (doc.postId) {
          const post = postMap.get(doc.postId);
          return <span className="text-sm">{post?.postName || `Posto #${doc.postId}`}</span>;
        }
        if (doc.monthYear) {
          return <span className="text-sm">{doc.monthYear}</span>;
        }
        return <span className="text-sm text-muted-foreground">{translations.documents.none}</span>;
      },
    },
    {
      key: "size",
      header: translations.documents.size,
      cell: (doc: Document) => (
        <span className="text-sm text-muted-foreground">
          {(doc.size / 1024).toFixed(1)} KB
        </span>
      ),
    },
    {
      key: "version",
      header: "Versão",
      cell: (doc: Document) => (
        <Badge variant="outline" className="text-xs">
          v{(doc as any).version || 1}
        </Badge>
      ),
    },
    {
      key: "expiration",
      header: translations.documents.expirationDate,
      cell: (doc: Document) => <ExpirationBadge expirationDate={(doc as any).expirationDate} />,
    },
    {
      key: "date",
      header: translations.documents.uploadedAt,
      cell: (doc: Document) => (
        <span className="text-sm text-muted-foreground">
          {doc.createdAt ? formatDate(doc.createdAt) : "N/A"}
        </span>
      ),
    },
    {
      key: "actions",
      header: translations.common.actions,
      className: "text-right",
      cell: (doc: Document) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild data-testid={`button-view-doc-${doc.id}`}>
            <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild data-testid={`button-download-doc-${doc.id}`}>
            <a href={`/api/documents/${doc.id}/download`} download>
              <Download className="h-4 w-4" />
            </a>
          </Button>
          {(doc as any).version > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVersionHistoryDocId(doc.id)}
              data-testid={`button-history-doc-${doc.id}`}
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(doc.id)}
              data-testid={`button-delete-doc-${doc.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const expiringCount = expiringDocuments?.length || 0;
  const expiredCount = expiredDocuments?.length || 0;

  const getTabData = () => {
    switch (activeTab) {
      case "expiring":
        return expiringDocuments || [];
      case "expired":
        return expiredDocuments || [];
      default:
        return filteredDocuments;
    }
  };

  const getTabLoading = () => {
    switch (activeTab) {
      case "expiring":
        return isLoadingExpiring;
      case "expired":
        return isLoadingExpired;
      default:
        return isLoading;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={translations.documents.title}
        description={translations.documents.description}
      >
        {isAdmin && (
          <Button onClick={() => setIsUploadOpen(true)} data-testid="button-upload-document">
            <Plus className="h-4 w-4 mr-2" />
            {translations.documents.uploadDocument}
          </Button>
        )}
      </PageHeader>

      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {expiredCount > 0 && (
            <Card className="flex-1 border-destructive/50">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{translations.documents.expiredDocuments}</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-expired-count">{expiredCount}</div>
                <p className="text-xs text-muted-foreground">
                  Documentos que requerem atenção imediata
                </p>
                <Button 
                  variant="ghost" 
                  className="p-0 h-auto text-xs mt-1 underline" 
                  onClick={() => setActiveTab("expired")}
                  data-testid="button-view-expired"
                >
                  Ver documentos vencidos
                </Button>
              </CardContent>
            </Card>
          )}
          {expiringCount > 0 && (
            <Card className="flex-1 border-yellow-500/50">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{translations.documents.expiringDocuments}</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-expiring-count">{expiringCount}</div>
                <p className="text-xs text-muted-foreground">
                  Documentos vencendo nos próximos 30 dias
                </p>
                <Button 
                  variant="ghost" 
                  className="p-0 h-auto text-xs mt-1 underline" 
                  onClick={() => setActiveTab("expiring")}
                  data-testid="button-view-expiring"
                >
                  Ver documentos vencendo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-document-status">
          <TabsTrigger value="all" data-testid="tab-all-documents">
            Todos os Documentos
          </TabsTrigger>
          <TabsTrigger value="expiring" data-testid="tab-expiring-documents">
            Vencendo em Breve
            {expiringCount > 0 && (
              <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400">
                {expiringCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired" data-testid="tab-expired-documents">
            Vencidos
            {expiredCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {expiredCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {activeTab === "all" && (
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={translations.documents.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-documents"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
                      <SelectValue placeholder={translations.common.type} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{translations.documents.allTypes}</SelectItem>
                      <SelectItem value="aso">{translations.documents.aso}</SelectItem>
                      <SelectItem value="certification">{translations.documents.certification}</SelectItem>
                      <SelectItem value="evidence">{translations.documents.evidence}</SelectItem>
                      <SelectItem value="contract">{translations.documents.contract}</SelectItem>
                      <SelectItem value="other">{translations.documents.other}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-employee-filter">
                      <SelectValue placeholder={translations.documents.employee} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{translations.documents.allEmployees}</SelectItem>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={postFilter} onValueChange={setPostFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-post-filter">
                      <SelectValue placeholder={translations.documents.post} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{translations.documents.allPosts}</SelectItem>
                      {servicePosts?.map((post) => (
                        <SelectItem key={post.id} value={post.id.toString()}>{post.postCode} - {post.postName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {activeFilters.map((filter) => (
                    <Badge key={filter} variant="secondary" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2" data-testid="button-clear-filters">
                    <X className="h-3 w-3 mr-1" />
                    {translations.common.clearFilters}
                  </Button>
                </div>
              )}
            </div>
          )}

          <DataTable
            columns={columns}
            data={getTabData()}
            isLoading={getTabLoading()}
            emptyMessage={activeTab === "all" ? translations.documents.noDocuments : activeTab === "expiring" ? "Nenhum documento vencendo em breve" : "Nenhum documento vencido"}
            emptyDescription={activeTab === "all" ? "Envie documentos para armazenar evidências e certificações." : activeTab === "expiring" ? "Todos os documentos estão em dia." : "Nenhum documento expirou."}
            testIdPrefix="documents"
          />
        </TabsContent>
      </Tabs>

      <DocumentUploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        employees={employees || []}
        servicePosts={servicePosts || []}
      />

      <Dialog open={versionHistoryDocId !== null} onOpenChange={(open) => !open && setVersionHistoryDocId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
            <DialogDescription>Versões anteriores deste documento</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoadingVersions ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : documentVersions?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Nenhuma versão anterior</div>
            ) : (
              documentVersions?.map((ver) => (
                <div key={ver.id} className="flex items-center justify-between gap-2 p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">v{(ver as any).version}</Badge>
                    <div>
                      <div className="font-medium text-sm">{ver.originalName}</div>
                      <div className="text-xs text-muted-foreground">{ver.createdAt ? formatDate(ver.createdAt) : "N/A"}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`/api/documents/${ver.id}/download`} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={translations.documents.deleteDocument}
        description={translations.documents.deleteConfirm}
        confirmText={translations.common.delete}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

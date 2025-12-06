import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Download, Trash2, Search, Filter, FileText, Image, File, Eye, X, AlertTriangle, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { DocTypeBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/authUtils";
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
        Expired
      </Badge>
    );
  }
  
  if (status === "expiring") {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-yellow-500 text-yellow-600 dark:text-yellow-400">
        <Clock className="h-3 w-3" />
        {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
      </Badge>
    );
  }
  
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <Calendar className="h-3 w-3" />
      {formatDate(expirationDate)}
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
      toast({ title: "Success", description: "Document deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
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
    typeFilter !== "all" ? `Type: ${typeFilter}` : null,
    employeeFilter !== "all" ? `Employee: ${employeeMap.get(Number(employeeFilter))?.name || employeeFilter}` : null,
    postFilter !== "all" ? `Post: ${postMap.get(Number(postFilter))?.postName || postFilter}` : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setTypeFilter("all");
    setEmployeeFilter("all");
    setPostFilter("all");
  };

  const columns = [
    {
      key: "name",
      header: "File Name",
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
      header: "Type",
      cell: (doc: Document) => <DocTypeBadge type={doc.documentType} />,
    },
    {
      key: "linkedTo",
      header: "Linked To",
      cell: (doc: Document) => {
        if (doc.employeeId) {
          const employee = employeeMap.get(doc.employeeId);
          return <span className="text-sm">{employee?.name || `Employee #${doc.employeeId}`}</span>;
        }
        if (doc.postId) {
          const post = postMap.get(doc.postId);
          return <span className="text-sm">{post?.postName || `Post #${doc.postId}`}</span>;
        }
        if (doc.monthYear) {
          return <span className="text-sm">{doc.monthYear}</span>;
        }
        return <span className="text-sm text-muted-foreground">None</span>;
      },
    },
    {
      key: "size",
      header: "Size",
      cell: (doc: Document) => (
        <span className="text-sm text-muted-foreground">
          {(doc.size / 1024).toFixed(1)} KB
        </span>
      ),
    },
    {
      key: "expiration",
      header: "Expiration",
      cell: (doc: Document) => <ExpirationBadge expirationDate={(doc as any).expirationDate} />,
    },
    {
      key: "date",
      header: "Uploaded",
      cell: (doc: Document) => (
        <span className="text-sm text-muted-foreground">
          {doc.createdAt ? formatDate(doc.createdAt) : "N/A"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
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
        title="Documents"
        description="Manage uploaded documents and evidence"
      >
        {isAdmin && (
          <Button onClick={() => setIsUploadOpen(true)} data-testid="button-upload-document">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </PageHeader>

      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {expiredCount > 0 && (
            <Card className="flex-1 border-destructive/50">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired Documents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-expired-count">{expiredCount}</div>
                <p className="text-xs text-muted-foreground">
                  Documents requiring immediate attention
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs mt-1" 
                  onClick={() => setActiveTab("expired")}
                  data-testid="button-view-expired"
                >
                  View expired documents
                </Button>
              </CardContent>
            </Card>
          )}
          {expiringCount > 0 && (
            <Card className="flex-1 border-yellow-500/50">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-expiring-count">{expiringCount}</div>
                <p className="text-xs text-muted-foreground">
                  Documents expiring within 30 days
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs mt-1" 
                  onClick={() => setActiveTab("expiring")}
                  data-testid="button-view-expiring"
                >
                  View expiring documents
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-document-status">
          <TabsTrigger value="all" data-testid="tab-all-documents">
            All Documents
          </TabsTrigger>
          <TabsTrigger value="expiring" data-testid="tab-expiring-documents">
            Expiring Soon
            {expiringCount > 0 && (
              <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400">
                {expiringCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired" data-testid="tab-expired-documents">
            Expired
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
                    placeholder="Search by filename..."
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
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="aso">ASO</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-employee-filter">
                      <SelectValue placeholder="Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={postFilter} onValueChange={setPostFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-post-filter">
                      <SelectValue placeholder="Service Post" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Posts</SelectItem>
                      {servicePosts?.map((post) => (
                        <SelectItem key={post.id} value={post.id.toString()}>{post.postCode} - {post.postName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {activeFilters.map((filter) => (
                    <Badge key={filter} variant="secondary" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2" data-testid="button-clear-filters">
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          )}

          <DataTable
            columns={columns}
            data={getTabData()}
            isLoading={getTabLoading()}
            emptyMessage={activeTab === "all" ? "No documents found" : activeTab === "expiring" ? "No documents expiring soon" : "No expired documents"}
            emptyDescription={activeTab === "all" ? "Upload documents to store evidence and certifications." : activeTab === "expiring" ? "All documents are up to date." : "No documents have expired."}
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

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

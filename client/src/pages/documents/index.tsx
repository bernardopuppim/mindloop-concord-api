import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Download, Trash2, Search, Filter, FileText, Image, File, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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

export default function DocumentsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const params = new URLSearchParams(location.split("?")[1] || "");
  const employeeIdParam = params.get("employeeId");
  const postIdParam = params.get("postId");

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
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
    const matchesEmployee = !employeeIdParam || doc.employeeId?.toString() === employeeIdParam;
    const matchesPost = !postIdParam || doc.postId?.toString() === postIdParam;
    return matchesSearch && matchesType && matchesEmployee && matchesPost;
  }) || [];

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
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
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
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredDocuments}
        isLoading={isLoading}
        emptyMessage="No documents found"
        emptyDescription="Upload documents to store evidence and certifications."
        testIdPrefix="documents"
      />

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

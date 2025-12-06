import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Eye, Pencil, Trash2, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { translations } from "@/lib/translations";
import type { ServicePost } from "@shared/schema";

export default function ServicePostsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: servicePosts, isLoading } = useQuery<ServicePost[]>({
    queryKey: ["/api/service-posts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/service-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-posts"] });
      toast({ title: translations.common.success, description: translations.servicePosts.postDeleted });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: translations.common.error, description: translations.errors.deleteError, variant: "destructive" });
    },
  });

  const uniqueUnits = useMemo(() => {
    const units = new Set<string>();
    servicePosts?.forEach(p => units.add(p.unit));
    return Array.from(units).sort();
  }, [servicePosts]);

  const filteredPosts = servicePosts?.filter((post) => {
    const matchesSearch = 
      post.postName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.postCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.unit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = modalityFilter === "all" || post.modality === modalityFilter;
    const matchesUnit = unitFilter === "all" || post.unit === unitFilter;
    return matchesSearch && matchesModality && matchesUnit;
  }) || [];

  const activeFilters = [
    modalityFilter !== "all" ? `${translations.servicePosts.modality}: ${modalityFilter === "onsite" ? translations.servicePosts.onsite : modalityFilter === "hybrid" ? translations.servicePosts.hybrid : translations.servicePosts.remote}` : null,
    unitFilter !== "all" ? `${translations.common.unit}: ${unitFilter}` : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setModalityFilter("all");
    setUnitFilter("all");
  };

  const columns = [
    {
      key: "postCode",
      header: translations.servicePosts.postCode,
      cell: (post: ServicePost) => (
        <span className="font-mono text-sm" data-testid={`text-post-code-${post.id}`}>
          {post.postCode}
        </span>
      ),
    },
    {
      key: "postName",
      header: translations.servicePosts.postName,
      cell: (post: ServicePost) => (
        <div className="font-medium" data-testid={`text-post-name-${post.id}`}>
          {post.postName}
        </div>
      ),
    },
    {
      key: "unit",
      header: translations.common.unit,
      cell: (post: ServicePost) => post.unit,
    },
    {
      key: "modality",
      header: translations.servicePosts.modality,
      cell: (post: ServicePost) => (
        <StatusBadge status={post.modality} />
      ),
    },
    {
      key: "actions",
      header: translations.common.actions,
      className: "text-right",
      cell: (post: ServicePost) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild data-testid={`button-view-post-${post.id}`}>
            <Link href={`/service-posts/${post.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon" asChild data-testid={`button-edit-post-${post.id}`}>
                <Link href={`/service-posts/${post.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(post.id)}
                data-testid={`button-delete-post-${post.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={translations.servicePosts.title}
        description={translations.servicePosts.pageDescription}
      >
        {isAdmin && (
          <Button asChild data-testid="button-add-post">
            <Link href="/service-posts/new">
              <Plus className="h-4 w-4 mr-2" />
              {translations.servicePosts.addPost}
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={translations.servicePosts.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-posts"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={modalityFilter} onValueChange={setModalityFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-modality-filter">
                <SelectValue placeholder={translations.servicePosts.modality} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.servicePosts.allModalities}</SelectItem>
                <SelectItem value="onsite">{translations.servicePosts.onsite}</SelectItem>
                <SelectItem value="hybrid">{translations.servicePosts.hybrid}</SelectItem>
                <SelectItem value="remote">{translations.servicePosts.remote}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-unit-filter">
                <SelectValue placeholder={translations.common.unit} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.servicePosts.allUnits}</SelectItem>
                {uniqueUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
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

      <DataTable
        columns={columns}
        data={filteredPosts}
        isLoading={isLoading}
        emptyMessage={translations.servicePosts.noPosts}
        emptyDescription="Comece adicionando seu primeiro posto de serviço."
        testIdPrefix="service-posts"
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={translations.servicePosts.deletePost}
        description={translations.servicePosts.deleteConfirm}
        confirmText={translations.common.delete}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

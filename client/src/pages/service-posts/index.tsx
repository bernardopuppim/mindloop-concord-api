import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ServicePost } from "@shared/schema";

export default function ServicePostsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
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
      toast({ title: "Success", description: "Service post deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete service post", variant: "destructive" });
    },
  });

  const filteredPosts = servicePosts?.filter(
    (post) =>
      post.postName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.postCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.unit.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const columns = [
    {
      key: "postCode",
      header: "Code",
      cell: (post: ServicePost) => (
        <span className="font-mono text-sm" data-testid={`text-post-code-${post.id}`}>
          {post.postCode}
        </span>
      ),
    },
    {
      key: "postName",
      header: "Name",
      cell: (post: ServicePost) => (
        <div className="font-medium" data-testid={`text-post-name-${post.id}`}>
          {post.postName}
        </div>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      cell: (post: ServicePost) => post.unit,
    },
    {
      key: "modality",
      header: "Modality",
      cell: (post: ServicePost) => (
        <StatusBadge status={post.modality} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
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
        title="Service Posts"
        description="Manage service posts from contract requirements"
      >
        {isAdmin && (
          <Button asChild data-testid="button-add-post">
            <Link href="/service-posts/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Service Post
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-posts"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredPosts}
        isLoading={isLoading}
        emptyMessage="No service posts found"
        emptyDescription="Get started by adding your first service post."
        testIdPrefix="service-posts"
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Service Post"
        description="Are you sure you want to delete this service post? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

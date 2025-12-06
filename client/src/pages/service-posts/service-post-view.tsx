import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Pencil, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import type { ServicePost, Allocation, Document } from "@shared/schema";

interface ServicePostViewProps {
  postId: number;
}

export default function ServicePostView({ postId }: ServicePostViewProps) {
  const { isAdmin } = useAuth();

  const { data: servicePost, isLoading } = useQuery<ServicePost>({
    queryKey: ["/api/service-posts", postId],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: allocations } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const postDocuments = documents?.filter(d => d.postId === postId) || [];
  const postAllocations = allocations?.filter(a => a.postId === postId).slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={translations.common.loading} />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!servicePost) {
    return (
      <div className="space-y-6">
        <PageHeader title="Posto de Serviço Não Encontrado" />
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">O posto de serviço solicitado não foi encontrado.</p>
            <Button asChild className="mt-4">
              <Link href="/service-posts">{translations.common.back} {translations.servicePosts.title}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={servicePost.postName}
        description="Detalhes e alocações do posto de serviço"
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href="/service-posts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.common.back}
          </Link>
        </Button>
        {isAdmin && (
          <Button asChild data-testid="button-edit">
            <Link href={`/service-posts/${postId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              {translations.common.edit}
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Posto de Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.postCode}</p>
                <p className="text-base font-mono" data-testid="text-post-code">{servicePost.postCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.modality}</p>
                <div className="mt-1">
                  <StatusBadge status={servicePost.modality} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.postName}</p>
                <p className="text-base" data-testid="text-post-name">{servicePost.postName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.common.unit}</p>
                <p className="text-base" data-testid="text-post-unit">{servicePost.unit}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">{translations.common.description}</p>
                <p className="text-base" data-testid="text-post-description">
                  {servicePost.description || "Nenhuma descrição fornecida"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.createdAt}</p>
                <p className="text-base">{servicePost.createdAt ? formatDate(servicePost.createdAt) : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {translations.documents.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {postDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
            ) : (
              <div className="space-y-2">
                {postDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{doc.originalName}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href={`/documents?postId=${postId}`}>Ver Todos os Documentos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alocações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postAllocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma alocação encontrada para este posto</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {postAllocations.map((allocation) => (
                <div key={allocation.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(allocation.date)}</p>
                    <p className="text-xs text-muted-foreground">ID Funcionário: {allocation.employeeId}</p>
                  </div>
                  <StatusBadge status={allocation.status} />
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/allocation">Ver Todas as Alocações</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

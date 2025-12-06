import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Pencil, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import type { Employee, Document, Allocation } from "@shared/schema";

interface EmployeeViewProps {
  employeeId: number;
}

export default function EmployeeView({ employeeId }: EmployeeViewProps) {
  const { isAdmin } = useAuth();

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeId],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: allocations } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const employeeDocuments = documents?.filter(d => d.employeeId === employeeId) || [];
  const employeeAllocations = allocations?.filter(a => a.employeeId === employeeId).slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={translations.common.loading} />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <PageHeader title={translations.errors.notFound} />
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{translations.errors.notFound}</p>
            <Button asChild className="mt-4">
              <Link href="/employees">{translations.common.back}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.name}
        description={translations.employees.viewEmployee}
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href="/employees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.common.back}
          </Link>
        </Button>
        {isAdmin && (
          <Button asChild data-testid="button-edit">
            <Link href={`/employees/${employeeId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              {translations.common.edit}
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{translations.employees.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.employees.name}</p>
                <p className="text-base" data-testid="text-employee-name">{employee.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.employees.cpf}</p>
                <p className="text-base font-mono" data-testid="text-employee-cpf">{employee.cpf}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.employees.functionPost}</p>
                <p className="text-base" data-testid="text-employee-function">{employee.functionPost}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.employees.unit}</p>
                <p className="text-base" data-testid="text-employee-unit">{employee.unit}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.employees.status}</p>
                <div className="mt-1">
                  <StatusBadge status={employee.status} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.employees.createdAt}</p>
                <p className="text-base">{employee.createdAt ? formatDate(employee.createdAt) : "N/A"}</p>
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
            {employeeDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{translations.documents.noDocuments}</p>
            ) : (
              <div className="space-y-2">
                {employeeDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{doc.originalName}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href={`/documents?employeeId=${employeeId}`}>{translations.common.view} {translations.documents.title}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {translations.allocation.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeAllocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{translations.allocation.noAllocations}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {employeeAllocations.map((allocation) => (
                <div key={allocation.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(allocation.date)}</p>
                    <p className="text-xs text-muted-foreground">{translations.servicePosts.title}: {allocation.postId}</p>
                  </div>
                  <StatusBadge status={allocation.status} />
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/allocation">{translations.common.view} {translations.allocation.title}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

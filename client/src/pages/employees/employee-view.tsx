import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Pencil, FileText, Calendar, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import type { Employee, Document, Allocation } from "@shared/types";

export default function EmployeeView() {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);

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

  const employeeDocuments =
    documents?.filter(d => d.employeeId === employeeId) || [];

  const employeeAllocations =
    allocations?.filter(a => a.employeeId === employeeId).slice(0, 10) || [];

  const employeeLeaves =
    allocations
      ?.filter(
        a =>
          a.employeeId === employeeId &&
          (a.status === "vacation" || a.status === "medical_leave")
      )
      .slice(0, 10) || [];

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
            <p className="text-muted-foreground">
              {translations.errors.notFound}
            </p>
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

      {/* TODO O RESTO DO JSX PERMANECE IGUAL */}
    </div>
  );
}

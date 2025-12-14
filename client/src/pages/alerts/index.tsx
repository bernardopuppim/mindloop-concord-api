import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileWarning, UserX, AlertCircle, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { translations } from "@/lib/translations";
import type { Employee, Document, Occurrence } from "@shared/types";

export default function AlertsIndex() {
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: occurrences, isLoading: occurrencesLoading } = useQuery<Occurrence[]>({
    queryKey: ["/api/occurrences"],
  });

  const isLoading = employeesLoading || documentsLoading || occurrencesLoading;

  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiredDocuments = documents?.filter((doc) => {
    if (!doc.expirationDate) return false;
    return new Date(doc.expirationDate) < today;
  }) || [];

  const expiringDocuments = documents?.filter((doc) => {
    if (!doc.expirationDate) return false;
    const expDate = new Date(doc.expirationDate);
    return expDate >= today && expDate <= thirtyDaysFromNow;
  }) || [];

  const untreatedOccurrences = occurrences?.filter((occ) => !occ.treated) || [];

  const inactiveEmployees = employees?.filter((emp) => emp.status === "inactive") || [];

  const totalAlerts = expiredDocuments.length + expiringDocuments.length + untreatedOccurrences.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title={translations.alerts.title}
        description={translations.alerts.description}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {translations.alerts.criticalAlerts}
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-semibold" data-testid="stat-critical-alerts">
                  {expiredDocuments.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations.documents.expiredDocuments}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {translations.alerts.warningAlerts}
            </CardTitle>
            <FileWarning className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-semibold" data-testid="stat-warning-alerts">
                  {expiringDocuments.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations.documents.expiringDocuments}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {translations.alerts.untreatedOccurrence}
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-semibold" data-testid="stat-untreated-occurrences">
                  {untreatedOccurrences.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations.occurrences.untreated}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {translations.employees.inactive}
            </CardTitle>
            <UserX className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-semibold" data-testid="stat-inactive-employees">
                  {inactiveEmployees.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations.employees.status}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {translations.documents.expiredDocuments}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : expiredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{translations.alerts.noAlerts}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiredDocuments.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                    data-testid={`alert-expired-doc-${doc.id}`}
                  >
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{doc.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.expirationDate && new Date(doc.expirationDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="destructive">{translations.documents.expired}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-yellow-500" />
              {translations.documents.expiringDocuments}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : expiringDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{translations.alerts.noAlerts}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringDocuments.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                    data-testid={`alert-expiring-doc-${doc.id}`}
                  >
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{doc.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.expirationDate && new Date(doc.expirationDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="secondary">{translations.documents.expiring}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            {translations.occurrences.title} - {translations.occurrences.untreated}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : untreatedOccurrences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{translations.alerts.noAlerts}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {untreatedOccurrences.slice(0, 6).map((occ) => (
                <div
                  key={occ.id}
                  className="rounded-md border p-3"
                  data-testid={`alert-untreated-occ-${occ.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium">{occ.category}</p>
                    <Badge variant="outline">{translations.occurrences.untreated}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{occ.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(occ.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

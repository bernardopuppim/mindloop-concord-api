import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, CalendarDays, AlertCircle, FileText, TrendingUp, Clock, CheckCircle } from "lucide-react";
import type { Employee, ServicePost, Allocation, Occurrence, Document } from "@shared/schema";

interface DashboardStats {
  employees: { total: number; active: number };
  servicePosts: { total: number };
  allocations: { today: number; present: number };
  occurrences: { thisMonth: number };
  documents: { total: number };
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  isLoading 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ElementType; 
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: servicePosts, isLoading: postsLoading } = useQuery<ServicePost[]>({
    queryKey: ["/api/service-posts"],
  });

  const { data: allocations, isLoading: allocationsLoading } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const { data: occurrences, isLoading: occurrencesLoading } = useQuery<Occurrence[]>({
    queryKey: ["/api/occurrences"],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const isLoading = employeesLoading || postsLoading || allocationsLoading || occurrencesLoading || documentsLoading;

  const stats = {
    totalEmployees: employees?.length || 0,
    activeEmployees: employees?.filter(e => e.status === "active").length || 0,
    totalPosts: servicePosts?.length || 0,
    todayAllocations: allocations?.filter(a => {
      const today = new Date().toISOString().split('T')[0];
      return a.date === today;
    }).length || 0,
    presentToday: allocations?.filter(a => {
      const today = new Date().toISOString().split('T')[0];
      return a.date === today && a.status === "present";
    }).length || 0,
    monthOccurrences: occurrences?.filter(o => {
      const now = new Date();
      const occDate = new Date(o.date);
      return occDate.getMonth() === now.getMonth() && occDate.getFullYear() === now.getFullYear();
    }).length || 0,
    totalDocuments: documents?.length || 0,
  };

  const recentOccurrences = occurrences?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your contract management system"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          subtitle={`${stats.activeEmployees} active`}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Service Posts"
          value={stats.totalPosts}
          subtitle="Registered posts"
          icon={Briefcase}
          isLoading={isLoading}
        />
        <StatCard
          title="Today's Allocations"
          value={stats.todayAllocations}
          subtitle={`${stats.presentToday} present`}
          icon={CalendarDays}
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Occurrences"
          value={stats.monthOccurrences}
          subtitle="This month"
          icon={AlertCircle}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Documents</p>
                  <p className="text-xs text-muted-foreground">Total uploaded</p>
                </div>
              </div>
              <span className="text-2xl font-semibold">{stats.totalDocuments}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active Rate</p>
                  <p className="text-xs text-muted-foreground">Employee status</p>
                </div>
              </div>
              <span className="text-2xl font-semibold">
                {stats.totalEmployees > 0 
                  ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Attendance</p>
                  <p className="text-xs text-muted-foreground">Today's rate</p>
                </div>
              </div>
              <span className="text-2xl font-semibold">
                {stats.todayAllocations > 0 
                  ? Math.round((stats.presentToday / stats.todayAllocations) * 100) 
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Occurrences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOccurrences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent occurrences</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOccurrences.map((occurrence) => (
                  <div
                    key={occurrence.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                    data-testid={`occurrence-item-${occurrence.id}`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{occurrence.category}</p>
                      <p className="text-xs text-muted-foreground truncate">{occurrence.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(occurrence.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

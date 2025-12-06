import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, CalendarDays, AlertCircle, FileText, TrendingUp, Clock, CheckCircle, BarChart3, PieChart } from "lucide-react";
import type { Employee, ServicePost, Allocation, Occurrence, Document } from "@shared/schema";
import { translations } from "@/lib/translations";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AllocationTrend {
  date: string;
  present: number;
  absent: number;
  justified: number;
  vacation: number;
  medical_leave: number;
}

interface OccurrenceByCategory {
  category: string;
  count: number;
}

interface ComplianceMetrics {
  attendanceRate: number;
  documentationRate: number;
  activeEmployeeRate: number;
  occurrenceRate: number;
}

const CHART_COLORS = {
  present: "hsl(var(--chart-1))",
  absent: "hsl(var(--chart-2))",
  justified: "hsl(var(--chart-3))",
  vacation: "hsl(var(--chart-4))",
  medical_leave: "hsl(var(--chart-5))",
};

const CATEGORY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

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

function ComplianceMetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[200px] w-full" />
    </div>
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

  const { data: allocationTrends, isLoading: trendsLoading } = useQuery<AllocationTrend[]>({
    queryKey: ["/api/analytics/allocation-trends"],
  });

  const { data: occurrencesByCategory, isLoading: categoriesLoading } = useQuery<OccurrenceByCategory[]>({
    queryKey: ["/api/analytics/occurrences-by-category"],
  });

  const { data: complianceMetrics, isLoading: metricsLoading } = useQuery<ComplianceMetrics>({
    queryKey: ["/api/analytics/compliance-metrics"],
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

  const formattedTrends = allocationTrends?.map(trend => ({
    ...trend,
    date: new Date(trend.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  })) || [];

  const categoryLabels: Record<string, string> = {
    absence: translations.occurrences.absence,
    substitution: translations.occurrences.substitution,
    issue: translations.occurrences.issue,
    note: translations.occurrences.note,
  };

  const formattedCategories = occurrencesByCategory?.map(cat => ({
    name: categoryLabels[cat.category] || cat.category,
    value: cat.count,
  })) || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={translations.dashboard.title}
        description={translations.dashboard.description}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={translations.dashboard.totalEmployees}
          value={stats.totalEmployees}
          subtitle={`${stats.activeEmployees} ${translations.employees.active.toLowerCase()}s`}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title={translations.dashboard.servicePosts}
          value={stats.totalPosts}
          subtitle={translations.dashboard.registeredPosts}
          icon={Briefcase}
          isLoading={isLoading}
        />
        <StatCard
          title={translations.dashboard.todayAllocations}
          value={stats.todayAllocations}
          subtitle={`${stats.presentToday} ${translations.dashboard.presentToday}`}
          icon={CalendarDays}
          isLoading={isLoading}
        />
        <StatCard
          title={translations.dashboard.monthlyOccurrences}
          value={stats.monthOccurrences}
          subtitle={translations.dashboard.thisMonth}
          icon={AlertCircle}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {translations.dashboard.allocationTrends} ({translations.dashboard.last30Days})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <ChartSkeleton />
            ) : formattedTrends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{translations.dashboard.noAllocationData}</p>
              </div>
            ) : (
              <div className="h-[250px]" data-testid="chart-allocation-trends">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="present" 
                      stackId="1" 
                      stroke={CHART_COLORS.present} 
                      fill={CHART_COLORS.present} 
                      fillOpacity={0.6}
                      name={translations.allocation.present}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="absent" 
                      stackId="1" 
                      stroke={CHART_COLORS.absent} 
                      fill={CHART_COLORS.absent} 
                      fillOpacity={0.6}
                      name={translations.allocation.absent}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="vacation" 
                      stackId="1" 
                      stroke={CHART_COLORS.vacation} 
                      fill={CHART_COLORS.vacation} 
                      fillOpacity={0.6}
                      name={translations.allocation.vacation}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="medical_leave" 
                      stackId="1" 
                      stroke={CHART_COLORS.medical_leave} 
                      fill={CHART_COLORS.medical_leave} 
                      fillOpacity={0.6}
                      name={translations.allocation.medicalLeave}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {translations.dashboard.occurrencesByCategory} ({translations.dashboard.last30Days})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <ChartSkeleton />
            ) : formattedCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <PieChart className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{translations.dashboard.noOccurrenceData}</p>
              </div>
            ) : (
              <div className="h-[250px]" data-testid="chart-occurrences-category">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={formattedCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {formattedCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {translations.dashboard.complianceMetrics}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metricsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-4" data-testid="compliance-metrics">
                <ComplianceMetricBar 
                  label={translations.dashboard.attendanceRate}
                  value={complianceMetrics?.attendanceRate || 0} 
                  color="hsl(var(--chart-1))"
                />
                <ComplianceMetricBar 
                  label={translations.dashboard.documentationRate}
                  value={complianceMetrics?.documentationRate || 0} 
                  color="hsl(var(--chart-2))"
                />
                <ComplianceMetricBar 
                  label={translations.dashboard.activeEmployeeRate}
                  value={complianceMetrics?.activeEmployeeRate || 0} 
                  color="hsl(var(--chart-3))"
                />
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{translations.dashboard.occurrencesPerEmployee}</span>
                    <span className="text-sm text-muted-foreground">{complianceMetrics?.occurrenceRate || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{translations.dashboard.average30Days}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {translations.dashboard.quickStats}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{translations.dashboard.documents}</p>
                  <p className="text-xs text-muted-foreground">{translations.dashboard.totalUploaded}</p>
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
                  <p className="text-sm font-medium">{translations.dashboard.activeRate}</p>
                  <p className="text-xs text-muted-foreground">{translations.dashboard.employeeStatus}</p>
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
                  <p className="text-sm font-medium">{translations.dashboard.attendance}</p>
                  <p className="text-xs text-muted-foreground">{translations.dashboard.todayRate}</p>
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
              {translations.dashboard.recentOccurrences}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOccurrences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{translations.dashboard.noRecentOccurrences}</p>
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
                      <p className="text-sm font-medium truncate">
                        {categoryLabels[occurrence.category] || occurrence.category}
                      </p>
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

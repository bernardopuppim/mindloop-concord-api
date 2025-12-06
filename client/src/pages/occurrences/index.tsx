import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { CategoryBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { OccurrenceDialog } from "./occurrence-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import type { Occurrence, Employee, ServicePost } from "@shared/schema";

export default function OccurrencesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingOccurrence, setEditingOccurrence] = useState<Occurrence | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: occurrences, isLoading } = useQuery<Occurrence[]>({
    queryKey: ["/api/occurrences"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: servicePosts } = useQuery<ServicePost[]>({
    queryKey: ["/api/service-posts"],
  });

  const employeeMap = new Map(employees?.map(e => [e.id, e]) || []);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/occurrences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/occurrences"] });
      toast({ title: translations.common.success, description: translations.occurrences.occurrenceDeleted });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: translations.common.error, description: translations.errors.deleteError, variant: "destructive" });
    },
  });

  const categoryLabels: Record<string, string> = {
    absence: translations.occurrences.absence,
    substitution: translations.occurrences.substitution,
    issue: translations.occurrences.issue,
    note: translations.occurrences.note,
  };

  const filteredOccurrences = occurrences?.filter((occurrence) => {
    const matchesSearch = occurrence.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || occurrence.category === categoryFilter;
    const matchesEmployee = employeeFilter === "all" || occurrence.employeeId?.toString() === employeeFilter;
    return matchesSearch && matchesCategory && matchesEmployee;
  }) || [];

  const activeFilters = [
    categoryFilter !== "all" ? `${translations.occurrences.category}: ${categoryLabels[categoryFilter] || categoryFilter}` : null,
    employeeFilter !== "all" ? `${translations.occurrences.employee}: ${employeeMap.get(Number(employeeFilter))?.name || employeeFilter}` : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setCategoryFilter("all");
    setEmployeeFilter("all");
  };

  const columns = [
    {
      key: "date",
      header: translations.occurrences.date,
      cell: (occurrence: Occurrence) => (
        <span data-testid={`text-occurrence-date-${occurrence.id}`}>
          {formatDate(occurrence.date)}
        </span>
      ),
    },
    {
      key: "category",
      header: translations.occurrences.category,
      cell: (occurrence: Occurrence) => (
        <CategoryBadge category={occurrence.category} />
      ),
    },
    {
      key: "employee",
      header: translations.occurrences.employee,
      cell: (occurrence: Occurrence) => {
        const employee = occurrence.employeeId ? employeeMap.get(occurrence.employeeId) : null;
        return (
          <span data-testid={`text-occurrence-employee-${occurrence.id}`}>
            {employee ? employee.name : "N/A"}
          </span>
        );
      },
    },
    {
      key: "description",
      header: translations.common.description,
      cell: (occurrence: Occurrence) => (
        <div className="max-w-[300px] truncate" data-testid={`text-occurrence-description-${occurrence.id}`}>
          {occurrence.description}
        </div>
      ),
    },
    {
      key: "actions",
      header: translations.common.actions,
      className: "text-right",
      cell: (occurrence: Occurrence) => (
        <div className="flex items-center justify-end gap-1">
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingOccurrence(occurrence);
                  setIsDialogOpen(true);
                }}
                data-testid={`button-edit-occurrence-${occurrence.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(occurrence.id)}
                data-testid={`button-delete-occurrence-${occurrence.id}`}
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
        title={translations.occurrences.title}
        description={translations.occurrences.pageDescription}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={translations.occurrences.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-occurrences"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
                  <SelectValue placeholder={translations.occurrences.category} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.occurrences.allCategories}</SelectItem>
                  <SelectItem value="absence">{translations.occurrences.absence}</SelectItem>
                  <SelectItem value="substitution">{translations.occurrences.substitution}</SelectItem>
                  <SelectItem value="issue">{translations.occurrences.issue}</SelectItem>
                  <SelectItem value="note">{translations.occurrences.note}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-employee-filter">
                  <SelectValue placeholder={translations.occurrences.employee} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.occurrences.allEmployees}</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingOccurrence(null);
                setIsDialogOpen(true);
              }}
              data-testid="button-new-occurrence"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Ocorrência
            </Button>
          )}
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
        data={filteredOccurrences}
        isLoading={isLoading}
        emptyMessage={translations.occurrences.noOccurrences}
        emptyDescription="Registre incidentes e anotações aqui."
        testIdPrefix="occurrences"
      />

      <OccurrenceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        occurrence={editingOccurrence}
        employees={employees || []}
        servicePosts={servicePosts || []}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={translations.occurrences.deleteOccurrence}
        description={translations.occurrences.deleteConfirm}
        confirmText={translations.common.delete}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

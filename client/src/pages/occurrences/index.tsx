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
import type { Occurrence, Employee } from "@shared/schema";

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

  const employeeMap = new Map(employees?.map(e => [e.id, e]) || []);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/occurrences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/occurrences"] });
      toast({ title: "Success", description: "Occurrence deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete occurrence", variant: "destructive" });
    },
  });

  const filteredOccurrences = occurrences?.filter((occurrence) => {
    const matchesSearch = occurrence.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || occurrence.category === categoryFilter;
    const matchesEmployee = employeeFilter === "all" || occurrence.employeeId?.toString() === employeeFilter;
    return matchesSearch && matchesCategory && matchesEmployee;
  }) || [];

  const activeFilters = [
    categoryFilter !== "all" ? `Category: ${categoryFilter}` : null,
    employeeFilter !== "all" ? `Employee: ${employeeMap.get(Number(employeeFilter))?.name || employeeFilter}` : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setCategoryFilter("all");
    setEmployeeFilter("all");
  };

  const columns = [
    {
      key: "date",
      header: "Date",
      cell: (occurrence: Occurrence) => (
        <span data-testid={`text-occurrence-date-${occurrence.id}`}>
          {formatDate(occurrence.date)}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (occurrence: Occurrence) => (
        <CategoryBadge category={occurrence.category} />
      ),
    },
    {
      key: "employee",
      header: "Employee",
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
      header: "Description",
      cell: (occurrence: Occurrence) => (
        <div className="max-w-[300px] truncate" data-testid={`text-occurrence-description-${occurrence.id}`}>
          {occurrence.description}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
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
        title="Occurrences"
        description="Track incidents, absences, and notes"
      >
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingOccurrence(null);
              setIsDialogOpen(true);
            }}
            data-testid="button-add-occurrence"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Occurrence
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-occurrences"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="absence">Absence</SelectItem>
                <SelectItem value="substitution">Substitution</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-employee-filter">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="secondary" className="text-xs">
                {filter}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2" data-testid="button-clear-filters">
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredOccurrences}
        isLoading={isLoading}
        emptyMessage="No occurrences found"
        emptyDescription="Track incidents and notes here."
        testIdPrefix="occurrences"
      />

      <OccurrenceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        occurrence={editingOccurrence}
        employees={employees || []}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Occurrence"
        description="Are you sure you want to delete this occurrence? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

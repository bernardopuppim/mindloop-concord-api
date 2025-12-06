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
import type { Employee } from "@shared/schema";

export default function EmployeesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Success", description: "Employee deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete employee", variant: "destructive" });
    },
  });

  const filteredEmployees = employees?.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.cpf.includes(searchQuery) ||
      employee.unit.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (employee: Employee) => (
        <div className="font-medium" data-testid={`text-employee-name-${employee.id}`}>
          {employee.name}
        </div>
      ),
    },
    {
      key: "cpf",
      header: "CPF",
      cell: (employee: Employee) => (
        <span className="font-mono text-sm" data-testid={`text-employee-cpf-${employee.id}`}>
          {employee.cpf}
        </span>
      ),
    },
    {
      key: "function",
      header: "Function",
      cell: (employee: Employee) => employee.functionPost,
    },
    {
      key: "unit",
      header: "Unit",
      cell: (employee: Employee) => employee.unit,
    },
    {
      key: "status",
      header: "Status",
      cell: (employee: Employee) => (
        <StatusBadge status={employee.status} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (employee: Employee) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" asChild data-testid={`button-view-employee-${employee.id}`}>
            <Link href={`/employees/${employee.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon" asChild data-testid={`button-edit-employee-${employee.id}`}>
                <Link href={`/employees/${employee.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(employee.id)}
                data-testid={`button-delete-employee-${employee.id}`}
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
        title="Employees"
        description="Manage employee records and information"
      >
        {isAdmin && (
          <Button asChild data-testid="button-add-employee">
            <Link href="/employees/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, CPF, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-employees"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredEmployees}
        isLoading={isLoading}
        emptyMessage="No employees found"
        emptyDescription="Get started by adding your first employee."
        testIdPrefix="employees"
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Employee"
        description="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

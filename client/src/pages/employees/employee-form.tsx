import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCPF } from "@/lib/authUtils";
import type { Employee, InsertEmployee } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF must be in format XXX.XXX.XXX-XX"),
  functionPost: z.string().min(2, "Function is required"),
  unit: z.string().min(2, "Unit is required"),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof formSchema>;

interface EmployeeFormProps {
  employeeId?: number;
}

export default function EmployeeForm({ employeeId }: EmployeeFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!employeeId;

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeId],
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      functionPost: "",
      unit: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name,
        cpf: employee.cpf,
        functionPost: employee.functionPost,
        unit: employee.unit,
        status: employee.status,
      });
    }
  }, [employee, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        await apiRequest("PATCH", `/api/employees/${employeeId}`, data);
      } else {
        await apiRequest("POST", "/api/employees", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: `Employee ${isEditing ? "updated" : "created"} successfully`,
      });
      setLocation("/employees");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} employee`,
        variant: "destructive",
      });
    },
  });

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    form.setValue("cpf", formatted);
  };

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Employee" : "Add Employee"}
        description={isEditing ? "Update employee information" : "Create a new employee record"}
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} data-testid="input-employee-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          onChange={handleCPFChange}
                          maxLength={14}
                          className="font-mono"
                          data-testid="input-employee-cpf"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-employee-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="functionPost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Function / Post *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter function or position" {...field} data-testid="input-employee-function" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter unit" {...field} data-testid="input-employee-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/employees")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
                  {mutation.isPending ? "Saving..." : isEditing ? "Update Employee" : "Create Employee"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

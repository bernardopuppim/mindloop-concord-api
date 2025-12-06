import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCPF } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { Employee, ServicePost } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(2, translations.validation.minLength.replace("{min}", "2")),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, translations.validation.invalidCpf),
  functionPost: z.string().min(2, translations.validation.required),
  unit: z.string().min(2, translations.validation.required),
  status: z.enum(["active", "inactive"]),
  admissionDate: z.string().optional().nullable(),
  linkedPostId: z.number().optional().nullable(),
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

  const { data: servicePosts } = useQuery<ServicePost[]>({
    queryKey: ["/api/service-posts"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      functionPost: "",
      unit: "",
      status: "active",
      admissionDate: null,
      linkedPostId: null,
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
        admissionDate: employee.admissionDate || null,
        linkedPostId: employee.linkedPostId || null,
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
        title: translations.common.success,
        description: isEditing ? translations.employees.employeeUpdated : translations.employees.employeeCreated,
      });
      setLocation("/employees");
    },
    onError: (error: Error) => {
      toast({
        title: translations.common.error,
        description: error.message || translations.errors.saveError,
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
        <PageHeader title={translations.common.loading} />
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
        title={isEditing ? translations.employees.editEmployee : translations.employees.addEmployee}
        description={isEditing ? translations.employees.editEmployee : translations.employees.addEmployee}
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>{translations.employees.title}</CardTitle>
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
                      <FormLabel>{translations.employees.name} *</FormLabel>
                      <FormControl>
                        <Input placeholder={translations.employees.name} {...field} data-testid="input-employee-name" />
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
                      <FormLabel>{translations.employees.cpf} *</FormLabel>
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
                      <FormLabel>{translations.employees.status} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-employee-status">
                            <SelectValue placeholder={translations.common.selectOption} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{translations.employees.active}</SelectItem>
                          <SelectItem value="inactive">{translations.employees.inactive}</SelectItem>
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
                      <FormLabel>{translations.employees.functionPost} *</FormLabel>
                      <FormControl>
                        <Input placeholder={translations.employees.functionPost} {...field} data-testid="input-employee-function" />
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
                      <FormLabel>{translations.employees.unit} *</FormLabel>
                      <FormControl>
                        <Input placeholder={translations.employees.unit} {...field} data-testid="input-employee-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admissionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Admissão</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-admission-date"
                            >
                              {field.value ? (
                                format(new Date(field.value), "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedPostId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posto Vinculado</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value, 10))} 
                        value={field.value ? field.value.toString() : "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-linked-post">
                            <SelectValue placeholder="Selecione um posto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum posto vinculado</SelectItem>
                          {servicePosts?.map((post) => (
                            <SelectItem key={post.id} value={post.id.toString()}>
                              {post.postCode} - {post.postName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  {translations.common.cancel}
                </Button>
                <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
                  {mutation.isPending ? translations.common.loading : isEditing ? translations.common.update : translations.common.save}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

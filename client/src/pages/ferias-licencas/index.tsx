import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, CalendarCheck, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { translations } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";
import type { Employee, FeriasLicencasWithRelations } from "@shared/schema";

const feriasLicencasFormSchema = z.object({
  employeeId: z.string().min(1, translations.validation.required),
  type: z.enum(["ferias", "licenca_medica", "licenca_maternidade", "licenca_paternidade", "licenca_nojo", "licenca_casamento", "outros"]),
  startDate: z.string().min(1, translations.validation.required),
  endDate: z.string().min(1, translations.validation.required),
  status: z.enum(["pendente", "aprovado", "rejeitado", "em_andamento", "concluido"]),
  observations: z.string().optional(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: translations.validation.endDateAfterStart,
    path: ["endDate"],
  }
);

type FeriasLicencasFormData = z.infer<typeof feriasLicencasFormSchema>;

const typeLabels: Record<string, string> = {
  ferias: translations.feriasLicencas.types.ferias,
  licenca_medica: translations.feriasLicencas.types.licenca_medica,
  licenca_maternidade: translations.feriasLicencas.types.licenca_maternidade,
  licenca_paternidade: translations.feriasLicencas.types.licenca_paternidade,
  licenca_nojo: translations.feriasLicencas.types.licenca_nojo,
  licenca_casamento: translations.feriasLicencas.types.licenca_casamento,
  outros: translations.feriasLicencas.types.outros,
};

const statusLabels: Record<string, string> = {
  pendente: translations.feriasLicencas.statuses.pendente,
  aprovado: translations.feriasLicencas.statuses.aprovado,
  rejeitado: translations.feriasLicencas.statuses.rejeitado,
  em_andamento: translations.feriasLicencas.statuses.em_andamento,
  concluido: translations.feriasLicencas.statuses.concluido,
};

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "aprovado":
    case "em_andamento":
      return "default";
    case "concluido":
      return "secondary";
    case "rejeitado":
      return "destructive";
    default:
      return "outline";
  }
}

export default function FeriasLicencasIndex() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeriasLicencasWithRelations | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<FeriasLicencasWithRelations | null>(null);

  const { data: records, isLoading } = useQuery<FeriasLicencasWithRelations[]>({
    queryKey: ["/api/ferias-licencas"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<FeriasLicencasFormData>({
    resolver: zodResolver(feriasLicencasFormSchema),
    defaultValues: {
      employeeId: "",
      type: "ferias",
      startDate: "",
      endDate: "",
      status: "pendente",
      observations: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FeriasLicencasFormData) => {
      return apiRequest("POST", "/api/ferias-licencas", {
        ...data,
        employeeId: parseInt(data.employeeId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ferias-licencas"] });
      toast({ title: translations.feriasLicencas.createSuccess });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: translations.errors.saveError, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FeriasLicencasFormData }) => {
      return apiRequest("PATCH", `/api/ferias-licencas/${id}`, {
        ...data,
        employeeId: parseInt(data.employeeId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ferias-licencas"] });
      toast({ title: translations.feriasLicencas.updateSuccess });
      handleCloseForm();
    },
    onError: () => {
      toast({ title: translations.errors.saveError, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/ferias-licencas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ferias-licencas"] });
      toast({ title: translations.feriasLicencas.deleteSuccess });
      setDeleteRecord(null);
    },
    onError: () => {
      toast({ title: translations.errors.deleteError, variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    form.reset({
      employeeId: "",
      type: "ferias",
      startDate: "",
      endDate: "",
      status: "pendente",
      observations: "",
    });
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: FeriasLicencasWithRelations) => {
    form.reset({
      employeeId: String(record.employeeId),
      type: record.type as any,
      startDate: record.startDate,
      endDate: record.endDate,
      status: record.status as any,
      observations: record.observations || "",
    });
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
    form.reset();
  };

  const onSubmit = (data: FeriasLicencasFormData) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredRecords = records?.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.employee?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeRecords = records?.filter((r) => {
    const today = new Date();
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    return (r.status === "aprovado" || r.status === "em_andamento") && start <= today && end >= today;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={translations.feriasLicencas.title}
        description={translations.feriasLicencas.description}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {translations.dashboard.vacationsLeaves}
            </CardTitle>
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold" data-testid="stat-active-leaves">
              {activeRecords?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {translations.dashboard.employeesOnLeave}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{translations.feriasLicencas.title}</CardTitle>
            {isAdmin && (
              <Button onClick={handleOpenCreate} data-testid="button-add-ferias-licenca">
                <Plus className="h-4 w-4 mr-2" />
                {translations.feriasLicencas.addNew}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={translations.feriasLicencas.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-ferias-licenca"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={translations.feriasLicencas.filterByType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.feriasLicencas.allTypes}</SelectItem>
                  <SelectItem value="ferias">{translations.feriasLicencas.types.ferias}</SelectItem>
                  <SelectItem value="licenca_medica">{translations.feriasLicencas.types.licenca_medica}</SelectItem>
                  <SelectItem value="licenca_maternidade">{translations.feriasLicencas.types.licenca_maternidade}</SelectItem>
                  <SelectItem value="licenca_paternidade">{translations.feriasLicencas.types.licenca_paternidade}</SelectItem>
                  <SelectItem value="licenca_nojo">{translations.feriasLicencas.types.licenca_nojo}</SelectItem>
                  <SelectItem value="licenca_casamento">{translations.feriasLicencas.types.licenca_casamento}</SelectItem>
                  <SelectItem value="outros">{translations.feriasLicencas.types.outros}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                  <SelectValue placeholder={translations.feriasLicencas.filterByStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.feriasLicencas.allStatuses}</SelectItem>
                  <SelectItem value="pendente">{translations.feriasLicencas.statuses.pendente}</SelectItem>
                  <SelectItem value="aprovado">{translations.feriasLicencas.statuses.aprovado}</SelectItem>
                  <SelectItem value="rejeitado">{translations.feriasLicencas.statuses.rejeitado}</SelectItem>
                  <SelectItem value="em_andamento">{translations.feriasLicencas.statuses.em_andamento}</SelectItem>
                  <SelectItem value="concluido">{translations.feriasLicencas.statuses.concluido}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredRecords?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{translations.feriasLicencas.noRecords}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translations.feriasLicencas.employee}</TableHead>
                    <TableHead>{translations.feriasLicencas.type}</TableHead>
                    <TableHead>{translations.feriasLicencas.startDate}</TableHead>
                    <TableHead>{translations.feriasLicencas.endDate}</TableHead>
                    <TableHead>{translations.feriasLicencas.daysTotal}</TableHead>
                    <TableHead>{translations.feriasLicencas.status}</TableHead>
                    <TableHead className="text-right">{translations.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords?.map((record) => {
                    const days = differenceInDays(new Date(record.endDate), new Date(record.startDate)) + 1;
                    return (
                      <TableRow key={record.id} data-testid={`row-ferias-licenca-${record.id}`}>
                        <TableCell className="font-medium">
                          {record.employee?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{typeLabels[record.type] || record.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.startDate), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{days}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(record.status)}>
                            {statusLabels[record.status] || record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(record)}
                                data-testid={`button-edit-ferias-licenca-${record.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteRecord(record)}
                                data-testid={`button-delete-ferias-licenca-${record.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? translations.feriasLicencas.editTitle : translations.feriasLicencas.addNew}
            </DialogTitle>
            <DialogDescription>
              {translations.feriasLicencas.description}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.feriasLicencas.employee}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employee">
                          <SelectValue placeholder={translations.common.selectOption} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={String(employee.id)}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.feriasLicencas.type}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder={translations.common.selectOption} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ferias">{translations.feriasLicencas.types.ferias}</SelectItem>
                        <SelectItem value="licenca_medica">{translations.feriasLicencas.types.licenca_medica}</SelectItem>
                        <SelectItem value="licenca_maternidade">{translations.feriasLicencas.types.licenca_maternidade}</SelectItem>
                        <SelectItem value="licenca_paternidade">{translations.feriasLicencas.types.licenca_paternidade}</SelectItem>
                        <SelectItem value="licenca_nojo">{translations.feriasLicencas.types.licenca_nojo}</SelectItem>
                        <SelectItem value="licenca_casamento">{translations.feriasLicencas.types.licenca_casamento}</SelectItem>
                        <SelectItem value="outros">{translations.feriasLicencas.types.outros}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.feriasLicencas.startDate}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.feriasLicencas.endDate}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.feriasLicencas.status}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder={translations.common.selectOption} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">{translations.feriasLicencas.statuses.pendente}</SelectItem>
                        <SelectItem value="aprovado">{translations.feriasLicencas.statuses.aprovado}</SelectItem>
                        <SelectItem value="rejeitado">{translations.feriasLicencas.statuses.rejeitado}</SelectItem>
                        <SelectItem value="em_andamento">{translations.feriasLicencas.statuses.em_andamento}</SelectItem>
                        <SelectItem value="concluido">{translations.feriasLicencas.statuses.concluido}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.feriasLicencas.observations}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-observations" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  {translations.common.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-ferias-licenca"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? translations.common.loading
                    : translations.common.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.confirmDialog.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.feriasLicencas.confirmDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecord && deleteMutation.mutate(deleteRecord.id)}
              data-testid="button-confirm-delete"
            >
              {translations.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { translations } from "@/lib/translations";
import type { Occurrence, Employee, ServicePost } from "@shared/schema";

const formSchema = z.object({
  date: z.string().min(1, translations.validation.required),
  employeeId: z.string().optional(),
  postId: z.string().optional(),
  category: z.enum(["absence", "substitution", "issue", "note"]),
  description: z.string().min(5, translations.validation.descriptionMinLength.replace("{min}", "5")),
});

type FormData = z.infer<typeof formSchema>;

interface OccurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrence: Occurrence | null;
  employees: Employee[];
  servicePosts: ServicePost[];
}

export function OccurrenceDialog({ open, onOpenChange, occurrence, employees, servicePosts }: OccurrenceDialogProps) {
  const { toast } = useToast();
  const isEditing = !!occurrence;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      employeeId: "",
      postId: "",
      category: "note",
      description: "",
    },
  });

  useEffect(() => {
    if (occurrence) {
      form.reset({
        date: occurrence.date,
        employeeId: occurrence.employeeId?.toString() || "",
        postId: occurrence.postId?.toString() || "",
        category: occurrence.category,
        description: occurrence.description,
      });
    } else {
      form.reset({
        date: new Date().toISOString().split("T")[0],
        employeeId: "",
        postId: "",
        category: "note",
        description: "",
      });
    }
  }, [occurrence, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        employeeId: data.employeeId && data.employeeId !== "none" ? parseInt(data.employeeId) : null,
        postId: data.postId && data.postId !== "none" ? parseInt(data.postId) : null,
      };
      if (isEditing) {
        await apiRequest("PATCH", `/api/occurrences/${occurrence.id}`, payload);
      } else {
        await apiRequest("POST", "/api/occurrences", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/occurrences"] });
      toast({
        title: translations.common.success,
        description: isEditing ? translations.occurrences.occurrenceUpdated : translations.occurrences.occurrenceCreated,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: translations.common.error,
        description: error.message || translations.errors.saveError,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? translations.occurrences.editOccurrence : translations.occurrences.addOccurrence}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.occurrences.date} *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-occurrence-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.occurrences.category} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-occurrence-category">
                        <SelectValue placeholder={translations.common.selectOption} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="absence">{translations.occurrences.absence}</SelectItem>
                      <SelectItem value="substitution">{translations.occurrences.substitution}</SelectItem>
                      <SelectItem value="issue">{translations.occurrences.issue}</SelectItem>
                      <SelectItem value="note">{translations.occurrences.note}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.occurrences.employee} ({translations.common.optional})</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-occurrence-employee">
                        <SelectValue placeholder={`${translations.allocation.selectEmployee} (${translations.common.optional})`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
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
              name="postId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posto de Serviço ({translations.common.optional})</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-occurrence-post">
                        <SelectValue placeholder={`${translations.allocation.selectPost} (${translations.common.optional})`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {servicePosts.map((post) => (
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.common.description} *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a ocorrência..."
                      rows={4}
                      {...field}
                      data-testid="input-occurrence-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                {translations.common.cancel}
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
                {mutation.isPending ? "Salvando..." : isEditing ? translations.common.update : translations.common.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
import type { Occurrence, Employee } from "@shared/schema";

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  employeeId: z.string().optional(),
  category: z.enum(["absence", "substitution", "issue", "note"]),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

type FormData = z.infer<typeof formSchema>;

interface OccurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrence: Occurrence | null;
  employees: Employee[];
}

export function OccurrenceDialog({ open, onOpenChange, occurrence, employees }: OccurrenceDialogProps) {
  const { toast } = useToast();
  const isEditing = !!occurrence;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      employeeId: "",
      category: "note",
      description: "",
    },
  });

  useEffect(() => {
    if (occurrence) {
      form.reset({
        date: occurrence.date,
        employeeId: occurrence.employeeId?.toString() || "",
        category: occurrence.category,
        description: occurrence.description,
      });
    } else {
      form.reset({
        date: new Date().toISOString().split("T")[0],
        employeeId: "",
        category: "note",
        description: "",
      });
    }
  }, [occurrence, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        employeeId: data.employeeId ? parseInt(data.employeeId) : null,
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
        title: "Success",
        description: `Occurrence ${isEditing ? "updated" : "created"} successfully`,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} occurrence`,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Occurrence" : "Add Occurrence"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
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
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-occurrence-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="absence">Absence</SelectItem>
                      <SelectItem value="substitution">Substitution</SelectItem>
                      <SelectItem value="issue">Issue</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
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
                  <FormLabel>Employee (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-occurrence-employee">
                        <SelectValue placeholder="Select employee (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the occurrence..."
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
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
                {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

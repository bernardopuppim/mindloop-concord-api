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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ServicePost } from "@shared/schema";

const formSchema = z.object({
  postCode: z.string().min(1, "Post code is required"),
  postName: z.string().min(2, "Post name must be at least 2 characters"),
  description: z.string().optional(),
  unit: z.string().min(2, "Unit is required"),
  modality: z.enum(["onsite", "hybrid", "remote"]),
});

type FormData = z.infer<typeof formSchema>;

interface ServicePostFormProps {
  postId?: number;
}

export default function ServicePostForm({ postId }: ServicePostFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!postId;

  const { data: servicePost, isLoading } = useQuery<ServicePost>({
    queryKey: ["/api/service-posts", postId],
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postCode: "",
      postName: "",
      description: "",
      unit: "",
      modality: "onsite",
    },
  });

  useEffect(() => {
    if (servicePost) {
      form.reset({
        postCode: servicePost.postCode,
        postName: servicePost.postName,
        description: servicePost.description || "",
        unit: servicePost.unit,
        modality: servicePost.modality,
      });
    }
  }, [servicePost, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        await apiRequest("PATCH", `/api/service-posts/${postId}`, data);
      } else {
        await apiRequest("POST", "/api/service-posts", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-posts"] });
      toast({
        title: "Success",
        description: `Service post ${isEditing ? "updated" : "created"} successfully`,
      });
      setLocation("/service-posts");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} service post`,
        variant: "destructive",
      });
    },
  });

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Service Post" : "Add Service Post"}
        description={isEditing ? "Update service post information" : "Create a new service post"}
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Service Post Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="postCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., POST-001" {...field} className="font-mono" data-testid="input-post-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modality *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-post-modality">
                            <SelectValue placeholder="Select modality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="onsite">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Post Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter post name" {...field} data-testid="input-post-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter unit" {...field} data-testid="input-post-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter description (optional)"
                          rows={4}
                          {...field}
                          data-testid="input-post-description"
                        />
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
                  onClick={() => setLocation("/service-posts")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
                  {mutation.isPending ? "Saving..." : isEditing ? "Update Service Post" : "Create Service Post"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

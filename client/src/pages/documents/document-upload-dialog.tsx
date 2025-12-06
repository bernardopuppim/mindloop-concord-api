import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getMonthYearOptions } from "@/lib/authUtils";
import type { Employee, ServicePost } from "@shared/schema";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  servicePosts: ServicePost[];
}

export function DocumentUploadDialog({ open, onOpenChange, employees, servicePosts }: DocumentUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("other");
  const [linkType, setLinkType] = useState<string>("none");
  const [linkedId, setLinkedId] = useState<string>("");
  const [monthYear, setMonthYear] = useState<string>("");

  const monthYearOptions = getMonthYearOptions();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", documentType);

      if (linkType === "employee" && linkedId) {
        formData.append("employeeId", linkedId);
      } else if (linkType === "post" && linkedId) {
        formData.append("postId", linkedId);
      } else if (linkType === "month" && monthYear) {
        formData.append("monthYear", monthYear);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Success", description: "Document uploaded successfully" });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDocumentType("other");
    setLinkType("none");
    setLinkedId("");
    setMonthYear("");
    onOpenChange(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors hover:border-primary/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="drop-zone"
          >
            {selectedFile ? (
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  data-testid="button-remove-file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, images up to 10MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
            className="hidden"
            onChange={handleFileChange}
            data-testid="input-file"
          />

          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger data-testid="select-doc-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aso">ASO</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Link To</Label>
            <Select value={linkType} onValueChange={(v) => { setLinkType(v); setLinkedId(""); setMonthYear(""); }}>
              <SelectTrigger data-testid="select-link-type">
                <SelectValue placeholder="Select link type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="post">Service Post</SelectItem>
                <SelectItem value="month">Monthly Evidence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {linkType === "employee" && (
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <Select value={linkedId} onValueChange={setLinkedId}>
                <SelectTrigger data-testid="select-link-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {linkType === "post" && (
            <div className="space-y-2">
              <Label>Select Service Post</Label>
              <Select value={linkedId} onValueChange={setLinkedId}>
                <SelectTrigger data-testid="select-link-post">
                  <SelectValue placeholder="Select post" />
                </SelectTrigger>
                <SelectContent>
                  {servicePosts.map((post) => (
                    <SelectItem key={post.id} value={post.id.toString()}>
                      {post.postCode} - {post.postName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {linkType === "month" && (
            <div className="space-y-2">
              <Label>Select Month</Label>
              <Select value={monthYear} onValueChange={setMonthYear}>
                <SelectTrigger data-testid="select-link-month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthYearOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
            data-testid="button-upload"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

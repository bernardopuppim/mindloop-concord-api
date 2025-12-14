import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "present" | "absent" | "justified" | "vacation" | "medical_leave" | "onsite" | "hybrid" | "remote";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  present: { label: "Present", variant: "default" },
  absent: { label: "Absent", variant: "destructive" },
  justified: { label: "Justified", variant: "secondary" },
  vacation: { label: "Vacation", variant: "outline" },
  medical_leave: { label: "Medical Leave", variant: "outline" },
  onsite: { label: "On-site", variant: "default" },
  hybrid: { label: "Hybrid", variant: "secondary" },
  remote: { label: "Remote", variant: "outline" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={cn("text-xs", className)} data-testid={`badge-status-${status}`}>
      {config.label}
    </Badge>
  );
}

type CategoryType = "absence" | "substitution" | "issue" | "note";

interface CategoryBadgeProps {
  category: CategoryType;
  className?: string;
}

const categoryConfig: Record<CategoryType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  absence: { label: "Absence", variant: "destructive" },
  substitution: { label: "Substitution", variant: "secondary" },
  issue: { label: "Issue", variant: "outline" },
  note: { label: "Note", variant: "default" },
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category] || { label: category, variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={cn("text-xs", className)} data-testid={`badge-category-${category}`}>
      {config.label}
    </Badge>
  );
}

type DocType = "aso" | "certification" | "evidence" | "contract" | "other";

interface DocTypeBadgeProps {
  type: DocType;
  className?: string;
}

const docTypeConfig: Record<DocType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aso: { label: "ASO", variant: "default" },
  certification: { label: "Certification", variant: "secondary" },
  evidence: { label: "Evidence", variant: "outline" },
  contract: { label: "Contract", variant: "default" },
  other: { label: "Other", variant: "secondary" },
};

export function DocTypeBadge({ type, className }: DocTypeBadgeProps) {
  const config = docTypeConfig[type] || { label: type, variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={cn("text-xs", className)} data-testid={`badge-doctype-${type}`}>
      {config.label}
    </Badge>
  );
}

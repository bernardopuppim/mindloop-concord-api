import { cn } from "@/lib/utils";

interface DicaLogoProps {
  className?: string;
}

export function DicaLogo({ className }: DicaLogoProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold",
        className
      )}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
      >
        <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0" />
        <path
          d="M8 12h6c4 0 7 3 7 8s-3 8-7 8H8V12zm6 12c2 0 3-1.5 3-4s-1-4-3-4h-2v8h2z"
          fill="currentColor"
        />
        <circle cx="28" cy="20" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path
          d="M28 15v10M23 20h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

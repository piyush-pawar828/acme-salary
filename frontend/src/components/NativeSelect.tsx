import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// A styled native <select>: accessible, keyboard-friendly, and simple to test.
export function NativeSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

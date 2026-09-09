import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-[11px] uppercase tracking-[0.22em] text-muted-foreground", className)}
      {...props}
    />
  );
}

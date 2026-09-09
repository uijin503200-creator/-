import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MicroscopeStage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-8", className)}>
      <div className="relative overflow-hidden rounded-[2.6rem] border border-primary/15 bg-cytoplasm/50 membrane">
        <div className="pointer-events-none absolute inset-0 eyepiece-vignette" />
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="#3dffc2" strokeWidth="0.15" />
          <line x1="50" y1="4" x2="50" y2="96" stroke="#3dffc2" strokeWidth="0.08" />
          <line x1="4" y1="50" x2="96" y2="50" stroke="#3dffc2" strokeWidth="0.08" />
        </svg>
        <div className="relative z-10 p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

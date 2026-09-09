"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function FormSubmit({
  idle,
  pendingLabel,
  size = "default",
  variant = "default",
  className,
}: {
  idle: string;
  pendingLabel: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "protein" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} variant={variant} disabled={pending} className={className}>
      {pending ? pendingLabel : idle}
    </Button>
  );
}

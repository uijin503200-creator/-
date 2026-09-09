"use client";

import { motion } from "framer-motion";
import { CELL_PHENOTYPES } from "@/lib/biology";
import { applyChaperone } from "@/app/actions/store";
import type { VesicleWithCells } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTransition } from "react";

export function VesicleCard({
  vesicle,
  canRefold,
}: {
  vesicle: VesicleWithCells;
  canRefold?: boolean;
}) {
  const [pending, start] = useTransition();
  const sender = CELL_PHENOTYPES[vesicle.sender.cellType];
  const misfit = vesicle.isMisfolded;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border bg-black/25 p-5",
        misfit ? "misfold-membrane border-misfold/40" : "membrane border-primary/20",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            vesicle · {vesicle.status.replace("_", " ")}
          </p>
          <p className="mt-1 font-display text-xl">
            <span style={{ color: sender.accent }}>@{vesicle.sender.handle}</span>
            <span className="text-muted-foreground"> → @{vesicle.recipient.handle}</span>
          </p>
        </div>
        <Badge className={misfit ? "border-misfold/50 text-misfold" : ""}>
          {misfit ? "misfolded" : `${Math.round(vesicle.transcriptionFidelity * 100)}% fidelity`}
        </Badge>
      </div>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-dna">DNA seed</dt>
          <dd className="font-mono text-dna/90">{vesicle.dnaSeed}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-mrna">mRNA transcript</dt>
          <dd className="max-h-16 overflow-hidden font-mono text-[11px] leading-5 text-mrna/90">
            {vesicle.mrnaTranscript.plain}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-protein">Protein result</dt>
          <dd className={cn("font-display text-lg", misfit ? "text-misfold" : "text-protein")}>
            {vesicle.proteinResult ?? "awaiting ribosome…"}
          </dd>
        </div>
      </dl>

      {vesicle.mrnaTranscript.mutations.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {vesicle.mutationCount} uncorrected lesion
          {vesicle.mutationCount === 1 ? "" : "s"} · polymerase{" "}
          {vesicle.mrnaTranscript.polymerase}
        </p>
      )}

      {canRefold && misfit && (
        <Button
          className="mt-4"
          variant="protein"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await applyChaperone(vesicle.id);
              if (result.ok) toast.success("Chaperone barrel engaged. Chain refolded.");
              else toast.error(result.error);
            })
          }
        >
          Deploy chaperone
        </Button>
      )}
    </motion.article>
  );
}

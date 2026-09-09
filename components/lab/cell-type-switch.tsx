"use client";

import { useTransition } from "react";
import { switchCellType } from "@/app/actions/cell";
import { CELL_PHENOTYPES, CELL_TYPE_IDS } from "@/lib/biology";
import type { Profile } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CellTypeSwitch({ profile }: { profile: Profile }) {
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CELL_TYPE_IDS.map((id) => {
        const phenotype = CELL_PHENOTYPES[id];
        const active = profile.cellType === id;
        return (
          <button
            key={id}
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await switchCellType(id);
                if (result.ok) toast.success(`Differentiated into ${phenotype.label}.`);
                else toast.error(result.error);
              })
            }
            className={cn(
              "rounded-[1.6rem] border p-4 text-left membrane",
              active ? "border-primary/70" : "border-border/60 opacity-75",
            )}
          >
            <p className="font-display text-xl" style={{ color: phenotype.accent }}>
              {phenotype.label}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {phenotype.epithet}
            </p>
          </button>
        );
      })}
    </div>
  );
}

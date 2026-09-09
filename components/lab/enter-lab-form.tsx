"use client";

import { useState, useTransition } from "react";
import { enterTheLab } from "@/app/actions/cell";
import { CELL_PHENOTYPES, CELL_TYPE_IDS, type CellType } from "@/lib/biology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function EnterLabForm() {
  const [cellType, setCellType] = useState<CellType>("epithelial");
  const [handle, setHandle] = useState("primary_culture");
  const [pending, start] = useTransition();

  return (
    <form
      className="mx-auto flex w-full max-w-3xl flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await enterTheLab({ handle, cellType });
          if (result && "error" in result) toast.error(result.error);
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {CELL_TYPE_IDS.map((id) => {
          const phenotype = CELL_PHENOTYPES[id];
          const selected = cellType === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCellType(id)}
              className={cn(
                "rounded-[1.8rem] border bg-black/30 p-4 text-left transition membrane",
                selected ? "border-primary/70" : "border-border/70 opacity-80 hover:opacity-100",
              )}
            >
              <span
                className="mb-3 block size-3 rounded-full"
                style={{ background: phenotype.accent, boxShadow: `0 0 16px ${phenotype.accent}` }}
              />
              <p className="font-display text-2xl">{phenotype.label}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {phenotype.epithet}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{phenotype.summary}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="handle">Cell handle</Label>
        <Input
          id="handle"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="keratin"
        />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        Seat this cell on the stage
      </Button>
    </form>
  );
}

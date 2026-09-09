import { switchCellTypeForm } from "@/app/actions/cell";
import { CELL_PHENOTYPES, CELL_TYPE_IDS } from "@/lib/biology";
import type { Profile } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { FormSubmit } from "./form-submit";

export function CellTypeSwitch({ profile }: { profile: Profile }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CELL_TYPE_IDS.map((id) => {
        const phenotype = CELL_PHENOTYPES[id];
        const active = profile.cellType === id;
        return (
          <form
            key={id}
            action={switchCellTypeForm}
            method="post"
            className={cn(
              "rounded-[1.6rem] border p-4 membrane",
              active ? "border-primary/70" : "border-border/60 opacity-75",
            )}
          >
            <input type="hidden" name="cellType" value={id} />
            <p className="font-display text-xl" style={{ color: phenotype.accent }}>
              {phenotype.label}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {phenotype.epithet}
            </p>
            <FormSubmit
              idle={active ? "Seated" : "Differentiate"}
              pendingLabel="Differentiating…"
              variant="ghost"
              className="mt-3"
            />
          </form>
        );
      })}
    </div>
  );
}

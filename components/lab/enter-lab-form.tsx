import { enterTheLabForm } from "@/app/actions/cell";
import { CELL_PHENOTYPES, CELL_TYPE_IDS } from "@/lib/biology";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSubmit } from "./form-submit";

export function EnterLabForm() {
  return (
    <form action={enterTheLabForm} method="post" className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {CELL_TYPE_IDS.map((id) => {
          const phenotype = CELL_PHENOTYPES[id];
          return (
            <label
              key={id}
              className="cursor-pointer rounded-[1.8rem] border border-border/70 bg-black/30 p-4 text-left transition membrane has-[:checked]:border-primary/70 has-[:checked]:opacity-100 opacity-80 hover:opacity-100"
            >
              <input
                type="radio"
                name="cellType"
                value={id}
                defaultChecked={id === "epithelial"}
                className="sr-only"
              />
              <span
                className="mb-3 block size-3 rounded-full"
                style={{ background: phenotype.accent, boxShadow: `0 0 16px ${phenotype.accent}` }}
              />
              <p className="font-display text-2xl">{phenotype.label}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {phenotype.epithet}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{phenotype.summary}</p>
            </label>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="handle">Cell handle</Label>
        <Input
          id="handle"
          name="handle"
          defaultValue="primary_culture"
          placeholder="keratin"
          minLength={3}
          required
        />
      </div>

      <FormSubmit idle="Seat this cell on the stage" pendingLabel="Seating…" size="lg" />
    </form>
  );
}

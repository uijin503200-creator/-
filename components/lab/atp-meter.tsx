import { CELL_PHENOTYPES } from "@/lib/biology";
import type { Profile } from "@/lib/data/types";
import { formatAtp } from "@/lib/utils";

export function AtpMeter({ profile }: { profile: Profile }) {
  const phenotype = CELL_PHENOTYPES[profile.cellType];

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-primary/80">Objective 40×</p>
        <h1 className="font-display text-3xl text-foreground">Central Dogma</h1>
      </div>
      <div className="flex items-center gap-3 rounded-full border border-border bg-card/70 px-4 py-2 backdrop-blur-md">
        <span
          className="size-2.5 rounded-full"
          style={{ background: phenotype.accent, boxShadow: `0 0 12px ${phenotype.accent}` }}
        />
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            @{profile.handle} · {phenotype.label}
          </p>
          <p className="font-mono text-sm text-primary">{formatAtp(profile.atpBalance)}</p>
        </div>
      </div>
    </header>
  );
}

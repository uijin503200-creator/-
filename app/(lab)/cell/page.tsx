import { CellTypeSwitch } from "@/components/lab/cell-type-switch";
import { MicroscopeStage } from "@/components/lab/microscope-stage";
import { CELL_PHENOTYPES, effectiveMutationChance } from "@/lib/biology";
import { requireSessionCell } from "@/lib/data";
import { formatAtp } from "@/lib/utils";

export default async function CellPage() {
  const { profile } = await requireSessionCell();
  if (!profile) return null;
  const phenotype = CELL_PHENOTYPES[profile.cellType];

  return (
    <MicroscopeStage>
      <p className="text-[11px] uppercase tracking-[0.28em] text-primary/80">Nucleus</p>
      <h2 className="mt-1 font-display text-4xl">@{profile.handle}</h2>
      <p className="mt-2 max-w-xl text-muted-foreground">{phenotype.summary}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-black/25 p-4">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ATP</dt>
          <dd className="font-mono text-xl text-primary">{formatAtp(profile.atpBalance)}</dd>
        </div>
        <div className="rounded-3xl border border-border bg-black/25 p-4">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Polymerase
          </dt>
          <dd className="font-mono text-xl">Lv {profile.polymeraseLevel}</dd>
        </div>
        <div className="rounded-3xl border border-border bg-black/25 p-4">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Mutation chance
          </dt>
          <dd className="font-mono text-xl">
            {(effectiveMutationChance(profile.cellType, profile.polymeraseLevel) * 100).toFixed(1)}%
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <CellTypeSwitch profile={profile} />
      </div>
    </MicroscopeStage>
  );
}

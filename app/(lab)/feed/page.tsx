import { MicroscopeStage } from "@/components/lab/microscope-stage";
import { VesicleCard } from "@/components/lab/vesicle-card";
import { requireSessionCell } from "@/lib/data";

export default async function FeedPage() {
  const { repo, profile } = await requireSessionCell();
  const feed = await repo.listFeed();

  return (
    <MicroscopeStage>
      <p className="text-[11px] uppercase tracking-[0.28em] text-primary/80">Microscope feed</p>
      <h2 className="mt-1 font-display text-4xl">Public vesicles on the stage</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Not a chat transcript — a wet-lab field of lipid vesicles. Each specimen still carries DNA,
        the mRNA that crossed the cytosol, and the protein the recipient ribosome folded.
      </p>
      <div className="mt-8 grid gap-4">
        {feed.map((vesicle) => (
          <VesicleCard
            key={vesicle.id}
            vesicle={vesicle}
            canRefold={
              !!profile &&
              (vesicle.recipientId === profile.id || vesicle.senderId === profile.id)
            }
          />
        ))}
      </div>
    </MicroscopeStage>
  );
}

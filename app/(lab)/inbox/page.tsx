import { MicroscopeStage } from "@/components/lab/microscope-stage";
import { VesicleCard } from "@/components/lab/vesicle-card";
import { requireSessionCell } from "@/lib/data";

export default async function InboxPage() {
  const { repo, profile } = await requireSessionCell();
  if (!profile) return null;
  const vesicles = await repo.listInbox(profile.id);

  return (
    <MicroscopeStage>
      <p className="text-[11px] uppercase tracking-[0.28em] text-mrna">Cytoplasm inbox</p>
      <h2 className="mt-1 font-display text-4xl">Vesicles in your cytosol</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Incoming and outgoing chains. Misfolded proteins can be rescued with chaperones from the
        IAP store.
      </p>
      <div className="mt-8 grid gap-4">
        {vesicles.length === 0 && (
          <p className="text-muted-foreground">No vesicles yet. Transcribe a DNA seed.</p>
        )}
        {vesicles.map((vesicle) => (
          <VesicleCard key={vesicle.id} vesicle={vesicle} canRefold />
        ))}
      </div>
    </MicroscopeStage>
  );
}

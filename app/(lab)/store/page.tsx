import { IapShelf } from "@/components/lab/iap-shelf";
import { MicroscopeStage } from "@/components/lab/microscope-stage";
import { requireSessionCell } from "@/lib/data";

export default async function StorePage() {
  const { profile } = await requireSessionCell();
  if (!profile) return null;

  return (
    <MicroscopeStage>
      <p className="text-[11px] uppercase tracking-[0.28em] text-protein">Reagent locker</p>
      <h2 className="mt-1 font-display text-4xl">IAP Store</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Spend ATP on organelles. Proofreading polymerase lowers transcription errors.
        Chaperone proteins refold <span className="font-mono">is_misfolded</span> vesicles.
      </p>
      <div className="mt-8">
        <IapShelf profile={profile} />
      </div>
    </MicroscopeStage>
  );
}

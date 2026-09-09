import { CytoplasmBackdrop } from "@/components/lab/cytoplasm-backdrop";
import { EnterLabForm } from "@/components/lab/enter-lab-form";
import { MicroscopeStage } from "@/components/lab/microscope-stage";
import { requireSessionCell } from "@/lib/data";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { profile } = await requireSessionCell();
  const params = await searchParams;

  return (
    <div className="relative min-h-dvh">
      <CytoplasmBackdrop />
      <MicroscopeStage>
        <p className="text-[11px] uppercase tracking-[0.32em] text-primary/80">Specimen intake</p>
        <h1 className="mt-2 max-w-xl font-display text-5xl leading-tight sm:text-6xl">
          A messenger that mutates in transit.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          You write DNA — the exact intent. Transcription packages it as mRNA for the network.
          The recipient ribosome translates that transcript into a Protein. Cell type, polymerase
          fidelity, and chaperones decide whether it folds.
        </p>
        {params.error && <p className="mt-4 text-sm text-misfold">{params.error}</p>}
        {profile && (
          <p className="mt-4 text-sm">
            <Link href="/feed" className="text-primary underline-offset-4 hover:underline">
              Continue as @{profile.handle} →
            </Link>
          </p>
        )}
        <div className="mt-10">
          <EnterLabForm />
        </div>
      </MicroscopeStage>
    </div>
  );
}

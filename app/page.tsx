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
        <p className="font-display text-6xl leading-none tracking-tight text-primary sm:text-7xl md:text-8xl">
          Central Dogma
        </p>
        <h1 className="mt-5 max-w-xl text-lg font-medium leading-snug text-foreground/90 sm:text-xl">
          A messenger that mutates in transit.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Write DNA. Transcription ships mRNA. The recipient ribosome folds the Protein — if it can.
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

import { TranscriptionForm } from "@/components/lab/transcription-form";
import { MicroscopeStage } from "@/components/lab/microscope-stage";
import { requireSessionCell } from "@/lib/data";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { repo, profile } = await requireSessionCell();
  if (!profile) return null;
  const recipients = (await repo.listProfiles()).filter((cell) => cell.id !== profile.id);
  const params = await searchParams;

  return (
    <MicroscopeStage>
      <p className="text-[11px] uppercase tracking-[0.28em] text-dna">Transcription chamber</p>
      <h2 className="mt-1 font-display text-4xl">Unwind the DNA seed</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Server action <span className="font-mono text-dna">transcribeDnaToMrna</span> applies your
        cell&apos;s mutation chance, then{" "}
        <span className="font-mono text-protein">translateMrnaToProtein</span> lets the recipient
        ribosome decode the transcript.
      </p>
      {params.error && <p className="mt-4 text-sm text-misfold">{params.error}</p>}
      <div className="mt-8">
        <TranscriptionForm me={profile} recipients={recipients} />
      </div>
    </MicroscopeStage>
  );
}

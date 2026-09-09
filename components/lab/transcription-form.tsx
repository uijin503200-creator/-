"use client";

import { useMemo, useState, useTransition } from "react";
import { transcribeDnaToMrna } from "@/app/actions/transcribe";
import { translateMrnaToProtein } from "@/app/actions/translate";
import { CELL_PHENOTYPES, effectiveMutationChance } from "@/lib/biology";
import type { Profile } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CodonStrand } from "./codon-strand";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TranscriptionForm({
  me,
  recipients,
}: {
  me: Profile;
  recipients: Profile[];
}) {
  const router = useRouter();
  const [dna, setDna] = useState("meet me at the tight junction after dusk");
  const [recipientId, setRecipientId] = useState(recipients[0]?.id ?? "");
  const [visibility, setVisibility] = useState<"direct" | "feed">("feed");
  const [pending, start] = useTransition();

  const chance = useMemo(
    () => effectiveMutationChance(me.cellType, me.polymeraseLevel),
    [me.cellType, me.polymeraseLevel],
  );
  const recipient = recipients.find((cell) => cell.id === recipientId);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const transcribed = await transcribeDnaToMrna({
            dnaSeed: dna,
            recipientId,
            visibility,
          });
          if (!transcribed.ok) {
            toast.error(transcribed.error);
            return;
          }
          toast.message("mRNA packaged into a vesicle.");
          const translated = await translateMrnaToProtein(transcribed.vesicle.id);
          if (!translated.ok) {
            toast.error(translated.error);
            return;
          }
          toast.success(
            translated.vesicle.isMisfolded
              ? "Ribosome produced a misfolded chain."
              : "Protein folded in the recipient cytoplasm.",
          );
          router.push("/inbox");
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="dna">DNA seed — exact intent</Label>
        <Textarea
          id="dna"
          value={dna}
          onChange={(event) => setDna(event.target.value)}
          className="min-h-32 font-mono"
        />
        <CodonStrand text={dna} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <Label>Recipient ribosome</Label>
          <div className="flex flex-wrap gap-2">
            {recipients.map((cell) => (
              <button
                key={cell.id}
                type="button"
                onClick={() => setRecipientId(cell.id)}
                className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                  recipientId === cell.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                @{cell.handle}
              </button>
            ))}
          </div>
          {recipient && (
            <p className="text-sm text-muted-foreground">
              {CELL_PHENOTYPES[recipient.cellType].epithet}
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <Label>Release path</Label>
          <div className="flex gap-2">
            {(["feed", "direct"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                  visibility === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {value === "feed" ? "Microscope feed" : "Private cytoplasm"}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Your {me.cellType} polymerase (Lv {me.polymeraseLevel}) mutates at{" "}
            {(chance * 100).toFixed(1)}%.
          </p>
        </fieldset>
      </div>

      <Button type="submit" size="lg" disabled={pending || !recipientId}>
        Transcribe → translate
      </Button>
    </form>
  );
}

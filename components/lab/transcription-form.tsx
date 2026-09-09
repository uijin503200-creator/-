"use client";

import { useFormStatus } from "react-dom";
import { sendVesicle } from "@/app/actions/transcribe";
import { CELL_PHENOTYPES, effectiveMutationChance } from "@/lib/biology";
import type { Profile } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CodonStrand } from "./codon-strand";
import { useState } from "react";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Ribosome reading…" : "Transcribe → translate"}
    </Button>
  );
}

export function TranscriptionForm({
  me,
  recipients,
}: {
  me: Profile;
  recipients: Profile[];
}) {
  const [dna, setDna] = useState("meet me at the tight junction after dusk");
  const chance = effectiveMutationChance(me.cellType, me.polymeraseLevel);
  const defaultRecipient = recipients[0]?.id ?? "";

  return (
    <form action={sendVesicle} method="post" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="dna">DNA seed — exact intent</Label>
        <Textarea
          id="dna"
          name="dnaSeed"
          value={dna}
          onChange={(event) => setDna(event.target.value)}
          className="min-h-32 font-mono"
          required
          minLength={3}
        />
        <CodonStrand text={dna} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <Label>Recipient ribosome</Label>
          <div className="flex flex-wrap gap-2">
            {recipients.map((cell, index) => (
              <label
                key={cell.id}
                className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
              >
                <input
                  type="radio"
                  name="recipientId"
                  value={cell.id}
                  defaultChecked={index === 0 || cell.id === defaultRecipient}
                  className="sr-only"
                />
                @{cell.handle}
              </label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {recipients[0]
              ? CELL_PHENOTYPES[recipients[0].cellType].epithet
              : "No other cells in culture."}
          </p>
        </fieldset>

        <fieldset className="space-y-2">
          <Label>Release path</Label>
          <div className="flex gap-2">
            {(["feed", "direct"] as const).map((value, index) => (
              <label
                key={value}
                className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
              >
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  defaultChecked={index === 0}
                  className="sr-only"
                />
                {value === "feed" ? "Microscope feed" : "Private cytoplasm"}
              </label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Your {me.cellType} polymerase (Lv {me.polymeraseLevel}) mutates at{" "}
            {(chance * 100).toFixed(1)}%.
          </p>
        </fieldset>
      </div>

      <SendButton />
    </form>
  );
}

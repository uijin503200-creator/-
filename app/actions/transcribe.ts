"use server";

import { randomUUID } from "node:crypto";
import { transcribeDnaToMrnaCore } from "@/lib/biology";
import { requireSessionCell } from "@/lib/data";
import type { Vesicle } from "@/lib/data/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { translateVesicle } from "./translate";

export type TranscribeResult =
  | { ok: true; vesicle: Vesicle }
  | { ok: false; error: string };

export async function transcribeDnaToMrna(input: {
  dnaSeed: string;
  recipientId: string;
  visibility?: "direct" | "feed";
}): Promise<TranscribeResult> {
  const { repo, profile } = await requireSessionCell();
  if (!profile) return { ok: false, error: "No cell is seated in this microscope." };

  const dnaSeed = input.dnaSeed.trim();
  if (dnaSeed.length < 3) {
    return { ok: false, error: "DNA seed is too short to unwind." };
  }

  const recipient = await repo.getProfile(input.recipientId);
  if (!recipient) return { ok: false, error: "Recipient cell not found." };

  try {
    const mrnaTranscript = transcribeDnaToMrnaCore({
      dnaSeed,
      senderCellType: profile.cellType,
      polymeraseLevel: profile.polymeraseLevel,
      entropy: randomUUID(),
    });

    const vesicle = await repo.insertVesicle({
      id: randomUUID(),
      senderId: profile.id,
      recipientId: recipient.id,
      dnaSeed,
      mrnaTranscript,
      proteinResult: null,
      isMisfolded: false,
      status: "in_transit",
      visibility: input.visibility ?? "direct",
      mutationCount: mrnaTranscript.mutations.filter((event) => !event.proofread).length,
      transcriptionFidelity: mrnaTranscript.fidelity,
      translationLatencyMs: null,
      translationNotes: [],
      chaperoneApplied: false,
      createdAt: new Date().toISOString(),
      translatedAt: null,
    });

    revalidatePath("/inbox");
    revalidatePath("/feed");
    revalidatePath("/compose");
    return { ok: true, vesicle };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Transcription failed." };
  }
}

export async function sendVesicle(formData: FormData): Promise<void> {
  const dnaSeed = String(formData.get("dnaSeed") ?? "");
  const recipientId = String(formData.get("recipientId") ?? "");
  const visibility = formData.get("visibility") === "direct" ? "direct" : "feed";

  const transcribed = await transcribeDnaToMrna({ dnaSeed, recipientId, visibility });
  if (!transcribed.ok) {
    redirect(`/compose?error=${encodeURIComponent(transcribed.error)}`);
    return;
  }

  const translated = await translateVesicle(transcribed.vesicle.id);
  if (!translated.ok) {
    redirect(`/compose?error=${encodeURIComponent(translated.error)}`);
    return;
  }

  redirect("/inbox");
}

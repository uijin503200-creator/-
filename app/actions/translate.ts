"use server";

import { decodeWithLlmRibosome } from "@/lib/ai/ribosome";
import { translateMrnaToProteinCore } from "@/lib/biology";
import { requireSessionCell } from "@/lib/data";
import type { Vesicle } from "@/lib/data/types";
import { revalidatePath } from "next/cache";

export type TranslateResult =
  | { ok: true; vesicle: Vesicle }
  | { ok: false; error: string };

export async function translateMrnaToProtein(vesicleId: string): Promise<TranslateResult> {
  const { repo, profile } = await requireSessionCell();
  if (!profile) return { ok: false, error: "No cell is seated in this microscope." };

  const current = await repo.getVesicle(vesicleId);
  if (!current) return { ok: false, error: "Vesicle not found." };
  if (current.senderId !== profile.id && current.recipientId !== profile.id) {
    return { ok: false, error: "This vesicle is outside your cytoplasm." };
  }

  try {
    const llmProtein = await decodeWithLlmRibosome({
      transcript: current.mrnaTranscript,
      recipientCellType: current.recipient.cellType,
    });

    const translation = translateMrnaToProteinCore({
      transcript: current.mrnaTranscript,
      recipientCellType: current.recipient.cellType,
      llmProtein: llmProtein ?? undefined,
    });

    const status = translation.phagocytosed
      ? "phagocytosed"
      : translation.isMisfolded
        ? "misfolded"
        : "folded";

    const vesicle = await repo.updateVesicle(vesicleId, {
      proteinResult: translation.protein,
      isMisfolded: translation.isMisfolded,
      status,
      translationLatencyMs: translation.latencyMs,
      translationNotes: translation.notes,
      translatedAt: new Date().toISOString(),
    });

    revalidatePath("/inbox");
    revalidatePath("/feed");
    revalidatePath("/compose");
    return { ok: true, vesicle };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Translation failed." };
  }
}

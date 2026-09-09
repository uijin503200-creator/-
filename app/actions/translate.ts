"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  RIBOSOME_MODEL_ID,
  buildRibosomeSystemPrompt,
  buildRibosomeUserPrompt,
  isRibosomeLlmConfigured,
  normalizeCellType,
  ribosomeTemperature,
} from "@/lib/ai/ribosome";
import { translateMrnaToProteinCore, type MrnaTranscript } from "@/lib/biology";
import { requireSessionCell } from "@/lib/data";
import type { Vesicle } from "@/lib/data/types";
import { revalidatePath } from "next/cache";

/**
 * Simulates the recipient's ribosome reading the mRNA and returns the final Protein string.
 *
 * `mrna_transcript` accepts either the plain transcript text or a serialized
 * transcript envelope; `cell_type` selects the ribosome override inside the
 * engineering system prompt (see RIBOSOME_SYSTEM_PROMPT).
 */
export async function translateMrnaToProtein(
  mrna_transcript: string,
  cell_type: string,
): Promise<string> {
  if (!isRibosomeLlmConfigured()) {
    return localRibosome(mrna_transcript, cell_type);
  }

  const { text } = await generateText({
    model: openai(RIBOSOME_MODEL_ID),
    temperature: ribosomeTemperature(cell_type),
    system: buildRibosomeSystemPrompt(cell_type),
    prompt: buildRibosomeUserPrompt(mrna_transcript, cell_type),
  });

  return text.trim();
}

/** Offline ribosome so the lab still translates without an OpenAI key. */
function localRibosome(mrna_transcript: string, cell_type: string) {
  const recipientCellType = normalizeCellType(cell_type);
  return translateMrnaToProteinCore({
    transcript: parseTranscript(mrna_transcript, recipientCellType),
    recipientCellType,
  }).protein;
}

function parseTranscript(mrna_transcript: string, cellType: ReturnType<typeof normalizeCellType>) {
  try {
    const parsed = JSON.parse(mrna_transcript) as MrnaTranscript;
    if (parsed && typeof parsed.plain === "string") return parsed;
  } catch {
    // Plain-text transcript, not an envelope.
  }

  return {
    version: 1,
    encoding: "codon-v1",
    sequence: "",
    plain: mrna_transcript,
    mutations: [],
    fidelity: 1,
    polymerase: "standard",
    polymeraseLevel: 0,
    senderCellType: cellType,
    mutationChance: 0,
  } satisfies MrnaTranscript;
}

export type TranslateResult =
  | { ok: true; vesicle: Vesicle }
  | { ok: false; error: string };

/**
 * Runs a stored vesicle through the recipient ribosome and persists the folding outcome
 * (protein_result, is_misfolded, latency) alongside the LLM's Protein string.
 */
export async function translateVesicle(vesicleId: string): Promise<TranslateResult> {
  const { repo, profile } = await requireSessionCell();
  if (!profile) return { ok: false, error: "No cell is seated in this microscope." };

  const current = await repo.getVesicle(vesicleId);
  if (!current) return { ok: false, error: "Vesicle not found." };
  if (current.senderId !== profile.id && current.recipientId !== profile.id) {
    return { ok: false, error: "This vesicle is outside your cytoplasm." };
  }

  try {
    const llmProtein = isRibosomeLlmConfigured()
      ? await translateMrnaToProtein(
          JSON.stringify(current.mrnaTranscript),
          current.recipient.cellType,
        )
      : undefined;

    const translation = translateMrnaToProteinCore({
      transcript: current.mrnaTranscript,
      recipientCellType: current.recipient.cellType,
      llmProtein,
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

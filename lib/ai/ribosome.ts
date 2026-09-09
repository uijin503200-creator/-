import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { CELL_PHENOTYPES, type CellType, type MrnaTranscript } from "@/lib/biology";

/**
 * Vercel AI SDK seam for the recipient ribosome.
 *
 * Wire this up by setting OPENAI_API_KEY. Until then, translation uses the
 * deterministic local ribosome in lib/biology/translate.ts so the lab runs offline.
 */
export async function decodeWithLlmRibosome(input: {
  transcript: MrnaTranscript;
  recipientCellType: CellType;
}): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const phenotype = CELL_PHENOTYPES[input.recipientCellType];
  const modelId = process.env.OPENAI_RIBOSOME_MODEL ?? "gpt-4o-mini";

  const { text } = await generateText({
    model: openai(modelId),
    temperature: phenotype.translationTemperature,
    system: [
      `You are a ${phenotype.label} cell ribosome (${phenotype.ribosome}).`,
      phenotype.summary,
      "Decode the incoming mRNA into a short Protein string (the message User B sees).",
      "Honor cell_type: epithelial stays faithful, macrophage is wary and may refuse damaged transcripts,",
      "oncogenic is noisy, truncated, or over-expressive.",
      "If the transcript fidelity is low, you may misfold: return a broken/garbled protein.",
      "Never mention that you are an LLM. Stay inside the Central Dogma metaphor.",
    ].join(" "),
    prompt: JSON.stringify(
      {
        mrna_transcript: input.transcript,
        cell_type: input.recipientCellType,
      },
      null,
      2,
    ),
  });

  return text.trim();
}

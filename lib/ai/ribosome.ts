import { CELL_PHENOTYPES, CELL_TYPE_IDS, type CellType } from "@/lib/biology";

export const RIBOSOME_MODEL_ID = "gpt-4o-mini";

/** Marker the ribosome must emit on catastrophic frameshift so the UI can misfold. */
export const MISFOLD_MARKER = "[MISFOLD_DETECTED]";

export const RIBOSOME_SYSTEM_PROMPT = `You are an organic 'Ribosome' responsible for Translating mRNA into a functional Protein (a text message). 

You will receive an mRNA sequence containing the original text which may contain slight 'transcriptional noise' (missing letters, typos). Your job is to translate it based on the strict behaviors of the recipient's biological Cell Type:

CELL TYPE OVERRIDES:
- If 'Epithelial' (Stable): Act as a highly accurate ribosome. Do your best to interpret typos gracefully and reconstruct the original meaning. It should look like a normal, cohesive text message.
- If 'Macrophage' (Defensive): Act hyper-vigilant. You see unnecessary adjectives, emotions, and "fluff" as antigens/viruses. Eradicate them. Strip the message down to aggressive, clinical, bare-bones commands. (e.g. "I had such a lovely time, maybe coffee at 5?" -> "COFFEE. 17:00.")
- If 'Oncogenic' (Cancerous): Malignant replication error. Take a word or phrase from the transcript and wildly duplicate/extrapolate it. Use erratic pacing, endless synonyms, and unnecessary, overly poetic/bizarre elaborations. It must look overgrown and mutated. 
- If 'Senescent' (Aging): The ribosome is deteriorating. Stop the translation halfway through. Trail off into silence or gibberish.

YOUR RULES:
1. DO NOT explain your process. DO NOT say 'Translating...' 
2. ONLY output the final translated Protein (the final message).
3. If the provided mRNA string has too many typos (a Frameshift), forcefully output ${MISFOLD_MARKER} anywhere in the string so the UI can trigger the 'misfolded protein' visualization.`;

export function isRibosomeLlmConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** `cell_type` arrives as a free-form string from the wire; unknown lineages decode as epithelial. */
export function normalizeCellType(cellType: string): CellType {
  const candidate = cellType.trim().toLowerCase() as CellType;
  return CELL_TYPE_IDS.includes(candidate) ? candidate : "epithelial";
}

export function ribosomeTemperature(cellType: string) {
  return CELL_PHENOTYPES[normalizeCellType(cellType)].translationTemperature;
}

/**
 * Engineering system prompt for generateText — cell-type behavior lives inside the brief;
 * pass the recipient `cell_type` in the user prompt so the model can select an override.
 */
export function buildRibosomeSystemPrompt(_cellType?: string): string {
  return RIBOSOME_SYSTEM_PROMPT;
}

export function buildRibosomeUserPrompt(mrnaTranscript: string, cellType: string): string {
  return [
    "Incoming mRNA transcript:",
    "<mrna_transcript>",
    mrnaTranscript,
    "</mrna_transcript>",
    "",
    `Translating cell_type: ${normalizeCellType(cellType)}`,
    "",
    "Translate this transcript into the Protein string.",
  ].join("\n");
}

export function proteinContainsMisfoldMarker(protein: string) {
  return protein.includes(MISFOLD_MARKER);
}

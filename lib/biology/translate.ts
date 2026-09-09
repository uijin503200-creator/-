import { CELL_PHENOTYPES } from "./cell-types";
import { createRng, hashSeed, randInt, type Rng } from "./rng";
import type { CellType, MrnaTranscript, ProteinTranslation } from "./types";

const DRIFT: Record<string, string[]> = {
  hello: ["saline hello", "membrane ping", "hello-ish"],
  meet: ["dock", "adhere", "synapse"],
  later: ["downstream", "after anaphase", "later"],
  love: ["ligand affinity", "love", "tight-junction warmth"],
  sorry: ["apoptosis apology", "sorry", "mismatch repair"],
  yes: ["phosphorylated yes", "yes", "go-signal"],
  no: ["checkpoint halt", "no", "contact inhibition"],
};

function driftText(plain: string, intensity: number, rng: Rng) {
  return plain
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token) || rng() > intensity) return token;
      const key = token.toLowerCase().replace(/[^a-z]/g, "");
      const options = DRIFT[key];
      if (options?.length) {
        return options[Math.floor(rng() * options.length)] ?? token;
      }
      if (intensity > 0.7 && rng() < 0.35) {
        return `${token}Δ`;
      }
      return token;
    })
    .join("");
}

function misfoldRender(text: string) {
  const scrambled = text
    .split("")
    .map((char, index) => (index % 4 === 0 ? char.toUpperCase() : char))
    .join("");
  return `⚠ MISFOLDED AGGREGATE  {${scrambled}}`;
}

export type TranslateInput = {
  transcript: MrnaTranscript;
  recipientCellType: CellType;
  rng?: Rng;
  entropy?: string;
  llmProtein?: string;
};

export function translateMrnaToProteinCore(input: TranslateInput): ProteinTranslation {
  const phenotype = CELL_PHENOTYPES[input.recipientCellType];
  const rng =
    input.rng ??
    createRng(
      hashSeed(
        `${input.transcript.plain}|${input.recipientCellType}|${input.transcript.fidelity}|${input.entropy ?? ""}`,
      ),
    );

  const mutationLoad = 1 - input.transcript.fidelity;
  const notes: string[] = [];
  const latencyMs = randInt(rng, phenotype.latencyMs[0], phenotype.latencyMs[1]);

  if (input.recipientCellType === "macrophage" && mutationLoad > 0.18 && rng() < phenotype.defense) {
    return {
      protein: "∅ PHAGOCYTOSED — damaged mRNA destroyed in the phagolysosome.",
      isMisfolded: true,
      latencyMs,
      ribosome: phenotype.ribosome,
      notes: ["Macrophage innate defense recognized codon lesions."],
      phagocytosed: true,
    };
  }

  let protein = input.llmProtein?.trim() || input.transcript.plain;
  protein = driftText(protein, phenotype.translationTemperature / 1.4, rng);

  if (input.recipientCellType === "oncogenic" && rng() < 0.45) {
    protein = `${protein} [unlicensed splice variant]`;
    notes.push("Oncogenic ribosome accepted a cryptic start site.");
  }

  if (input.recipientCellType === "epithelial") {
    notes.push("Housekeeping ribosome applied synonymous decoding.");
  }

  const nonsense = input.transcript.mutations.some((event) => event.kind === "nonsense" && !event.proofread);
  const frameshift = input.transcript.mutations.some((event) => event.kind === "frameshift" && !event.proofread);
  const isMisfolded =
    nonsense || frameshift || mutationLoad >= phenotype.misfoldThreshold || /Δ|variant/.test(protein) && mutationLoad > 0.12;

  if (isMisfolded) {
    protein = misfoldRender(protein);
    notes.push("Nascent chain failed the folding checkpoint.");
  }

  return {
    protein,
    isMisfolded,
    latencyMs,
    ribosome: phenotype.ribosome,
    notes,
    phagocytosed: false,
  };
}

export function refoldWithChaperone(dnaSeed: string, previousProtein: string): ProteinTranslation {
  return {
    protein: `↻ chaperone-refolded · ${dnaSeed.trim()}`,
    isMisfolded: false,
    latencyMs: 180,
    ribosome: "Hsp70 / Hsp90 barrel",
    notes: [`Recovered from ${previousProtein.slice(0, 48)}…`],
    phagocytosed: false,
  };
}

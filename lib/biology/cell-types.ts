import type { CellType } from "./types";

export type CellPhenotype = {
  id: CellType;
  label: string;
  epithet: string;
  ribosome: string;
  summary: string;
  /** Probability a codon/token mutates during transcription. */
  baseMutationRate: number;
  /** LLM / local-ribosome sampling temperature. */
  translationTemperature: number;
  latencyMs: [number, number];
  /** Mutation load above this marks the protein misfolded. */
  misfoldThreshold: number;
  /** Chance a macrophage destroys a damaged transcript. */
  defense: number;
  accent: string;
};

export const CELL_PHENOTYPES: Record<CellType, CellPhenotype> = {
  epithelial: {
    id: "epithelial",
    label: "Epithelial",
    epithet: "Standard Ribosome",
    ribosome: "80S housekeeper",
    summary:
      "Barrier cell. Faithful transcription, modest synonymous drift at the ribosome.",
    baseMutationRate: 0.08,
    translationTemperature: 0.35,
    latencyMs: [90, 220],
    misfoldThreshold: 0.22,
    defense: 0.12,
    accent: "#67e8f9",
  },
  macrophage: {
    id: "macrophage",
    label: "Macrophage",
    epithet: "High defense / latency",
    ribosome: "Phagolysosomal ribosome",
    summary:
      "Immune sentinel. Slow to translate, aggressive toward mutated transcripts.",
    baseMutationRate: 0.035,
    translationTemperature: 0.18,
    latencyMs: [420, 960],
    misfoldThreshold: 0.12,
    defense: 0.62,
    accent: "#4ade80",
  },
  oncogenic: {
    id: "oncogenic",
    label: "Oncogenic",
    epithet: "High error / mutation rate",
    ribosome: "Unlicensed polymerase",
    summary:
      "Transformed lineage. Replication stress, frameshifts, and noisy protein folding.",
    baseMutationRate: 0.3,
    translationTemperature: 1.15,
    latencyMs: [40, 150],
    misfoldThreshold: 0.16,
    defense: 0.03,
    accent: "#fb7185",
  },
};

export function polymeraseMutationMultiplier(level: number) {
  const clamped = Math.min(3, Math.max(0, Math.floor(level)));
  return 0.55 ** clamped;
}

export function effectiveMutationChance(cellType: CellType, polymeraseLevel: number) {
  const phenotype = CELL_PHENOTYPES[cellType];
  return phenotype.baseMutationRate * polymeraseMutationMultiplier(polymeraseLevel);
}

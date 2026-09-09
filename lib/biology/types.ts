export const CELL_TYPE_IDS = ["epithelial", "macrophage", "oncogenic"] as const;
export type CellType = (typeof CELL_TYPE_IDS)[number];

export const MUTATION_KINDS = [
  "substitution",
  "insertion",
  "deletion",
  "frameshift",
  "nonsense",
] as const;
export type MutationKind = (typeof MUTATION_KINDS)[number];

export type MutationEvent = {
  kind: MutationKind;
  position: number;
  from: string;
  to: string;
  proofread: boolean;
};

export type MrnaTranscript = {
  version: 1;
  encoding: "codon-v1";
  sequence: string;
  plain: string;
  mutations: MutationEvent[];
  fidelity: number;
  polymerase: "standard" | "proofreading";
  polymeraseLevel: number;
  senderCellType: CellType;
  mutationChance: number;
};

export type ProteinTranslation = {
  protein: string;
  isMisfolded: boolean;
  latencyMs: number;
  ribosome: string;
  notes: string[];
  phagocytosed: boolean;
};

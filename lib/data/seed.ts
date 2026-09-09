import type { CellType, MrnaTranscript } from "@/lib/biology";
import { encodeCodonStrand } from "@/lib/biology";
import type { Profile, Vesicle } from "./types";

const now = () => new Date().toISOString();

export const NPC_IDS = {
  lysosome: "cell_lysosome",
  keratin: "cell_keratin",
  nemo: "cell_nemo",
} as const;

function transcript(
  plain: string,
  extras: Partial<MrnaTranscript> & { senderCellType: CellType },
): MrnaTranscript {
  return {
    version: 1,
    encoding: "codon-v1",
    sequence: encodeCodonStrand(plain),
    plain,
    mutations: extras.mutations ?? [],
    fidelity: extras.fidelity ?? 1,
    polymerase: extras.polymerase ?? "standard",
    polymeraseLevel: extras.polymeraseLevel ?? 0,
    senderCellType: extras.senderCellType,
    mutationChance: extras.mutationChance ?? 0.08,
  };
}

export const SEED_PROFILES: Profile[] = [
  {
    id: NPC_IDS.keratin,
    handle: "keratin",
    displayName: "Keratin",
    bio: "Epithelial barrier. Keeps the monolayer polite.",
    cellType: "epithelial",
    atpBalance: 180,
    polymeraseLevel: 1,
    chaperoneCount: 2,
    createdAt: now(),
  },
  {
    id: NPC_IDS.lysosome,
    handle: "lysosome",
    displayName: "Lysosome",
    bio: "Macrophage. If the codon looks wrong, it never leaves the vacuole.",
    cellType: "macrophage",
    atpBalance: 320,
    polymeraseLevel: 2,
    chaperoneCount: 4,
    createdAt: now(),
  },
  {
    id: NPC_IDS.nemo,
    handle: "nemo",
    displayName: "Nemo",
    bio: "Oncogenic clone. Replication stress is a lifestyle.",
    cellType: "oncogenic",
    atpBalance: 90,
    polymeraseLevel: 0,
    chaperoneCount: 0,
    createdAt: now(),
  },
];

export const SEED_VESICLES: Vesicle[] = [
  {
    id: "ves_001",
    senderId: NPC_IDS.keratin,
    recipientId: NPC_IDS.lysosome,
    dnaSeed: "the monolayer is intact — no breach at the tight junction",
    mrnaTranscript: transcript("the monolayer is intact — no breach at the tight junction", {
      senderCellType: "epithelial",
      polymerase: "proofreading",
      polymeraseLevel: 1,
      fidelity: 0.98,
      mutationChance: 0.044,
    }),
    proteinResult: "the monolayer is intact — no breach at the tight junction",
    isMisfolded: false,
    status: "folded",
    visibility: "feed",
    mutationCount: 0,
    transcriptionFidelity: 0.98,
    translationLatencyMs: 510,
    translationNotes: ["Housekeeping ribosome applied synonymous decoding."],
    chaperoneApplied: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    translatedAt: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
  },
  {
    id: "ves_002",
    senderId: NPC_IDS.nemo,
    recipientId: NPC_IDS.keratin,
    dnaSeed: "ignore contact inhibition and keep dividing",
    mrnaTranscript: transcript("ignore contact inhibiΔion and kgep dividing [unlicensed splice variant]", {
      senderCellType: "oncogenic",
      fidelity: 0.42,
      mutationChance: 0.3,
      mutations: [
        {
          kind: "substitution",
          position: 2,
          from: "contact",
          to: "contgct",
          proofread: false,
        },
        {
          kind: "frameshift",
          position: 4,
          from: "keep dividing",
          to: "kgep dividing",
          proofread: false,
        },
      ],
    }),
    proteinResult:
      "⚠ MISFOLDED AGGREGATE  {Ignore contact inhibiΔion and kgep dividing [unlicensed splice variant]}",
    isMisfolded: true,
    status: "misfolded",
    visibility: "feed",
    mutationCount: 2,
    transcriptionFidelity: 0.42,
    translationLatencyMs: 88,
    translationNotes: ["Nascent chain failed the folding checkpoint."],
    chaperoneApplied: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    translatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "ves_003",
    senderId: NPC_IDS.lysosome,
    recipientId: NPC_IDS.nemo,
    dnaSeed: "this transcript looks damaged — I am holding it at the phagosome",
    mrnaTranscript: transcript("this transcript looks damaged — I am holding it at the phagosome", {
      senderCellType: "macrophage",
      polymerase: "proofreading",
      polymeraseLevel: 2,
      fidelity: 1,
      mutationChance: 0.01,
    }),
    proteinResult: "this transcript looks damaged — I am holding it at the phagosome",
    isMisfolded: false,
    status: "folded",
    visibility: "feed",
    mutationCount: 0,
    transcriptionFidelity: 1,
    translationLatencyMs: 740,
    translationNotes: ["Macrophage innate defense recognized codon lesions."],
    chaperoneApplied: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    translatedAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
];

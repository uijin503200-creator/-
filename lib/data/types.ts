import type { CellType } from "@/lib/biology";

export const ORGANELLE_SLUGS = ["proofreading_polymerase", "chaperone_protein"] as const;
export type OrganelleSlug = (typeof ORGANELLE_SLUGS)[number];

export type OrganelleItem = {
  slug: OrganelleSlug;
  name: string;
  tagline: string;
  description: string;
  priceAtp: number;
  stackable: boolean;
  effect: string;
};

export type Profile = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  cellType: CellType;
  atpBalance: number;
  polymeraseLevel: number;
  chaperoneCount: number;
  createdAt: string;
};

export type VesicleStatus =
  | "transcribing"
  | "in_transit"
  | "translating"
  | "folded"
  | "misfolded"
  | "refolded"
  | "phagocytosed";

export type Vesicle = {
  id: string;
  senderId: string;
  recipientId: string;
  dnaSeed: string;
  mrnaTranscript: import("@/lib/biology").MrnaTranscript;
  proteinResult: string | null;
  isMisfolded: boolean;
  status: VesicleStatus;
  visibility: "direct" | "feed";
  mutationCount: number;
  transcriptionFidelity: number;
  translationLatencyMs: number | null;
  translationNotes: string[];
  chaperoneApplied: boolean;
  createdAt: string;
  translatedAt: string | null;
};

export type VesicleWithCells = Vesicle & {
  sender: Profile;
  recipient: Profile;
};

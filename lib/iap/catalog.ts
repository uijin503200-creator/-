import type { OrganelleItem } from "@/lib/data/types";

export const ORGANELLE_CATALOG: OrganelleItem[] = [
  {
    slug: "proofreading_polymerase",
    name: "Proofreading Polymerase",
    tagline: "3′–5′ exonuclease clamp",
    description:
      "Lowers transcription error rate geometrically (×0.55 per level, max 3). The clamp proofreads substitutions before mRNA leaves the nucleus.",
    priceAtp: 80,
    stackable: false,
    effect: "Reduces mutation chance on transcribeDnaToMrna",
  },
  {
    slug: "chaperone_protein",
    name: "Chaperone Proteins",
    tagline: "Hsp70 / Hsp90 folding barrel",
    description:
      "Consumable. Binds a misfolded vesicle and rewrites protein_result from the original dna_seed, clearing is_misfolded.",
    priceAtp: 35,
    stackable: true,
    effect: "Fixes is_misfolded messages",
  },
];

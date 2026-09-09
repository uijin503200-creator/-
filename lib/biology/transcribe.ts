import {
  CELL_PHENOTYPES,
  effectiveMutationChance,
} from "./cell-types";
import { encodeCodonStrand } from "./codons";
import { createRng, hashSeed, type Rng } from "./rng";
import type { CellType, MrnaTranscript, MutationEvent } from "./types";
import { transcribeDnaToMrnaWithLesions } from "@/lib/transcription-biology";

export type TranscribeInput = {
  dnaSeed: string;
  senderCellType: CellType;
  polymeraseLevel: number;
  rng?: Rng;
  entropy?: string;
};

function lesionToMutation(
  lesion: ReturnType<typeof transcribeDnaToMrnaWithLesions>["lesions"][number],
  proofread: boolean,
): MutationEvent {
  if (lesion.kind === "point") {
    return {
      kind: "substitution",
      position: lesion.index,
      from: lesion.from,
      to: proofread ? lesion.from : lesion.to,
      proofread,
    };
  }
  if (lesion.kind === "deletion") {
    return {
      kind: "deletion",
      position: lesion.index,
      from: lesion.from,
      to: proofread ? lesion.from : "",
      proofread,
    };
  }
  return {
    kind: lesion.kind === "insertion" ? "insertion" : "frameshift",
    position: lesion.index,
    from: "",
    to: proofread ? "" : lesion.inserted,
    proofread,
  };
}

/**
 * Build the network mRNA envelope. Character-level battering lives in
 * {@link transcribeDnaToMrna} (`lib/transcription-biology.ts`); this wrapper
 * attaches codon encoding, fidelity, and polymerase metadata.
 */
export function transcribeDnaToMrnaCore(input: TranscribeInput): MrnaTranscript {
  const dnaSeed = input.dnaSeed.trim();
  if (!dnaSeed) {
    throw new Error("DNA seed is empty — nucleolus refused transcription.");
  }

  const polymeraseLevel = Math.min(3, Math.max(0, Math.floor(input.polymeraseLevel)));
  const mutationChance = effectiveMutationChance(input.senderCellType, polymeraseLevel);
  const frameShiftChance = mutationChance * 0.4;
  const rng =
    input.rng ??
    createRng(hashSeed(`${dnaSeed}|${input.senderCellType}|${polymeraseLevel}|${input.entropy ?? ""}`));

  const { mrna, lesions } = transcribeDnaToMrnaWithLesions(
    dnaSeed,
    mutationChance,
    frameShiftChance,
    rng,
  );

  // Residual exonuclease pass: high polymerase levels can still snap some lesions back.
  const proofreadChance = polymeraseLevel > 0 ? 1 - 0.55 ** polymeraseLevel : 0;
  const mutations: MutationEvent[] = [];
  let plain = mrna;

  if (proofreadChance > 0 && lesions.length > 0) {
    // Re-synthesize from DNA, skipping lesions the clamp catches.
    plain = "";
    let lesionCursor = 0;
    for (let index = 0; index < dnaSeed.length; index += 1) {
      const char = dnaSeed[index] ?? "";
      const lesion = lesions[lesionCursor];
      if (lesion && lesion.index === index) {
        lesionCursor += 1;
        const corrected = rng() < proofreadChance;
        mutations.push(lesionToMutation(lesion, corrected));
        if (corrected) {
          plain += char;
          continue;
        }
        if (lesion.kind === "deletion") continue;
        if (lesion.kind === "insertion") {
          plain += char + lesion.inserted;
          continue;
        }
        plain += lesion.to;
        continue;
      }
      plain += char;
    }
    // Trailing lesions (should not happen) fall through.
    while (lesionCursor < lesions.length) {
      mutations.push(lesionToMutation(lesions[lesionCursor]!, false));
      lesionCursor += 1;
    }
  } else {
    for (const lesion of lesions) {
      mutations.push(lesionToMutation(lesion, false));
    }
  }

  plain = plain.replace(/\s+/g, " ").trim();
  const uncorrected = mutations.filter((event) => !event.proofread).length;
  const fidelity = Math.max(0, 1 - uncorrected / Math.max(dnaSeed.length, 1));

  // Mark multi-base indel storms as frameshifts for downstream folding checks.
  if (mutations.filter((event) => event.kind === "deletion" || event.kind === "insertion").length >= 2) {
    mutations.push({
      kind: "frameshift",
      position: 0,
      from: dnaSeed,
      to: plain,
      proofread: false,
    });
  }

  return {
    version: 1,
    encoding: "codon-v1",
    sequence: encodeCodonStrand(plain),
    plain,
    mutations,
    fidelity: Number(fidelity.toFixed(4)),
    polymerase: polymeraseLevel > 0 ? "proofreading" : "standard",
    polymeraseLevel,
    senderCellType: input.senderCellType,
    mutationChance: Number(mutationChance.toFixed(4)),
  };
}

export function describeCellForPrompt(cellType: CellType) {
  return CELL_PHENOTYPES[cellType];
}

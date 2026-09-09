import {
  CELL_PHENOTYPES,
  effectiveMutationChance,
} from "./cell-types";
import { encodeCodonStrand } from "./codons";
import { createRng, hashSeed, pick, type Rng } from "./rng";
import type { CellType, MrnaTranscript, MutationEvent } from "./types";

const TRANSITIONS: Record<string, string> = {
  a: "g",
  g: "a",
  c: "u",
  u: "c",
  t: "c",
  e: "i",
  i: "e",
  o: "u",
  A: "G",
  G: "A",
  C: "T",
  T: "C",
  E: "I",
  I: "E",
  O: "U",
};

function tokenize(dna: string) {
  return dna.match(/\s+|[^\s]+/g) ?? [dna];
}

function mutateToken(token: string, rng: Rng): { next: string; kind: MutationEvent["kind"] } {
  if (/^\s+$/.test(token)) {
    return { next: token, kind: "substitution" };
  }

  const roll = rng();
  if (roll < 0.45) {
    const chars = token.split("");
    const idx = Math.floor(rng() * chars.length);
    const current = chars[idx] ?? "a";
    chars[idx] = TRANSITIONS[current] ?? String.fromCharCode(current.charCodeAt(0) + 1);
    return { next: chars.join(""), kind: "substitution" };
  }
  if (roll < 0.7) {
    const insert = pick(rng, ["aa", "ug", "poly", "Δ"]);
    return { next: `${token}${insert}`, kind: "insertion" };
  }
  if (roll < 0.9) {
    if (token.length <= 2) {
      return { next: token.slice(0, 1), kind: "deletion" };
    }
    const start = Math.floor(rng() * (token.length - 1));
    return { next: token.slice(0, start) + token.slice(start + 1), kind: "deletion" };
  }
  return { next: "", kind: "nonsense" };
}

function frameshiftFrom(tokens: string[], at: number) {
  return tokens.map((token, index) => {
    if (index < at || /^\s+$/.test(token)) return token;
    const rotated = `${token.slice(1)}${token.slice(0, 1)}`;
    return rotated.toLowerCase();
  });
}

export type TranscribeInput = {
  dnaSeed: string;
  senderCellType: CellType;
  polymeraseLevel: number;
  rng?: Rng;
  entropy?: string;
};

export function transcribeDnaToMrnaCore(input: TranscribeInput): MrnaTranscript {
  const dnaSeed = input.dnaSeed.trim();
  if (!dnaSeed) {
    throw new Error("DNA seed is empty — nucleolus refused transcription.");
  }

  const polymeraseLevel = Math.min(3, Math.max(0, Math.floor(input.polymeraseLevel)));
  const mutationChance = effectiveMutationChance(input.senderCellType, polymeraseLevel);
  const rng =
    input.rng ??
    createRng(hashSeed(`${dnaSeed}|${input.senderCellType}|${polymeraseLevel}|${input.entropy ?? ""}`));

  const tokens = tokenize(dnaSeed);
  const mutations: MutationEvent[] = [];
  const nextTokens = [...tokens];

  nextTokens.forEach((token, position) => {
    if (/^\s+$/.test(token)) return;
    if (rng() >= mutationChance) return;

    const mutated = mutateToken(token, rng);
    const corrected = polymeraseLevel > 0 && rng() < 1 - 0.55 ** polymeraseLevel;
    mutations.push({
      kind: mutated.kind,
      position,
      from: token,
      to: corrected ? token : mutated.next,
      proofread: corrected,
    });
    if (!corrected) {
      nextTokens[position] = mutated.next;
    }
  });

  if (rng() < mutationChance * 0.4 && nextTokens.length > 2) {
    const at = Math.max(1, Math.floor(rng() * nextTokens.length));
    const before = nextTokens.join("");
    const shifted = frameshiftFrom(nextTokens, at);
    const after = shifted.join("");
    mutations.push({
      kind: "frameshift",
      position: at,
      from: before,
      to: after,
      proofread: false,
    });
    shifted.forEach((token, index) => {
      nextTokens[index] = token;
    });
  }

  const plain = nextTokens.join("").replace(/\s+/g, " ").trim();
  const meaningful = tokens.filter((token) => !/^\s+$/.test(token)).length;
  const uncorrected = mutations.filter((event) => !event.proofread).length;
  const fidelity = Math.max(0, 1 - uncorrected / Math.max(meaningful, 1));

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

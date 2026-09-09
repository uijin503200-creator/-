import { describe, expect, it } from "vitest";
import { CELL_PHENOTYPES, effectiveMutationChance } from "./cell-types";
import { createRng } from "./rng";
import { transcribeDnaToMrnaCore } from "./transcribe";

const DNA = "meet me by the tight junction after dusk and bring the ligand";

describe("transcribeDnaToMrnaCore", () => {
  it("keeps high fidelity when macrophage + polymerase clamp transcription", () => {
    const transcript = transcribeDnaToMrnaCore({
      dnaSeed: DNA,
      senderCellType: "macrophage",
      polymeraseLevel: 3,
      rng: createRng(1),
    });
    expect(transcript.polymerase).toBe("proofreading");
    expect(transcript.fidelity).toBeGreaterThan(0.9);
    expect(transcript.mutationChance).toBeLessThan(0.02);
    expect(transcript.sequence.split(" ").length).toBe(transcript.plain.length);
  });

  it("emits codon-v1 JSON fields for network transfer", () => {
    const transcript = transcribeDnaToMrnaCore({
      dnaSeed: "hello nucleus",
      senderCellType: "epithelial",
      polymeraseLevel: 0,
      rng: createRng(42),
    });
    expect(transcript.version).toBe(1);
    expect(transcript.encoding).toBe("codon-v1");
    expect(transcript.sequence).toMatch(/^[AUGC ]+$/);
    expect(transcript.mutationChance).toBe(CELL_PHENOTYPES.epithelial.baseMutationRate);
  });

  it("oncogenic cells mutate more than proofread epithelial cells for the same DNA", () => {
    const wild = transcribeDnaToMrnaCore({
      dnaSeed: DNA,
      senderCellType: "oncogenic",
      polymeraseLevel: 0,
      rng: createRng(99),
    });
    const proofed = transcribeDnaToMrnaCore({
      dnaSeed: DNA,
      senderCellType: "epithelial",
      polymeraseLevel: 3,
      rng: createRng(99),
    });
    const wildHits = wild.mutations.filter((event) => !event.proofread).length;
    const proofedHits = proofed.mutations.filter((event) => !event.proofread).length;
    expect(wildHits).toBeGreaterThan(proofedHits);
    expect(wild.fidelity).toBeLessThan(proofed.fidelity);
  });

  it("proofreading polymerase lowers the effective mutation chance geometrically", () => {
    expect(effectiveMutationChance("oncogenic", 0)).toBeCloseTo(0.3);
    expect(effectiveMutationChance("oncogenic", 1)).toBeCloseTo(0.3 * 0.55);
    expect(effectiveMutationChance("oncogenic", 3)).toBeLessThan(
      effectiveMutationChance("epithelial", 0),
    );
  });
});

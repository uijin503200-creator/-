import { describe, expect, it } from "vitest";
import { createRng } from "./rng";
import { transcribeDnaToMrnaCore } from "./transcribe";
import { refoldWithChaperone, translateMrnaToProteinCore } from "./translate";

describe("translateMrnaToProteinCore", () => {
  it("macrophage phagocytoses a highly mutated transcript", () => {
    const transcript = transcribeDnaToMrnaCore({
      dnaSeed: "invade the tissue and ignore the checkpoint",
      senderCellType: "oncogenic",
      polymeraseLevel: 0,
      rng: createRng(7),
    });
    transcript.fidelity = 0.4;
    const rolls = [0.5, 0.01];
    const protein = translateMrnaToProteinCore({
      transcript,
      recipientCellType: "macrophage",
      rng: () => rolls.shift() ?? 0.5,
    });
    expect(protein.phagocytosed).toBe(true);
    expect(protein.isMisfolded).toBe(true);
    expect(protein.protein).toMatch(/PHAGOCYTOSED/);
    expect(protein.latencyMs).toBeGreaterThan(400);
  });

  it("marks catastrophic mutation load as misfolded for epithelial ribosomes", () => {
    const transcript = transcribeDnaToMrnaCore({
      dnaSeed: "fold me carefully please",
      senderCellType: "epithelial",
      polymeraseLevel: 0,
      rng: createRng(3),
    });
    transcript.fidelity = 0.1;
    transcript.mutations = [
      { kind: "frameshift", position: 1, from: "fold", to: "oldf", proofread: false },
    ];
    const protein = translateMrnaToProteinCore({
      transcript,
      recipientCellType: "epithelial",
      rng: createRng(3),
    });
    expect(protein.isMisfolded).toBe(true);
    expect(protein.protein).toMatch(/MISFOLDED/);
  });

  it("chaperone proteins restore a readable chain from the original DNA seed", () => {
    const refolded = refoldWithChaperone("bring the ligand", "⚠ MISFOLDED AGGREGATE");
    expect(refolded.isMisfolded).toBe(false);
    expect(refolded.protein).toContain("bring the ligand");
    expect(refolded.ribosome).toMatch(/Hsp/);
  });

  it("honors an LLM [MISFOLD_DETECTED] marker without rewriting the Protein", () => {
    const transcript = transcribeDnaToMrnaCore({
      dnaSeed: "coffee at five",
      senderCellType: "epithelial",
      polymeraseLevel: 0,
      rng: createRng(1),
    });
    const protein = translateMrnaToProteinCore({
      transcript,
      recipientCellType: "epithelial",
      llmProtein: "cof fee at fiv [MISFOLD_DETECTED]",
      rng: createRng(1),
    });
    expect(protein.isMisfolded).toBe(true);
    expect(protein.protein).toBe("cof fee at fiv [MISFOLD_DETECTED]");
    expect(protein.notes.some((note) => note.includes("MISFOLD_DETECTED"))).toBe(true);
  });
});

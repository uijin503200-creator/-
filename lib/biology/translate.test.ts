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

  it("forces a misfold when the LLM ribosome emits [MISFOLD_DETECTED]", () => {
    const transcript = transcribeDnaToMrnaCore({
      dnaSeed: "deliver the signal to the nucleus",
      senderCellType: "epithelial",
      polymeraseLevel: 3,
      rng: createRng(11),
    });
    const protein = translateMrnaToProteinCore({
      transcript,
      recipientCellType: "epithelial",
      llmProtein: "deliver the sig[MISFOLD_DETECTED]nal to the nucle",
      rng: createRng(11),
    });

    expect(protein.isMisfolded).toBe(true);
    // The ribosome's own string is preserved rather than re-wrapped locally.
    expect(protein.protein).toBe("deliver the sig[MISFOLD_DETECTED]nal to the nucle");
    expect(protein.notes.join(" ")).toContain("forced a misfold");
  });

  it("leaves a clean LLM protein untouched by the offline drift simulator", () => {
    const transcript = transcribeDnaToMrnaCore({
      dnaSeed: "meet me by the tight junction",
      senderCellType: "macrophage",
      polymeraseLevel: 3,
      rng: createRng(5),
    });
    const protein = translateMrnaToProteinCore({
      transcript,
      recipientCellType: "oncogenic",
      llmProtein: "COFFEE. 17:00.",
      rng: createRng(5),
    });

    expect(protein.protein).toBe("COFFEE. 17:00.");
    expect(protein.isMisfolded).toBe(false);
  });

  it("chaperone proteins restore a readable chain from the original DNA seed", () => {
    const refolded = refoldWithChaperone("bring the ligand", "⚠ MISFOLDED AGGREGATE");
    expect(refolded.isMisfolded).toBe(false);
    expect(refolded.protein).toContain("bring the ligand");
    expect(refolded.ribosome).toMatch(/Hsp/);
  });
});

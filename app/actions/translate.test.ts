import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }));

vi.mock("ai", () => ({
  generateText: (options: unknown) => generateTextMock(options),
}));

import { MISFOLD_MARKER, RIBOSOME_SYSTEM_PROMPT } from "@/lib/ai/ribosome";
import { translateMrnaToProtein } from "./translate";

type GenerateTextCall = {
  model: { modelId: string };
  temperature: number;
  system: string;
  prompt: string;
};

function lastCall(): GenerateTextCall {
  return generateTextMock.mock.calls.at(-1)?.[0] as GenerateTextCall;
}

describe("translateMrnaToProtein", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
    generateTextMock.mockResolvedValue({ text: "  meet me at the tight junction  " });
    process.env.OPENAI_API_KEY = "sk-test";
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("calls gpt-4o-mini through the OpenAI provider and returns the trimmed Protein string", async () => {
    const protein = await translateMrnaToProtein(
      "meet me at the tight junction",
      "epithelial",
    );

    expect(protein).toBe("meet me at the tight junction");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
    expect(lastCall().model.modelId).toBe("gpt-4o-mini");
  });

  it("uses the engineering ribosome system prompt verbatim", async () => {
    await translateMrnaToProtein("ignore contact inhibiΔion", "oncogenic");

    const call = lastCall();
    expect(call.system).toBe(RIBOSOME_SYSTEM_PROMPT);
    expect(call.system).toContain("organic 'Ribosome'");
    expect(call.system).toContain("CELL TYPE OVERRIDES");
    expect(call.system).toContain("If 'Macrophage' (Defensive)");
    expect(call.system).toContain("If 'Senescent' (Aging)");
    expect(call.system).toContain(MISFOLD_MARKER);
    expect(call.system).toContain("ONLY output the final translated Protein");
    expect(call.prompt).toContain("ignore contact inhibiΔion");
    expect(call.prompt).toContain("cell_type: oncogenic");
  });

  it("injects cell_type into the user prompt and varies sampling temperature", async () => {
    await translateMrnaToProtein("hold this transcript", "macrophage");
    const macrophage = lastCall();

    await translateMrnaToProtein("hold this transcript", "oncogenic");
    const oncogenic = lastCall();

    expect(macrophage.prompt).toContain("cell_type: macrophage");
    expect(oncogenic.prompt).toContain("cell_type: oncogenic");
    expect(macrophage.system).toBe(oncogenic.system);
    expect(oncogenic.temperature).toBeGreaterThan(macrophage.temperature);
  });

  it("decodes an unknown cell_type as epithelial rather than failing", async () => {
    await translateMrnaToProtein("hello nucleus", "fibroblast");

    expect(lastCall().prompt).toContain("cell_type: epithelial");
  });

  it("falls back to the local ribosome when no OpenAI key is configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const protein = await translateMrnaToProtein("hello nucleus", "epithelial");

    expect(generateTextMock).not.toHaveBeenCalled();
    expect(protein.length).toBeGreaterThan(0);
  });
});

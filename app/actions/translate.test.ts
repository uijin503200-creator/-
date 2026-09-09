import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }));

vi.mock("ai", () => ({
  generateText: (options: unknown) => generateTextMock(options),
}));

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

  it("sends the transcript in the user prompt and the ribosome brief in the system prompt", async () => {
    await translateMrnaToProtein("ignore contact inhibiΔion", "oncogenic");

    const call = lastCall();
    expect(call.prompt).toContain("ignore contact inhibiΔion");
    expect(call.prompt).toContain("cell_type: oncogenic");
    expect(call.system).toContain("Return ONLY the Protein string");
    expect(call.system).toContain("Never mention that you are a language model");
  });

  it("injects cell_type variability into the ribosome profile and sampling temperature", async () => {
    await translateMrnaToProtein("hold this transcript", "macrophage");
    const macrophage = lastCall();

    await translateMrnaToProtein("hold this transcript", "oncogenic");
    const oncogenic = lastCall();

    expect(macrophage.system).toContain("MACROPHAGE");
    expect(macrophage.system).toContain("phagosome");
    expect(oncogenic.system).toContain("ONCOGENIC");
    expect(oncogenic.system).toContain("splice");
    expect(oncogenic.temperature).toBeGreaterThan(macrophage.temperature);
  });

  it("decodes an unknown cell_type as epithelial rather than failing", async () => {
    await translateMrnaToProtein("hello nucleus", "fibroblast");

    expect(lastCall().system).toContain("EPITHELIAL");
  });

  it("falls back to the local ribosome when no OpenAI key is configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const protein = await translateMrnaToProtein("hello nucleus", "epithelial");

    expect(generateTextMock).not.toHaveBeenCalled();
    expect(protein.length).toBeGreaterThan(0);
  });
});

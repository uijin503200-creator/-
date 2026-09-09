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
    expect(call.prompt).toContain("Recipient Cell Type: oncogenic");
    expect(call.system).toContain("ONLY output the final translated Protein");
    expect(call.system).toContain("DO NOT explain your process");
  });

  it("declares every cell type override, including Senescent, in the system prompt", async () => {
    await translateMrnaToProtein("hold this transcript", "epithelial");

    const { system } = lastCall();
    expect(system).toContain("If 'Epithelial' (Stable)");
    expect(system).toContain("If 'Macrophage' (Defensive)");
    expect(system).toContain("If 'Oncogenic' (Cancerous)");
    expect(system).toContain("If 'Senescent' (Aging)");
    expect(system).toContain("[MISFOLD_DETECTED]");
  });

  it("injects cell_type variability through the sampling temperature", async () => {
    await translateMrnaToProtein("hold this transcript", "macrophage");
    const macrophage = lastCall();

    await translateMrnaToProtein("hold this transcript", "oncogenic");
    const oncogenic = lastCall();

    expect(oncogenic.temperature).toBeGreaterThan(macrophage.temperature);
  });

  it("passes a prompt-only cell_type such as Senescent through to the model", async () => {
    await translateMrnaToProtein("deliver the signal", "Senescent");

    const call = lastCall();
    expect(call.prompt).toContain("Recipient Cell Type: Senescent");
    expect(call.temperature).toBe(0.9);
  });

  it("falls back to the local ribosome when no OpenAI key is configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const protein = await translateMrnaToProtein("hello nucleus", "epithelial");

    expect(generateTextMock).not.toHaveBeenCalled();
    expect(protein.length).toBeGreaterThan(0);
  });
});

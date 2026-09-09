import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/biology/rng";
import {
  transcribeDnaToMrna,
  transcribeDnaToMrnaWithLesions,
} from "@/lib/transcription-biology";

const DNA = "hello nucleus";

describe("transcribeDnaToMrna", () => {
  it("returns the DNA unchanged when both rates are zero", () => {
    const mrna = transcribeDnaToMrna(DNA, 0, 0, createRng(1));
    expect(mrna).toBe(DNA);
  });

  it("applies QWERTY-adjacent point mutations under a high mutationRate", () => {
    const mrna = transcribeDnaToMrna(DNA, 1, 0, createRng(7));
    expect(mrna).not.toBe(DNA);
    expect(mrna.length).toBe(DNA.length);
    // Every letter should differ (rate = 1) and stay a printable single character.
    for (let i = 0; i < DNA.length; i += 1) {
      if (DNA[i] === " ") {
        // Space has no keyboard neighbor map — may become a nearby codepoint.
        continue;
      }
      expect(mrna[i]).not.toBe(DNA[i]);
    }
  });

  it("can delete characters under a high frameShiftChance", () => {
    const rolls: number[] = [];
    // Force frameshift on every char, then always choose deletion.
    const rng = () => {
      const next = rolls.length % 2 === 0 ? 0 : 0.1;
      rolls.push(next);
      return next;
    };
    const mrna = transcribeDnaToMrna("abcd", 0, 1, rng);
    expect(mrna).toBe("");
  });

  it("can insert characters under a high frameShiftChance", () => {
    const sequence = [0, 0.9, 0.1, 0, 0.9, 0.2, 0, 0.9, 0.3];
    let i = 0;
    const rng = () => {
      const value = sequence[i] ?? 0.5;
      i += 1;
      return value;
    };
    const mrna = transcribeDnaToMrna("ab", 0, 1, rng);
    expect(mrna.length).toBeGreaterThan(2);
    expect(mrna.startsWith("a") || mrna.includes("a")).toBe(true);
  });

  it("exposes lesions alongside the battered transcript", () => {
    const { mrna, lesions } = transcribeDnaToMrnaWithLesions(DNA, 1, 0, createRng(3));
    expect(mrna).not.toBe(DNA);
    expect(lesions.length).toBeGreaterThan(0);
    expect(lesions.every((lesion) => lesion.kind === "point")).toBe(true);
  });
});

/**
 * Character-level transcription biology.
 *
 * Batters a DNA seed into an mRNA transcript via QWERTY-adjacent point mutations
 * and stochastic frameshift insertions / deletions.
 */

export type Rng = () => number;

/** QWERTY neighbors used for point mutations (case-insensitive lookup). */
const KEYBOARD_NEIGHBORS: Record<string, string> = {
  q: "wa",
  w: "qeas",
  e: "wrsd",
  r: "etdf",
  t: "ryfg",
  y: "tugh",
  u: "yihj",
  i: "uojk",
  o: "ipkl",
  p: "ol",
  a: "qwsz",
  s: "awedxz",
  d: "serfcx",
  f: "drtgvc",
  g: "ftyhbv",
  h: "gyujnb",
  j: "huiknm",
  k: "jiolm",
  l: "kop",
  z: "asx",
  x: "zsdc",
  c: "xdfv",
  v: "cfgb",
  b: "vghn",
  n: "bhjm",
  m: "njk",
  "1": "2q",
  "2": "13qw",
  "3": "24we",
  "4": "35er",
  "5": "46rt",
  "6": "57ty",
  "7": "68yu",
  "8": "79ui",
  "9": "80io",
  "0": "9op",
};

const INSERT_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

function clampRate(rate: number) {
  if (!Number.isFinite(rate)) return 0;
  return Math.min(1, Math.max(0, rate));
}

function pickNeighbor(char: string, rng: Rng): string {
  const lower = char.toLowerCase();
  const neighbors = KEYBOARD_NEIGHBORS[lower];
  if (!neighbors || neighbors.length === 0) {
    // Non-letter / unmapped — nudge by codepoint as a weak lesion.
    return String.fromCharCode(char.charCodeAt(0) + (rng() < 0.5 ? 1 : -1));
  }
  const next = neighbors[Math.floor(rng() * neighbors.length)] ?? lower;
  return char === char.toUpperCase() && /[a-z]/i.test(char) ? next.toUpperCase() : next;
}

function randomLetter(rng: Rng) {
  return INSERT_ALPHABET[Math.floor(rng() * INSERT_ALPHABET.length)] ?? "a";
}

/**
 * Transcribe DNA into a battered mRNA transcript.
 *
 * For every character:
 * - `mutationRate` chance of a point mutation (swap to an adjacent keyboard key)
 * - `frameShiftChance` chance of a frameshift deletion (drop the char) or insertion
 *   (append a random letter beside it). When both fire, the frameshift wins.
 */
export function transcribeDnaToMrna(
  dna: string,
  mutationRate: number,
  frameShiftChance: number,
  rng: Rng = Math.random,
): string {
  const pointRate = clampRate(mutationRate);
  const shiftRate = clampRate(frameShiftChance);
  let mrna = "";

  for (const char of dna) {
    const shiftRoll = rng();
    if (shiftRoll < shiftRate) {
      // Frameshift: deletion or insertion (50 / 50).
      if (rng() < 0.5) {
        // Deletion — skip the character (string squashes).
        continue;
      }
      // Insertion — keep the original and splice in a random neighbor letter.
      mrna += char + randomLetter(rng);
      continue;
    }

    if (rng() < pointRate) {
      mrna += pickNeighbor(char, rng);
      continue;
    }

    mrna += char;
  }

  return mrna;
}

export type TranscriptionLesion =
  | { kind: "point"; index: number; from: string; to: string }
  | { kind: "deletion"; index: number; from: string }
  | { kind: "insertion"; index: number; inserted: string };

/**
 * Same battering pass as {@link transcribeDnaToMrna}, but also returns the lesion log
 * so the vesicle envelope can expose mutation_count / fidelity.
 */
export function transcribeDnaToMrnaWithLesions(
  dna: string,
  mutationRate: number,
  frameShiftChance: number,
  rng: Rng = Math.random,
): { mrna: string; lesions: TranscriptionLesion[] } {
  const pointRate = clampRate(mutationRate);
  const shiftRate = clampRate(frameShiftChance);
  let mrna = "";
  const lesions: TranscriptionLesion[] = [];

  for (let index = 0; index < dna.length; index += 1) {
    const char = dna[index] ?? "";
    const shiftRoll = rng();
    if (shiftRoll < shiftRate) {
      if (rng() < 0.5) {
        lesions.push({ kind: "deletion", index, from: char });
        continue;
      }
      const inserted = randomLetter(rng);
      mrna += char + inserted;
      lesions.push({ kind: "insertion", index, inserted });
      continue;
    }

    if (rng() < pointRate) {
      const to = pickNeighbor(char, rng);
      mrna += to;
      lesions.push({ kind: "point", index, from: char, to });
      continue;
    }

    mrna += char;
  }

  return { mrna, lesions };
}

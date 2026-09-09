const BASES = ["A", "U", "G", "C"] as const;

const CODON_TABLE = BASES.flatMap((a) =>
  BASES.flatMap((b) => BASES.map((c) => `${a}${b}${c}`)),
);

export function charToCodon(char: string) {
  const code = char.charCodeAt(0) || 32;
  return CODON_TABLE[code % CODON_TABLE.length] ?? "AUG";
}

export function encodeCodonStrand(text: string) {
  return Array.from(text)
    .map((char) => charToCodon(char))
    .join(" ");
}

export const STOP_CODONS = new Set(["UAA", "UAG", "UGA"]);

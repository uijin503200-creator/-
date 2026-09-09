import { encodeCodonStrand } from "@/lib/biology";

export function CodonStrand({ text }: { text: string }) {
  const sequence = encodeCodonStrand(text || " ");

  return (
    <div className="overflow-hidden rounded-full border border-mrna/30 bg-black/30 py-2">
      <div className="flex w-max animate-[codon-scroll_18s_linear_infinite] gap-3 px-4 font-mono text-[11px] tracking-[0.22em] text-mrna">
        <span>{sequence}</span>
        <span>{sequence}</span>
      </div>
    </div>
  );
}

# Central Dogma

Experimental social messenger: **DNA → mRNA → Protein**.

You type a DNA seed (exact intent). A server action transcribes it into an mRNA vesicle — mutation chance depends on your `cell_type` and whether you bought **Proofreading Polymerase**. The recipient ribosome translates that transcript into a Protein. **Chaperone Proteins** can refold `is_misfolded` chains.

This is a Next.js App Router scaffold with a Supabase schema, a demo lab store (no credentials required), and Vercel AI SDK placeholders.

## Architecture

```
DNA seed  ──transcribeDnaToMrna──►  mRNA transcript (JSON on the wire)
                                         │
                                         ▼
                                  vesicle in transit
                                         │
                              translateMrnaToProtein
                                         │
                                         ▼
                              protein_result + is_misfolded
```

| Layer | Path | Role |
| --- | --- | --- |
| Schema | `supabase/schema.sql` | Profiles (cell types), vesicles, IAP catalog, RLS, purchase/chaperone RPCs |
| Biology | `lib/biology/` | Mutation chance, codon encoding, folding, chaperone refold |
| Ribosome (LLM) | `lib/ai/ribosome.ts` | `generateText` via Vercel AI SDK when `OPENAI_API_KEY` is set |
| Actions | `app/actions/` | `transcribeDnaToMrna`, `translateMrnaToProtein`, IAP |
| UI | `app/(lab)/`, `components/lab/` | Microscope feed, cytoplasm inbox, IAP store |

### Cell types

- **Epithelial** — standard ribosome, modest mutation
- **Macrophage** — high defense / high latency; may phagocytose damaged mRNA
- **Oncogenic** — high error / mutation rate, noisy folding

## Run locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), pick a cell type, seat it on the stage.

Demo persistence lives in `.data/lab.json` (gitignored). NPC handles `keratin`, `lysosome`, and `nemo` already exist — entering those names resumes those cells.

## Supabase

1. Create a project, run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` → `.env.local` and fill:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

The demo repository is the default so the UI works without a project. Auth-backed `LabRepository` wiring is left as the next integration step (`lib/supabase/*` and `proxy.ts` already refresh sessions).

## Vercel AI SDK

`translateMrnaToProtein` calls `decodeWithLlmRibosome`. Without `OPENAI_API_KEY` it uses the local ribosome simulator. With a key:

```
OPENAI_API_KEY=sk-...
OPENAI_RIBOSOME_MODEL=gpt-4o-mini
```

Temperature and system prompt follow the recipient `cell_type`.

## IAP

| Organelle | Effect | Price |
| --- | --- | --- |
| Proofreading Polymerase | ×0.55 mutation chance per level (max 3) | 80 ATP |
| Chaperone Proteins | Clears `is_misfolded`, rewrites protein from `dna_seed` | 35 ATP |

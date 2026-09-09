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
| Ribosome prompt | `lib/ai/ribosome.ts` | Engineering ribosome system prompt, model id, temperature |
| Actions | `app/actions/` | `transcribeDnaToMrna`, `translateMrnaToProtein`, `translateVesicle`, IAP |
| UI | `app/(lab)/`, `components/lab/` | Microscope feed, cytoplasm inbox, IAP store |

### Cell types

- **Epithelial** — standard ribosome, modest mutation
- **Macrophage** — high defense / high latency; may phagocytose damaged mRNA
- **Oncogenic** — high error / mutation rate, noisy folding
- **Senescent** — aging ribosome; translation stalls mid-chain

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

`translateMrnaToProtein(mrna_transcript, cell_type)` is a server action that calls `generateText` from the `ai` package against the OpenAI provider (`gpt-4o-mini`) and returns the Protein string:

```ts
import { translateMrnaToProtein } from "@/app/actions/translate";

const protein = await translateMrnaToProtein(mrnaTranscript, "oncogenic");
```

`mrna_transcript` accepts the plain transcript text or a serialized transcript envelope. `cell_type` is passed in the user prompt so the shared engineering system prompt can apply the matching CELL TYPE OVERRIDE; sampling temperature still varies per cell:

| `cell_type` | Temperature | Ribosome behavior |
| --- | --- | --- |
| `epithelial` | 0.35 | Reconstruct typos into a normal cohesive message |
| `macrophage` | 0.18 | Strip fluff into clinical bare-bones commands |
| `oncogenic` | 1.15 | Overgrown, duplicated, mutated elaborations |
| `senescent` | 0.55 | Stall mid-translation into silence / gibberish |

Frameshift damage should make the model emit `[MISFOLD_DETECTED]`, which sets `is_misfolded` for the UI. Unknown cell types decode as `epithelial`. Enable the LLM with:

```
OPENAI_API_KEY=sk-...
```

Without a key the action falls back to the deterministic local ribosome so the lab still runs offline. Edit the prompt in one place: `RIBOSOME_SYSTEM_PROMPT` in `lib/ai/ribosome.ts`.

`translateVesicle(vesicleId)` wraps the action for the stored-message pipeline, persisting `protein_result`, `is_misfolded`, and latency.

## IAP

| Organelle | Effect | Price |
| --- | --- | --- |
| Proofreading Polymerase | ×0.55 mutation chance per level (max 3) | 80 ATP |
| Chaperone Proteins | Clears `is_misfolded`, rewrites protein from `dna_seed` | 35 ATP |

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
| Ribosome prompt | `lib/ai/ribosome.ts` | Detailed per-`cell_type` system prompt, model id, temperature |
| Actions | `app/actions/` | `transcribeDnaToMrna`, `translateMrnaToProtein`, `translateVesicle`, IAP |
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

`translateMrnaToProtein(mrna_transcript, cell_type)` is a server action that calls `generateText` from the `ai` package against the OpenAI provider (`gpt-4o-mini`) and returns the Protein string:

```ts
import { translateMrnaToProtein } from "@/app/actions/translate";

const protein = await translateMrnaToProtein(mrnaTranscript, "oncogenic");
```

`mrna_transcript` accepts the plain transcript text or a serialized transcript envelope. `cell_type` selects the ribosome behavior override in the system prompt and sets the sampling temperature:

| `cell_type` | Temperature | Ribosome behavior |
| --- | --- | --- |
| `epithelial` | 0.35 | Stable. Interprets typos gracefully, reads like a normal message |
| `macrophage` | 0.18 | Defensive. Treats fluff as antigens; strips to clinical commands |
| `oncogenic` | 1.15 | Cancerous. Duplicates and extrapolates until overgrown |
| `senescent` | 0.9 | Aging. Stops halfway and trails off into gibberish |

`cell_type` is passed to the model verbatim, so `senescent` works even though no cell in the schema differentiates into it yet. Enable the LLM with:

```
OPENAI_API_KEY=sk-...
```

Without a key the action falls back to the deterministic local ribosome so the lab still runs offline. Edit the prompt in one place: `RIBOSOME_SYSTEM_PROMPT` in `lib/ai/ribosome.ts`.

### Misfold contract

Rule 3 of the system prompt tells the ribosome to emit `[MISFOLD_DETECTED]` when the transcript has too many typos to read (a frameshift). `translateMrnaToProteinCore` treats that marker as authoritative: it sets `is_misfolded`, preserves the ribosome's own string instead of re-wrapping it, and the UI renders the red misfolded-protein membrane with a chaperone repair option.

`translateVesicle(vesicleId)` wraps the action for the stored-message pipeline, persisting `protein_result`, `is_misfolded`, and latency.

## IAP

| Organelle | Effect | Price |
| --- | --- | --- |
| Proofreading Polymerase | ×0.55 mutation chance per level (max 3) | 80 ATP |
| Chaperone Proteins | Clears `is_misfolded`, rewrites protein from `dna_seed` | 35 ATP |

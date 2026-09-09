import { purchaseOrganelleForm } from "@/app/actions/store";
import { ORGANELLE_CATALOG } from "@/lib/iap/catalog";
import type { Profile } from "@/lib/data/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAtp } from "@/lib/utils";
import { FormSubmit } from "./form-submit";

export function IapShelf({ profile }: { profile: Profile }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {ORGANELLE_CATALOG.map((item) => {
        const owned =
          item.slug === "proofreading_polymerase"
            ? `Clamp level ${profile.polymeraseLevel}/3`
            : `${profile.chaperoneCount} in cytosol`;
        return (
          <Card key={item.slug} className="membrane overflow-hidden">
            <CardHeader>
              <p className="text-[10px] uppercase tracking-[0.22em] text-primary">{item.tagline}</p>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-24 rounded-[1.5rem] border border-primary/20 bg-[radial-gradient(circle_at_30%_30%,rgba(61,255,194,0.25),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(255,209,102,0.2),transparent_40%)]" />
              <form
                action={purchaseOrganelleForm}
                method="post"
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-mono text-primary">{formatAtp(item.priceAtp)}</p>
                  <p className="text-xs text-muted-foreground">{owned}</p>
                </div>
                <input type="hidden" name="slug" value={item.slug} />
                <FormSubmit idle="Acquire" pendingLabel="Trafficking…" />
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

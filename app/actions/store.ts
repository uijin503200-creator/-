"use server";

import { requireSessionCell } from "@/lib/data";
import type { OrganelleSlug, Profile, Vesicle } from "@/lib/data/types";
import { revalidatePath } from "next/cache";

export type StoreResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function purchaseOrganelle(
  slug: OrganelleSlug,
): Promise<StoreResult<Profile>> {
  const { repo, profile } = await requireSessionCell();
  if (!profile) return { ok: false, error: "No cell is seated in this microscope." };

  try {
    const next = await repo.purchaseOrganelle(profile.id, slug);
    revalidatePath("/store");
    revalidatePath("/cell");
    revalidatePath("/compose");
    return { ok: true, data: next };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Purchase failed." };
  }
}

export async function applyChaperone(vesicleId: string): Promise<StoreResult<Vesicle>> {
  const { repo, profile } = await requireSessionCell();
  if (!profile) return { ok: false, error: "No cell is seated in this microscope." };

  try {
    const vesicle = await repo.applyChaperone(profile.id, vesicleId);
    revalidatePath("/inbox");
    revalidatePath("/feed");
    revalidatePath("/store");
    return { ok: true, data: vesicle };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Refolding failed." };
  }
}

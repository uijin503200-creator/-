"use server";

import { randomUUID } from "node:crypto";
import { CELL_TYPE_IDS, type CellType } from "@/lib/biology";
import { getLabRepository, requireSessionCell, setSessionCellId } from "@/lib/data";
import type { Profile } from "@/lib/data/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normalizeHandle(handle: string) {
  return handle.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

export async function enterTheLabForm(formData: FormData): Promise<void> {
  const handle = String(formData.get("handle") ?? "");
  const cellType = String(formData.get("cellType") ?? "epithelial");
  if (!CELL_TYPE_IDS.includes(cellType as CellType)) {
    redirect(`/?error=${encodeURIComponent("Unknown cell type.")}`);
  }
  const result = await enterTheLab({ handle, cellType: cellType as CellType });
  if (result && "error" in result) {
    redirect(`/?error=${encodeURIComponent(result.error)}`);
  }
}

export async function switchCellTypeForm(formData: FormData): Promise<void> {
  const cellType = String(formData.get("cellType") ?? "") as CellType;
  await switchCellType(cellType);
}

export async function enterTheLab(input: {
  handle: string;
  cellType: CellType;
}) {
  const repo = getLabRepository();
  const handle = normalizeHandle(input.handle);
  if (handle.length < 3) {
    return { ok: false as const, error: "Handle must be at least 3 characters." };
  }

  const existing = await repo.getProfileByHandle(handle);
  if (existing) {
    await setSessionCellId(existing.id);
    await repo.setCellType(existing.id, input.cellType);
    revalidatePath("/");
    redirect("/feed");
  }

  const profile: Profile = {
    id: randomUUID(),
    handle,
    displayName: handle,
    bio: "Primary culture.",
    cellType: input.cellType,
    atpBalance: 240,
    polymeraseLevel: 0,
    chaperoneCount: 1,
    createdAt: new Date().toISOString(),
  };

  await repo.upsertProfile(profile);
  await setSessionCellId(profile.id);
  revalidatePath("/");
  redirect("/feed");
}

export async function switchCellType(cellType: CellType) {
  const { repo, profile } = await requireSessionCell();
  if (!profile) return { ok: false as const, error: "No cell is seated." };
  await repo.setCellType(profile.id, cellType);
  revalidatePath("/cell");
  revalidatePath("/compose");
  return { ok: true as const };
}

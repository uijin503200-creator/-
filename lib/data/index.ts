import { cookies } from "next/headers";
import { createDemoRepository } from "./demo-store";
import type { LabRepository } from "./repository";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const SESSION_COOKIE = "dogma_cell_id";

export function getLabRepository(): LabRepository {
  // Supabase-backed repo lands here once auth is wired; demo store is the scaffold default.
  if (isSupabaseConfigured() && process.env.DOGMA_USE_SUPABASE === "1") {
    throw new Error("Supabase repository is not enabled in this scaffold yet — unset DOGMA_USE_SUPABASE.");
  }
  return createDemoRepository();
}

export async function getSessionCellId() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionCellId(id: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function requireSessionCell() {
  const repo = getLabRepository();
  const id = await getSessionCellId();
  if (!id) return { repo, profile: null };
  const profile = await repo.getProfile(id);
  return { repo, profile };
}

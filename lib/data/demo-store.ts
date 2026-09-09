import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { refoldWithChaperone, type CellType } from "@/lib/biology";
import { ORGANELLE_CATALOG } from "@/lib/iap/catalog";
import type { LabRepository } from "./repository";
import { SEED_PROFILES, SEED_VESICLES } from "./seed";
import type { OrganelleSlug, Profile, Vesicle, VesicleWithCells } from "./types";

type LabState = {
  profiles: Profile[];
  vesicles: Vesicle[];
};

const globalForLab = globalThis as unknown as { dogmaLab?: LabState };

function storePath() {
  return process.env.VERCEL
    ? "/tmp/dogma-lab.json"
    : path.join(process.cwd(), ".data", "lab.json");
}

function seedState(): LabState {
  return {
    profiles: structuredClone(SEED_PROFILES),
    vesicles: structuredClone(SEED_VESICLES),
  };
}

async function loadState(): Promise<LabState> {
  if (globalForLab.dogmaLab) return globalForLab.dogmaLab;
  try {
    const raw = await readFile(/* turbopackIgnore: true */ storePath(), "utf8");
    globalForLab.dogmaLab = JSON.parse(raw) as LabState;
    return globalForLab.dogmaLab;
  } catch {
    const seeded = seedState();
    globalForLab.dogmaLab = seeded;
    return seeded;
  }
}

async function persist(state: LabState) {
  globalForLab.dogmaLab = state;
  const file = storePath();
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(/* turbopackIgnore: true */ file, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // /tmp or ephemeral fs — in-memory still works for this process.
  }
}

function hydrate(state: LabState, vesicle: Vesicle): VesicleWithCells {
  const sender = state.profiles.find((profile) => profile.id === vesicle.senderId);
  const recipient = state.profiles.find((profile) => profile.id === vesicle.recipientId);
  if (!sender || !recipient) {
    throw new Error("Vesicle references a missing cell");
  }
  return { ...vesicle, sender, recipient };
}

export function createDemoRepository(): LabRepository {
  return {
    async getProfile(id) {
      const state = await loadState();
      return state.profiles.find((profile) => profile.id === id) ?? null;
    },
    async getProfileByHandle(handle) {
      const state = await loadState();
      return state.profiles.find((profile) => profile.handle === handle) ?? null;
    },
    async listProfiles() {
      return (await loadState()).profiles;
    },
    async upsertProfile(profile) {
      const state = await loadState();
      const index = state.profiles.findIndex((row) => row.id === profile.id);
      if (index >= 0) state.profiles[index] = profile;
      else state.profiles.push(profile);
      await persist(state);
      return profile;
    },
    async listInbox(userId) {
      const state = await loadState();
      return state.vesicles
        .filter((vesicle) => vesicle.recipientId === userId || vesicle.senderId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((vesicle) => hydrate(state, vesicle));
    },
    async listFeed() {
      const state = await loadState();
      return state.vesicles
        .filter((vesicle) => vesicle.visibility === "feed")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((vesicle) => hydrate(state, vesicle));
    },
    async getVesicle(id) {
      const state = await loadState();
      const vesicle = state.vesicles.find((row) => row.id === id);
      return vesicle ? hydrate(state, vesicle) : null;
    },
    async insertVesicle(vesicle) {
      const state = await loadState();
      state.vesicles.unshift(vesicle);
      await persist(state);
      return vesicle;
    },
    async updateVesicle(id, patch) {
      const state = await loadState();
      const index = state.vesicles.findIndex((row) => row.id === id);
      if (index < 0) throw new Error("Vesicle not found");
      state.vesicles[index] = { ...state.vesicles[index], ...patch };
      await persist(state);
      return state.vesicles[index];
    },
    async purchaseOrganelle(userId, slug: OrganelleSlug) {
      const state = await loadState();
      const profile = state.profiles.find((row) => row.id === userId);
      if (!profile) throw new Error("Cell not found");
      const item = ORGANELLE_CATALOG.find((row) => row.slug === slug);
      if (!item) throw new Error("Unknown organelle");
      if (profile.atpBalance < item.priceAtp) throw new Error("Insufficient ATP");

      if (slug === "proofreading_polymerase") {
        if (profile.polymeraseLevel >= 3) {
          throw new Error("Polymerase already at clamp saturation");
        }
        profile.polymeraseLevel += 1;
      } else {
        profile.chaperoneCount += 1;
      }
      profile.atpBalance -= item.priceAtp;
      await persist(state);
      return profile;
    },
    async applyChaperone(userId, vesicleId) {
      const state = await loadState();
      const profile = state.profiles.find((row) => row.id === userId);
      if (!profile) throw new Error("Cell not found");
      if (profile.chaperoneCount < 1) throw new Error("No chaperone proteins in the cytosol");
      const vesicle = state.vesicles.find((row) => row.id === vesicleId);
      if (!vesicle) throw new Error("Vesicle not found");
      if (vesicle.recipientId !== userId && vesicle.senderId !== userId) {
        throw new Error("Vesicle is outside this cytoplasm");
      }
      if (!vesicle.isMisfolded) throw new Error("Chain is already folded");

      profile.chaperoneCount -= 1;
      const folded = refoldWithChaperone(vesicle.dnaSeed, vesicle.proteinResult ?? "");
      vesicle.isMisfolded = false;
      vesicle.status = "refolded";
      vesicle.chaperoneApplied = true;
      vesicle.proteinResult = folded.protein;
      vesicle.translationNotes = [...vesicle.translationNotes, ...folded.notes];
      await persist(state);
      return vesicle;
    },
    async setCellType(userId, cellType: CellType) {
      const state = await loadState();
      const profile = state.profiles.find((row) => row.id === userId);
      if (!profile) throw new Error("Cell not found");
      profile.cellType = cellType;
      await persist(state);
      return profile;
    },
  };
}

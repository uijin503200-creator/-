import type { CellType } from "@/lib/biology";
import type { OrganelleSlug, Profile, Vesicle, VesicleWithCells } from "./types";

export interface LabRepository {
  getProfile(id: string): Promise<Profile | null>;
  getProfileByHandle(handle: string): Promise<Profile | null>;
  listProfiles(): Promise<Profile[]>;
  upsertProfile(profile: Profile): Promise<Profile>;
  listInbox(userId: string): Promise<VesicleWithCells[]>;
  listFeed(): Promise<VesicleWithCells[]>;
  getVesicle(id: string): Promise<VesicleWithCells | null>;
  insertVesicle(vesicle: Vesicle): Promise<Vesicle>;
  updateVesicle(id: string, patch: Partial<Vesicle>): Promise<Vesicle>;
  purchaseOrganelle(userId: string, slug: OrganelleSlug): Promise<Profile>;
  applyChaperone(userId: string, vesicleId: string): Promise<Vesicle>;
  setCellType(userId: string, cellType: CellType): Promise<Profile>;
}

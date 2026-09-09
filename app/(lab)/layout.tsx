import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AtpMeter } from "@/components/lab/atp-meter";
import { CytoplasmBackdrop } from "@/components/lab/cytoplasm-backdrop";
import { OrganelleDock } from "@/components/lab/organelle-dock";
import { requireSessionCell } from "@/lib/data";

export default async function LabLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireSessionCell();
  if (!profile) redirect("/");

  return (
    <div className="relative min-h-dvh">
      <CytoplasmBackdrop />
      <AtpMeter profile={profile} />
      {children}
      <OrganelleDock />
    </div>
  );
}

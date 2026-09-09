"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dna, Microscope, ShoppingBag, Sparkles, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/feed", label: "Stage", icon: Microscope },
  { href: "/inbox", label: "Cytoplasm", icon: Waves },
  { href: "/compose", label: "Transcribe", icon: Dna },
  { href: "/store", label: "IAP Store", icon: ShoppingBag },
  { href: "/cell", label: "Nucleus", icon: Sparkles },
];

export function OrganelleDock() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-auto fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-card/80 p-1.5 shadow-[0_0_40px_rgba(61,255,194,0.12)] backdrop-blur-xl">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.16em] transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

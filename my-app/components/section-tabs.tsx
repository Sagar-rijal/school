"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SectionTab = {
  href: string;
  label: string;
  /** Other path prefixes that should highlight this tab. */
  match?: string[];
};

/** Tab bar for multi-page areas (Fees, Exams). The active tab follows the URL. */
export default function SectionTabs({ tabs, label }: { tabs: SectionTab[]; label: string }) {
  const pathname = usePathname();
  const isActive = (tab: SectionTab) =>
    [tab.href, ...(tab.match ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b print:hidden" aria-label={label}>
      {tabs.map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

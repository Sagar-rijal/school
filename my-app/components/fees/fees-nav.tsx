"use client";

import SectionTabs from "@/components/section-tabs";
import { useSession } from "@/components/session-provider";
import { hasPermission } from "@/lib/access";

export default function FeesNav() {
  const session = useSession();
  return (
    <SectionTabs
      label="Fees sections"
      tabs={[
        { href: "/dashboard/fees/invoices", label: "Invoices" },
        { href: "/dashboard/fees/collections", label: "Collections" },
        { href: "/dashboard/fees/outstanding", label: "Outstanding" },
        ...(session && hasPermission(session, "payment:review")
          ? [{ href: "/dashboard/fees/payment-submissions", label: "Payment reviews" }]
          : []),
        { href: "/dashboard/fees/structures", label: "Fee structures" },
        { href: "/dashboard/fees/categories", label: "Categories" },
      ]}
    />
  );
}

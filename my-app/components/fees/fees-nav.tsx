import SectionTabs from "@/components/section-tabs";

export default function FeesNav() {
  return (
    <SectionTabs
      label="Fees sections"
      tabs={[
        { href: "/dashboard/fees/invoices", label: "Invoices" },
        { href: "/dashboard/fees/collections", label: "Collections" },
        { href: "/dashboard/fees/structures", label: "Fee structures" },
        { href: "/dashboard/fees/categories", label: "Categories" },
      ]}
    />
  );
}

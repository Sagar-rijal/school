import SectionTabs from "@/components/section-tabs";

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl">
      <SectionTabs
        label="Exams sections"
        tabs={[
          { href: "/dashboard/exams/schedules", label: "Exam schedules" },
          { href: "/dashboard/exams/report-cards", label: "Report cards" },
        ]}
      />
      {children}
    </div>
  );
}

import SectionTabs from "@/components/section-tabs";

export default function TimetableLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl">
      <SectionTabs
        label="Timetable sections"
        tabs={[
          { href: "/dashboard/timetable/class", label: "Class timetable" },
          { href: "/dashboard/timetable/teacher", label: "Teacher schedule" },
          { href: "/dashboard/timetable/periods", label: "Periods" },
        ]}
      />
      {children}
    </div>
  );
}

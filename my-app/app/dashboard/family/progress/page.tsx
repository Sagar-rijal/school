"use client";

import FamilyPage from "@/components/family/family-page";
import AttendanceCard from "@/components/students/attendance-card";
import ResultsCard from "@/components/students/results-card";

export default function FamilyProgressPage() {
  return (
    <FamilyPage title="Attendance & results" description="Attendance record, exam marks and report cards">
      {({ child }) => (
        <>
          <AttendanceCard studentId={child.studentId} />
          <ResultsCard studentId={child.studentId} linkReportCards={false} />
        </>
      )}
    </FamilyPage>
  );
}

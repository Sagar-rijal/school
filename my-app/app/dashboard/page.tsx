import PlatformOverview from "@/components/overview/platform-overview";
import SchoolOverview from "@/components/overview/school-overview";
import TeacherOverview from "@/components/overview/teacher-overview";
import StaffOverview from "@/components/overview/staff-overview";
import { isPlatformUser, isTeacherUser } from "@/lib/access";
import { getSession } from "@/lib/server/session";

// Each role gets its own home: super admins manage schools, school users run a school
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  if (isPlatformUser(session)) return <PlatformOverview />;
  if (session.roles.includes("SCHOOL_ADMIN")) return <SchoolOverview />;
  if (isTeacherUser(session)) return <TeacherOverview />;
  return <StaffOverview session={session} />;
}

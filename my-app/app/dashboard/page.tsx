import PlatformOverview from "@/components/overview/platform-overview";
import SchoolOverview from "@/components/overview/school-overview";
import { isPlatformUser } from "@/lib/access";
import { getSession } from "@/lib/server/session";

// Each role gets its own home: super admins manage schools, school users run a school
export default async function DashboardPage() {
  const session = await getSession();
  return session && isPlatformUser(session) ? <PlatformOverview /> : <SchoolOverview />;
}

import { redirect } from "next/navigation";

// No overview page yet — land on schools until a dashboard summary exists.
export default function DashboardPage() {
  redirect("/dashboard/schools");
}

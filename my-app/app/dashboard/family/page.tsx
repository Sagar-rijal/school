import { redirect } from "next/navigation";

// The family home lives at /dashboard
export default function FamilyIndexPage() {
  redirect("/dashboard");
}

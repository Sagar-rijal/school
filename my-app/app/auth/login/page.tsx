import SignInForm from "@/components/signin-form1";
import { safeRedirectPath } from "@/lib/auth-constants";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <SignInForm redirectTo={safeRedirectPath(next)} />;
}

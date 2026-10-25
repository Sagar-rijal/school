import SignInForm from "@/components/signin-form1";
import { safeRedirectPath } from "@/lib/auth-constants";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; passwordChanged?: string }> }) {
  const { next, passwordChanged } = await searchParams;
  return <SignInForm redirectTo={safeRedirectPath(next)} passwordChanged={passwordChanged === "1"} />;
}

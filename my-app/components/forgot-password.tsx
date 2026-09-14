import Link from "next/link";

// The backend has no password-reset endpoint yet. Replace this notice with a
// real form once one exists.
export default function ForgotPassword() {
  return (
    <section className="flex min-h-dvh w-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Forgot password?</h2>
          <p className="text-sm text-muted-foreground">
            Self-service password reset isn&apos;t available yet. Please contact your school
            administrator to reset your password.
          </p>
        </div>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="text-muted-foreground hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

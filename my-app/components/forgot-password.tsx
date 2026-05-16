"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <section className="flex min-h-screen w-full items-center justify-center py-4 lg:py-20">
      <div className="w-full max-w-sm space-y-6">

        <div className="space-y-2">
          <h2 className="font-bold text-3xl">Forgot password?</h2>
          <p className="text-muted-foreground text-sm">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        <form action="#" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="hover:underline text-muted-foreground">
            ← Back to sign in
          </Link>
        </div>

      </div>
    </section>
  );
}
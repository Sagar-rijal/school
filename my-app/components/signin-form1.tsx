"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase().trim() : value,
    }));
  };

  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(data.email) && data.password.length >= 6;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await loginUser({
        email: data.email.trim(),
        password: data.password,
      });

      console.log("Login success:", res);
      localStorage.setItem("isLoggedIn", "true");
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/50 sm:p-10">
        
        <div className="mb-10 flex flex-col items-center space-y-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 shadow-sm">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Welcome back
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
              value={data.email}
              className="h-12 w-full bg-zinc-50/50 px-4 text-base transition-colors placeholder:text-zinc-400 focus:bg-white sm:h-11 sm:text-sm"
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
                Password
              </Label>
              <Link
                href="/auth/forgetPass"
                className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              minLength={6}
              className="h-12 w-full bg-zinc-50/50 px-4 text-base transition-colors placeholder:text-zinc-400 focus:bg-white sm:h-11 sm:text-sm"
              value={data.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium sm:text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="mt-4 h-12 w-full bg-zinc-950 text-base font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-70 sm:h-11 sm:text-sm"
            disabled={loading || !isFormValid()}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

      </div>
    </section>
  );
}
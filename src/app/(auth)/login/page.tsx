"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to sign in");
        setIsLoading(false);
        return;
      }

      router.push(data.redirectUrl || "/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25 text-lg">
              BL
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">Brightloop</span>
          </Link>
          <p className="text-slate-400 text-sm">Sign in to your subscription management workspace</p>
        </div>

        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your email and password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
              />
              <Input
                label="Password"
                type="password"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
              />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Fill Pills */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Quick Fill Demo Roles (Password: Password123!)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillCredentials("john@acme.com")}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-left transition-colors border border-slate-700"
                >
                  <span className="font-semibold block text-white">Org Admin</span>
                  <span className="text-[11px] text-slate-400 truncate block">john@acme.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials("admin@brightloop.io")}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-left transition-colors border border-amber-900/50"
                >
                  <span className="font-semibold block text-amber-200">Super Admin</span>
                  <span className="text-[11px] text-slate-400 truncate block">admin@brightloop.io</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials("sarah.ops@acme.com")}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-left transition-colors border border-slate-700"
                >
                  <span className="font-semibold block text-white">Staff Member</span>
                  <span className="text-[11px] text-slate-400 truncate block">sarah.ops@acme.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials("alex@techstart.io")}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-left transition-colors border border-emerald-900/50"
                >
                  <span className="font-semibold block text-emerald-200">Customer Portal</span>
                  <span className="text-[11px] text-slate-400 truncate block">alex@techstart.io</span>
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:underline font-medium">
                Register Organization
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


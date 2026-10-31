"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Check, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password rule checks
  const ruleMinLen = password.length >= 9;
  const ruleUpper = /[A-Z]/.test(password);
  const ruleLower = /[a-z]/.test(password);
  const ruleSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = ruleMinLen && ruleUpper && ruleLower && ruleSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please ensure your password meets all complexity requirements.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName, name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to register organization");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
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
          <p className="text-slate-400 text-sm">Register your organization and admin account</p>
        </div>

        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Create Organization</CardTitle>
            <CardDescription className="text-slate-400">
              Get started with multi-tenant subscription management
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
                label="Company / Organization Name"
                placeholder="Acme Innovations"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
              />
              <Input
                label="Your Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
              />
              <Input
                label="Work Email Address"
                type="email"
                placeholder="john@acme.com"
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

              {/* Password Rules Checklist */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <p className="font-semibold text-slate-300 mb-1">Password Requirements:</p>
                <div className="flex items-center gap-2">
                  {ruleMinLen ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-500" />}
                  <span className={ruleMinLen ? "text-emerald-400" : "text-slate-400"}>Minimum 9 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {ruleUpper ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-500" />}
                  <span className={ruleUpper ? "text-emerald-400" : "text-slate-400"}>At least one uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center gap-2">
                  {ruleLower ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-500" />}
                  <span className={ruleLower ? "text-emerald-400" : "text-slate-400"}>At least one lowercase letter (a-z)</span>
                </div>
                <div className="flex items-center gap-2">
                  {ruleSpecial ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-500" />}
                  <span className={ruleSpecial ? "text-emerald-400" : "text-slate-400"}>At least one special character (!@#$%^&amp;*)</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isPasswordValid || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
                isLoading={isLoading}
              >
                Create Account &amp; Workspace
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-400">
              Already have an organization?{" "}
              <Link href="/login" className="text-blue-400 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildContinuePath } from "@/lib/auth/paths";

type Mode = "signup" | "login";

export function AuthForm({
  mode,
  betaGateEnabled = false,
  betaCode = "",
}: {
  mode: Mode;
  betaGateEnabled?: boolean;
  betaCode?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const plan = params.get("plan");
  const continuePath = buildContinuePath({ next, plan });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [betaAccessCode, setBetaAccessCode] = useState(betaCode);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<{
    google?: boolean;
    github?: boolean;
  }>({});

  useEffect(() => {
    getProviders()
      .then((providers) => {
        setOauthProviders({
          google: Boolean(providers?.google),
          github: Boolean(providers?.github),
        });
      })
      .catch(() => {
        setOauthProviders({});
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: name || undefined,
            betaAccessCode: betaAccessCode || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(
            data?.error ?? "Something went wrong creating your account.",
          );
          setIsLoading(false);
          return;
        }
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password.");
        setIsLoading(false);
        return;
      }
      router.push(
        mode === "signup"
          ? plan === "pro"
            ? "/onboarding?plan=pro"
            : "/onboarding"
          : continuePath,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vismay Rathod"
            />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        {mode === "signup" && betaGateEnabled ? (
          <div>
            <Label htmlFor="beta-access-code">Beta access code</Label>
            <Input
              id="beta-access-code"
              autoComplete="one-time-code"
              value={betaAccessCode}
              onChange={(e) => setBetaAccessCode(e.target.value)}
              placeholder="Optional if your email is allow-listed"
            />
          </div>
        ) : null}

        {error && (
          <p className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      {(oauthProviders.google || oauthProviders.github) && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-[0.2em] text-text-dim">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {oauthProviders.google && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: continuePath })}
            >
              Continue with Google
            </Button>
          )}

          {oauthProviders.github && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => signIn("github", { callbackUrl: continuePath })}
            >
              Continue with GitHub
            </Button>
          )}
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { isFeatureEnabled } from "@/lib/flags";

export const metadata = {
  title: "Create your account",
};

type SignupPageProps = {
  searchParams: Promise<{
    code?: string;
    plan?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const betaGateEnabled = isFeatureEnabled("beta_gate");

  return (
    <section className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-medium tracking-tight text-text">
        Tell us your story
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        {betaGateEnabled
          ? "Trace is in invite-only launch mode. The 30-minute interview comes next."
          : "Free to start. The 30-minute interview comes next."}
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <AuthForm
            mode="signup"
            betaGateEnabled={betaGateEnabled}
            betaCode={params.code}
          />
        </Suspense>
      </div>
      {betaGateEnabled ? (
        <p className="mt-6 text-sm text-text-muted">
          Need access?{" "}
          <Link href="/waitlist" className="text-accent hover:underline">
            Join the waitlist
          </Link>
          .
        </p>
      ) : null}
      <p className="mt-8 text-sm text-text-muted">
        Already have an account?{" "}
        <Link
          href={params.plan === "pro" ? "/login?plan=pro" : "/login"}
          className="text-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
      <p className="mt-4 text-xs leading-5 text-text-dim">
        By creating an account, you agree to the{" "}
        <Link href="/legal/terms" className="text-accent hover:underline">
          Terms
        </Link>
        ,{" "}
        <Link href="/legal/privacy" className="text-accent hover:underline">
          Privacy Policy
        </Link>
        , and{" "}
        <Link href="/legal/data-use" className="text-accent hover:underline">
          Data-Use Disclosure
        </Link>
        .
      </p>
    </section>
  );
}

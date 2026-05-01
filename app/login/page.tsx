import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-medium tracking-tight text-text">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Pick up where you left off.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
      <p className="mt-8 text-sm text-text-muted">
        New here?{" "}
        <Link
          href={params.plan === "pro" ? "/signup?plan=pro" : "/signup"}
          className="text-accent hover:underline"
        >
          Create an account
        </Link>
      </p>
    </section>
  );
}

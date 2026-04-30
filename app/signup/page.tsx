import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Create your account",
};

export default function SignupPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-medium tracking-tight text-text">
        Tell us your story
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Free to start. The 30-minute interview comes next.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
      <p className="mt-8 text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}

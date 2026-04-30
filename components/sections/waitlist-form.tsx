"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { joinWaitlist, type WaitlistActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/cn";

const initialState: WaitlistActionState = {
  ok: false,
  message: "",
};

const platforms = ["LinkedIn", "Instagram", "X", "Substack"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistFormProps = {
  mode?: "inline" | "full";
  selectedTier?: string;
};

export function WaitlistForm({
  mode = "inline",
  selectedTier,
}: WaitlistFormProps) {
  const [state, action] = useActionState(joinWaitlist, initialState);
  const [localError, setLocalError] = useState("");
  const message = localError || (!state.ok ? state.message : "");

  if (state.ok) {
    return (
      <div
        className={cn(
          "rounded-card border border-accent/40 bg-accent-soft p-6",
          mode === "full" && "text-center",
        )}
      >
        <p className="text-xl font-medium text-text">{state.message}</p>
        {mode === "full" ? (
          <Button href="/story" variant="ghost" className="mt-6">
            Read the story
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={action}
      noValidate
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();

        if (!emailPattern.test(email)) {
          event.preventDefault();
          setLocalError("Enter a real email address.");
          return;
        }

        setLocalError("");
      }}
      className={cn(
        "space-y-4",
        mode === "inline" && "sm:flex sm:items-start sm:gap-3 sm:space-y-0",
      )}
    >
      {selectedTier ? (
        <input type="hidden" name="tier" value={selectedTier} />
      ) : null}

      <div
        className={cn("min-w-0", mode === "inline" ? "flex-1" : "space-y-5")}
      >
        <label
          className="sr-only"
          htmlFor={mode === "inline" ? "inline-email" : "waitlist-email"}
        >
          Email address
        </label>
        <input
          id={mode === "inline" ? "inline-email" : "waitlist-email"}
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="h-14 w-full rounded-full border border-border-strong bg-bg px-5 text-text outline-none transition placeholder:text-text-dim focus:border-accent focus:ring-2 focus:ring-accent/50"
        />

        {mode === "full" ? (
          <>
            <label className="sr-only" htmlFor="project">
              What are you building?
            </label>
            <textarea
              id="project"
              name="project"
              rows={5}
              placeholder="What are you building?"
              className="w-full resize-none rounded-card border border-border-strong bg-bg px-5 py-4 text-text outline-none transition placeholder:text-text-dim focus:border-accent focus:ring-2 focus:ring-accent/50"
            />

            <fieldset>
              <legend className="mb-3 font-mono text-xs uppercase text-text-dim">
                Which platform matters most?
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {platforms.map((platform) => (
                  <label key={platform} className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="platform"
                      value={platform}
                    />
                    <span className="flex h-12 items-center justify-center rounded-full border border-border-strong text-sm text-text-muted transition peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent">
                      {platform}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : null}

        {message ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {message}
          </p>
        ) : null}
      </div>

      <SubmitButton mode={mode} />
    </form>
  );
}

function SubmitButton({ mode }: { mode: "inline" | "full" }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className={cn(
        mode === "inline" ? "w-full sm:w-auto" : "w-full",
        "shrink-0",
      )}
      trailing={<ArrowRight aria-hidden className="size-4" />}
      disabled={pending}
    >
      {pending ? "Joining..." : "Join Waitlist"}
    </Button>
  );
}

export function SelectedTierPill({
  label,
  href = "/waitlist",
}: {
  label: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-center gap-3">
      <Pill variant="accent">Selected: {label}</Pill>
      <a
        href={href}
        className="font-mono text-xs uppercase text-text-dim transition hover:text-text"
      >
        Clear
      </a>
    </div>
  );
}

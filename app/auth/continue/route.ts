import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolvePostAuthDestination } from "@/lib/auth/continue";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const url = new URL(req.url);

  if (!userId) {
    const params = new URLSearchParams();
    const next = url.searchParams.get("next");
    const plan = url.searchParams.get("plan");
    if (next) params.set("next", next);
    if (plan === "pro") params.set("plan", "pro");
    redirect(`/login${params.toString() ? `?${params}` : ""}`);
  }

  redirect(
    await resolvePostAuthDestination({
      userId,
      next: url.searchParams.get("next"),
      plan: url.searchParams.get("plan"),
    }),
  );
}

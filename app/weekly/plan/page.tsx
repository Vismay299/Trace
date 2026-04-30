import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { narrativePlans, weeklyCheckins } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { NarrativePlanPanel } from "../_components/narrative-plan";

export const metadata = { title: "Weekly narrative plan" };

export default async function WeeklyPlanPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/weekly/plan");

  const [[checkin], [plan]] = await Promise.all([
    db
      .select()
      .from(weeklyCheckins)
      .where(eq(weeklyCheckins.userId, userId))
      .orderBy(desc(weeklyCheckins.weekStartDate))
      .limit(1),
    db
      .select()
      .from(narrativePlans)
      .where(eq(narrativePlans.userId, userId))
      .orderBy(desc(narrativePlans.createdAt))
      .limit(1),
  ]);

  if (!checkin?.isComplete) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Finish your check-in first.
        </h1>
        <p className="mt-3 text-text-muted">
          The narrative plan needs this week's answers before it can create
          source-backed story seeds.
        </p>
        <div className="mt-6">
          <Button href="/weekly">Open weekly check-in</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-text">
          Weekly narrative
        </h1>
        <p className="mt-2 text-text-muted">
          Turn this week's check-in into an approved content plan and story
          seeds ready for generation.
        </p>
      </header>
      <NarrativePlanPanel initialPlan={plan ?? null} />
    </section>
  );
}

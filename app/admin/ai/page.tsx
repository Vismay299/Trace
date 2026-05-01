import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin";
import { getAdminAiCostReport } from "@/lib/ai/ops";
import { getRoutingCatalog, listRoutingOverrides } from "@/lib/ai/routing";
import { RoutingControls } from "./routing-controls";

export const metadata = { title: "Admin AI Ops" };

export default async function AdminAiPage() {
  try {
    await requireAdminUser();
  } catch {
    redirect("/dashboard");
  }

  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 30);
  const [report, overrides, catalog] = await Promise.all([
    getAdminAiCostReport({ from, to }),
    listRoutingOverrides(),
    Promise.resolve(getRoutingCatalog()),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
          Admin
        </p>
        <h1 className="mt-2 text-4xl font-medium tracking-tight text-text">
          AI economics
        </h1>
        <p className="mt-3 text-text-muted">
          Usage, cost, routing decisions, and safe provider experiments for the
          last 30 days.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Calls" value={report.totals.totalCalls} />
        <Stat
          label="Cost"
          value={`$${report.totals.estimatedCostUsd.toFixed(4)}`}
        />
        <Stat label="Cache hits" value={report.totals.cacheHits} />
        <Stat
          label="Avg latency"
          value={
            report.totals.averageLatencyMs
              ? `${report.totals.averageLatencyMs}ms`
              : "n/a"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Breakdown title="By task" rows={report.byTask} />
        <Breakdown title="By provider" rows={report.byProvider} />
        <Breakdown title="By model" rows={report.byModel} />
        <Breakdown title="By cohort" rows={report.byCohort} />
      </div>

      <section className="mt-6 rounded-card border border-border-strong bg-bg-elev p-6">
        <h2 className="text-xl font-medium text-text">Routing controls</h2>
        <p className="mt-2 text-sm text-text-muted">
          Overrides are tier-validated before they can be saved. NIM remains
          unavailable unless the feature flag and key are configured.
        </p>
        <RoutingControls
          catalog={catalog}
          initialOverrides={overrides.map((override) => ({
            id: override.id,
            scope: override.scope,
            taskType: override.taskType,
            costTier: override.costTier,
            provider: override.provider,
            modelId: override.modelId,
            enabled: override.enabled,
            reason: override.reason,
            updatedAt: override.updatedAt.toISOString(),
          }))}
        />
      </section>

      {report.recentFailures.length ? (
        <section className="mt-6 rounded-card border border-border-strong bg-bg-elev p-6">
          <h2 className="text-xl font-medium text-text">Recent failures</h2>
          <div className="mt-4 space-y-3">
            {report.recentFailures.map((failure) => (
              <div
                key={failure.id}
                className="rounded-2xl border border-border-strong p-4"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
                  {failure.taskType} · {failure.provider ?? "unknown"} ·{" "}
                  {failure.createdAt.toISOString()}
                </p>
                <p className="mt-2 text-sm text-danger">
                  {failure.errorMessage}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card border border-border-strong bg-bg-elev p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
        {label}
      </p>
      <p className="mt-3 text-3xl font-medium text-text">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: {
    key?: string;
    taskType?: string;
    cohort?: string;
    calls: number;
    costUsd: number;
  }[];
}) {
  return (
    <section className="rounded-card border border-border-strong bg-bg-elev p-6">
      <h2 className="text-xl font-medium text-text">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.slice(0, 10).map((row) => {
            const label = row.key ?? row.taskType ?? row.cohort ?? "unknown";
            return (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border-strong px-4 py-3 text-sm"
              >
                <span className="truncate text-text">{label}</span>
                <span className="text-text-muted">
                  {row.calls} · ${row.costUsd.toFixed(4)}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-text-muted">No usage yet.</p>
        )}
      </div>
    </section>
  );
}

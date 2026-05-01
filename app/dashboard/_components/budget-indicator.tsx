import type { BudgetSnapshot } from "@/lib/ai/budget";

export function BudgetIndicator({ budget }: { budget: BudgetSnapshot }) {
  const rows = [
    ["Tier 1", "Final content + strategy", budget.tier1],
    ["Tier 2", "Plans + extraction", budget.tier2],
    ["Tier 3", "Checks + follow-ups", budget.tier3],
  ] as const;
  const totalUsed = rows.reduce((sum, [, , item]) => sum + item.used, 0);
  const totalLimit = rows.reduce((sum, [, , item]) => sum + item.limit, 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
          {budget.tier} plan credits
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {Math.max(0, totalLimit - totalUsed)} of {totalLimit} weekly AI
          actions remaining.
        </p>
      </div>
      {rows.map(([label, description, item]) => {
        const pct = item.limit ? Math.round((item.used / item.limit) * 100) : 0;
        const warning = pct >= 80;
        return (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.18em]">
              <span className={warning ? "text-danger" : "text-text-dim"}>
                {label}
              </span>
              <span className="text-text-muted">
                {item.used}/{item.limit}
              </span>
            </div>
            <p className="mb-2 text-xs text-text-dim">{description}</p>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className={`h-full ${warning ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-text-dim">Resets {budget.periodEnd}</p>
    </div>
  );
}

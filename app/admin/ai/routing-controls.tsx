"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Catalog = {
  config: {
    primaryProvider: string;
    alternateProviders: string[];
    timeoutMsByTier: Record<number, number>;
  };
  models: { id: string; tier: number }[];
  tasks: { taskType: string; tier: number; defaultModel: string }[];
};

type OverrideRow = {
  id: string;
  scope: string;
  taskType: string | null;
  costTier: number | null;
  provider: string;
  modelId: string;
  enabled: boolean;
  reason: string | null;
  updatedAt: string;
};

export function RoutingControls({
  catalog,
  initialOverrides,
}: {
  catalog: Catalog;
  initialOverrides: OverrideRow[];
}) {
  const [overrides, setOverrides] = useState(initialOverrides);
  const [scope, setScope] = useState<"task" | "tier">("task");
  const [taskType, setTaskType] = useState(catalog.tasks[0]?.taskType ?? "");
  const [costTier, setCostTier] = useState<1 | 2 | 3>(1);
  const [provider, setProvider] = useState<"openrouter" | "nvidia_nim">(
    "openrouter",
  );
  const [modelId, setModelId] = useState(catalog.models[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedTier =
    scope === "task"
      ? catalog.tasks.find((task) => task.taskType === taskType)?.tier
      : costTier;
  const modelsForTier = useMemo(
    () => catalog.models.filter((model) => model.tier === selectedTier),
    [catalog.models, selectedTier],
  );

  async function save() {
    setBusy(true);
    setError(null);
    const body =
      scope === "task"
        ? { scope, taskType, provider, modelId, enabled: true, reason }
        : { scope, costTier, provider, modelId, enabled: true, reason };
    const res = await fetch("/api/admin/ai/routing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Could not save override.");
      setBusy(false);
      return;
    }
    setOverrides((current) => [data.override, ...current]);
    setBusy(false);
  }

  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-border-strong p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
          Current route
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Primary: {catalog.config.primaryProvider}. Alternates:{" "}
          {catalog.config.alternateProviders.join(", ") || "none"}.
        </p>

        <div className="mt-5 grid gap-3">
          <label className="text-sm text-text-muted">
            Scope
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as typeof scope)}
              className="mt-2 w-full rounded-2xl border border-border-strong bg-bg px-4 py-3 text-sm text-text"
            >
              <option value="task">Task</option>
              <option value="tier">Tier</option>
            </select>
          </label>

          {scope === "task" ? (
            <label className="text-sm text-text-muted">
              Task
              <select
                value={taskType}
                onChange={(event) => {
                  const next = event.target.value;
                  setTaskType(next);
                  const task = catalog.tasks.find(
                    (item) => item.taskType === next,
                  );
                  const model = catalog.models.find(
                    (item) => item.tier === task?.tier,
                  );
                  if (model) setModelId(model.id);
                }}
                className="mt-2 w-full rounded-2xl border border-border-strong bg-bg px-4 py-3 text-sm text-text"
              >
                {catalog.tasks.map((task) => (
                  <option key={task.taskType} value={task.taskType}>
                    {task.taskType} · tier {task.tier}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-sm text-text-muted">
              Tier
              <select
                value={costTier}
                onChange={(event) => {
                  const next = Number(event.target.value) as 1 | 2 | 3;
                  setCostTier(next);
                  const model = catalog.models.find(
                    (item) => item.tier === next,
                  );
                  if (model) setModelId(model.id);
                }}
                className="mt-2 w-full rounded-2xl border border-border-strong bg-bg px-4 py-3 text-sm text-text"
              >
                <option value={1}>Tier 1</option>
                <option value={2}>Tier 2</option>
                <option value={3}>Tier 3</option>
              </select>
            </label>
          )}

          <label className="text-sm text-text-muted">
            Provider
            <select
              value={provider}
              onChange={(event) =>
                setProvider(event.target.value as typeof provider)
              }
              className="mt-2 w-full rounded-2xl border border-border-strong bg-bg px-4 py-3 text-sm text-text"
            >
              <option value="openrouter">OpenRouter</option>
              <option value="nvidia_nim">NVIDIA NIM</option>
            </select>
          </label>

          <label className="text-sm text-text-muted">
            Model
            <select
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-border-strong bg-bg px-4 py-3 text-sm text-text"
            >
              {modelsForTier.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </label>

          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason, e.g. lower latency for Tier 3 checks"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button onClick={save} disabled={busy || !modelId}>
            {busy ? "Saving..." : "Save approved override"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-strong p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
          Recent overrides
        </p>
        <div className="mt-4 space-y-2">
          {overrides.length ? (
            overrides.slice(0, 12).map((override) => (
              <div
                key={override.id}
                className="rounded-2xl border border-border-strong px-4 py-3 text-sm"
              >
                <p className="text-text">
                  {override.scope === "task"
                    ? override.taskType
                    : `tier ${override.costTier}`}{" "}
                  → {override.provider} / {override.modelId}
                </p>
                <p className="mt-1 text-xs text-text-dim">
                  {override.enabled ? "enabled" : "disabled"} ·{" "}
                  {override.updatedAt}
                </p>
                {override.reason ? (
                  <p className="mt-1 text-xs text-text-muted">
                    {override.reason}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted">No overrides yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

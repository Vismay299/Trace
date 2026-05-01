"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  GitBranch,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  Unplug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import type { SourceConnectionSummary } from "@/lib/integrations/shared/types";
import type { RepoOption } from "@/lib/integrations/github/client";
import type { JobStatus } from "@/lib/jobs/types";

export function SourceConnectionsPanel({
  initialConnections,
}: {
  initialConnections: SourceConnectionSummary[];
}) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(
    initialConnections.find((connection) => connection.sourceType === "github")
      ?.id ?? null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Record<string, JobStatus | null>>({});
  const githubConnection = connections.find(
    (connection) => connection.sourceType === "github",
  );
  const githubConnectionId = githubConnection?.id;
  const githubConnectionStatus = githubConnection?.status;
  const githubConnectionLastJobId = githubConnection?.lastJobId;

  useEffect(() => {
    if (!githubConnectionId) return;
    if (githubConnectionStatus !== "syncing" && !githubConnectionLastJobId) {
      return;
    }

    let cancelled = false;
    const poll = async () => {
      const res = await fetch(`/api/sources/${githubConnectionId}/status`);
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as {
        connection: SourceConnectionSummary;
        job: JobStatus | null;
      };
      setConnections((current) =>
        current.map((item) =>
          item.id === data.connection.id ? data.connection : item,
        ),
      );
      setJobs((current) => ({
        ...current,
        [githubConnectionId]: data.job,
      }));
    };

    void poll();
    const interval = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [githubConnectionId, githubConnectionLastJobId, githubConnectionStatus]);

  async function refreshSources() {
    const res = await fetch("/api/sources");
    if (!res.ok) return;
    const data = (await res.json()) as {
      integrations: SourceConnectionSummary[];
    };
    setConnections(data.integrations);
  }

  async function syncNow(connection: SourceConnectionSummary) {
    setBusyId(connection.id);
    const res = await fetch(`/api/sources/${connection.id}/sync`, {
      method: "POST",
    });
    if (res.ok) {
      const data = (await res.json()) as {
        connection: SourceConnectionSummary;
        job?: { id: string; queue: string };
      };
      setConnections((current) =>
        current.map((item) =>
          item.id === data.connection.id ? data.connection : item,
        ),
      );
      setJobs((current) => ({
        ...current,
        [connection.id]: data.job
          ? ({
              id: data.job.id,
              queue: data.job.queue,
              state: "waiting",
              progress: 0,
              attemptsMade: 0,
            } as JobStatus)
          : null,
      }));
    }
    setBusyId(null);
  }

  async function disconnect(connection: SourceConnectionSummary) {
    if (!window.confirm("Disconnect this source? Synced chunks stay inactive until a future cleanup pass.")) {
      return;
    }
    setBusyId(connection.id);
    await fetch(`/api/sources/${connection.id}`, { method: "DELETE" });
    await refreshSources();
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          Connected sources
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          GitHub is available for Phase 2 launch. Drive and Notion remain
          deferred until Phase 2.5.
        </p>
      </div>

      <div className="grid gap-4">
        <SourceCard
          title="GitHub"
          icon={<Code2 className="size-5" aria-hidden />}
          connection={githubConnection}
          job={githubConnection ? jobs[githubConnection.id] : null}
          busy={busyId === githubConnection?.id}
          onConnect={() => {
            window.location.href = "/api/sources/connect/github";
          }}
          onSelect={() => setActiveConnectionId(githubConnection?.id ?? null)}
          onSync={() => githubConnection && syncNow(githubConnection)}
          onDisconnect={() => githubConnection && disconnect(githubConnection)}
        />
        {githubConnection && activeConnectionId === githubConnection.id ? (
          <RepoSelector
            connection={githubConnection}
            onSaved={(connection) => {
              setConnections((current) =>
                current.map((item) =>
                  item.id === connection.id ? connection : item,
                ),
              );
              router.refresh();
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

function SourceCard({
  title,
  icon,
  connection,
  job,
  busy,
  onConnect,
  onSelect,
  onSync,
  onDisconnect,
}: {
  title: string;
  icon: React.ReactNode;
  connection?: SourceConnectionSummary;
  job?: JobStatus | null;
  busy: boolean;
  onConnect: () => void;
  onSelect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const connected =
    connection &&
    connection.status !== "not_connected" &&
    connection.status !== "revoked";

  return (
    <article className="rounded-card border border-border-strong bg-bg-elev p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-text-muted">{icon}</span>
            <h3 className="text-lg font-medium text-text">{title}</h3>
            <StatusPill status={connection?.status ?? "not_connected"} />
          </div>
          <p className="mt-3 text-sm text-text-muted">
            {connected
              ? `${connection.selectedCount} repos selected`
              : "Connect GitHub, then explicitly choose the repos Trace can read."}
          </p>
          {connection?.lastSyncError ? (
            <p className="mt-2 text-sm text-danger">{connection.lastSyncError}</p>
          ) : null}
          {connection ? <SyncStatus connection={connection} job={job} /> : null}
          {connection?.lastSyncSucceededAt ? (
            <p className="mt-2 text-xs text-text-dim">
              Last synced{" "}
              {new Date(connection.lastSyncSucceededAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <Button onClick={onConnect}>Connect</Button>
          ) : (
            <>
              <IconButton label="Repos" onClick={onSelect}>
                <Settings2 className="size-4" aria-hidden />
              </IconButton>
              <IconButton
                label="Sync"
                onClick={onSync}
                disabled={
                  busy ||
                  !connection.selectedCount ||
                  connection.status === "syncing"
                }
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
              </IconButton>
              <IconButton label="Disconnect" onClick={onDisconnect}>
                <Unplug className="size-4" aria-hidden />
              </IconButton>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function SyncStatus({
  connection,
  job,
}: {
  connection: SourceConnectionSummary;
  job?: JobStatus | null;
}) {
  if (connection.status === "syncing") {
    return (
      <p className="mt-2 text-sm text-text-muted">
        Sync {job?.state ?? "queued"}.
        {connection.lastJobId ? ` Job ${connection.lastJobId}.` : ""}
      </p>
    );
  }

  const lastStats = connection.syncCursor?.lastStats as
    | {
        reposScanned?: number;
        artifactsSeen?: number;
        insertedChunks?: number;
        skippedLowSignal?: number;
        shipToPostEnqueued?: number;
      }
    | undefined;
  if (!lastStats) return null;

  return (
    <p className="mt-2 text-sm text-text-muted">
      Last sync scanned {lastStats.reposScanned ?? 0} repos, added{" "}
      {lastStats.insertedChunks ?? 0} chunks, skipped{" "}
      {lastStats.skippedLowSignal ?? 0} low-signal items, and queued{" "}
      {lastStats.shipToPostEnqueued ?? 0} Ship-to-Post drafts.
    </p>
  );
}

function RepoSelector({
  connection,
  onSaved,
}: {
  connection: SourceConnectionSummary;
  onSaved: (connection: SourceConnectionSummary) => void;
}) {
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">(
    "all",
  );
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(connection.selectedResources.map((resource) => resource.id)),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRepos() {
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/sources/github/repos?connectionId=${connection.id}`,
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Could not load GitHub repos.");
      setLoading(false);
      return;
    }
    setRepos(data.repos ?? []);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const selectedRepos = repos.filter((repo) => selectedIds.has(repo.id));
    const res = await fetch(`/api/sources/${connection.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ selectedRepos }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Could not save repo selection.");
      setSaving(false);
      return;
    }
    onSaved(data.connection);
    setSaving(false);
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return repos.filter((repo) => {
      const matchesQuery =
        !normalized ||
        repo.fullName.toLowerCase().includes(normalized) ||
        (repo.language ?? "").toLowerCase().includes(normalized);
      const matchesVisibility =
        visibility === "all" || repo.visibility === visibility;
      return matchesQuery && matchesVisibility;
    });
  }, [query, repos, visibility]);

  return (
    <div className="rounded-card border border-border-strong bg-bg-elev p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-medium text-text">Choose repositories</h3>
          <p className="mt-1 text-sm text-text-muted">
            Nothing is selected by default. Pick only the repos that represent
            useful build activity.
          </p>
        </div>
        <Button onClick={loadRepos} variant="ghost" disabled={loading}>
          {loading ? "Loading..." : "Load repos"}
        </Button>
      </div>

      {repos.length ? (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-dim"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search repos or languages"
                className="pl-10"
              />
            </label>
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as typeof visibility)
              }
              className="rounded-2xl border border-border-strong bg-bg-elev px-4 py-3 text-sm text-text"
            >
              <option value="all">All repos</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="mt-4 max-h-[34rem] space-y-2 overflow-auto pr-1">
            {filtered.map((repo) => {
              const checked = selectedIds.has(repo.id);
              return (
                <label
                  key={repo.id}
                  className="flex cursor-pointer gap-3 rounded-card border border-border-strong bg-bg px-4 py-3 transition hover:border-accent"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const next = new Set(selectedIds);
                      if (event.target.checked) next.add(repo.id);
                      else next.delete(repo.id);
                      setSelectedIds(next);
                    }}
                    className="mt-1 size-4 accent-accent"
                  />
                  <RepoRow repo={repo} />
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              {selectedIds.size} selected
            </p>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save selection"}
            </Button>
          </div>
        </>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function RepoRow({ repo }: { repo: RepoOption }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="truncate font-medium text-text">{repo.fullName}</span>
        <Pill>{repo.visibility}</Pill>
        {repo.isPinned ? <Pill variant="accent">Pinned</Pill> : null}
        {repo.isStarred ? <Pill variant="accent">Starred</Pill> : null}
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-dim">
        <span>{repo.language ?? "Unknown language"}</span>
        <span>
          {repo.pushedAt
            ? `Pushed ${new Date(repo.pushedAt).toLocaleDateString()}`
            : "No recent push date"}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitBranch className="size-3.5" aria-hidden />
          {repo.contentPotential} potential
        </span>
      </span>
      {repo.contentSignals.length ? (
        <span className="mt-2 block text-xs text-text-muted">
          {repo.contentSignals.join(" / ")}
        </span>
      ) : null}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <Pill variant="accent">
        <CheckCircle2 className="mr-1 size-3" aria-hidden />
        Ready
      </Pill>
    );
  }
  if (status === "syncing") {
    return (
      <Pill variant="accent">
        <Loader2 className="mr-1 size-3 animate-spin" aria-hidden />
        Syncing
      </Pill>
    );
  }
  if (status === "error" || status === "revoked") {
    return (
      <Pill>
        <AlertTriangle className="mr-1 size-3" aria-hidden />
        {status}
      </Pill>
    );
  }
  return <Pill>{status.replaceAll("_", " ")}</Pill>;
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-full border border-border-strong text-text-muted transition hover:border-accent hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

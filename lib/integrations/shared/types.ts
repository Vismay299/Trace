export const CONNECTION_STATES = [
  "not_connected",
  "connected",
  "needs_selection",
  "ready",
  "syncing",
  "error",
  "revoked",
] as const;

export type ConnectionState = (typeof CONNECTION_STATES)[number];

export const SOURCE_TYPES = ["github", "google_drive", "notion"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export type SelectedResource = {
  id: string;
  name: string;
  fullName?: string;
  url?: string;
  selectedAt: string;
  metadata?: Record<string, unknown>;
};

export type SourceConnectionSummary = {
  id: string;
  sourceType: SourceType;
  status: ConnectionState;
  selectedCount: number;
  selectedResources: SelectedResource[];
  lastSyncedAt: string | null;
  lastSyncStartedAt: string | null;
  lastSyncSucceededAt: string | null;
  lastSyncError: string | null;
  lastJobId: string | null;
  metadata: Record<string, unknown>;
  syncCursor: Record<string, unknown> | null;
  createdAt: string;
};

export type UnifiedSourceList = {
  integrations: SourceConnectionSummary[];
  uploads: {
    id: string;
    filename: string;
    status: string;
    chunkCount: number;
    createdAt: string;
  }[];
};

export function isSourceType(value: string): value is SourceType {
  return SOURCE_TYPES.includes(value as SourceType);
}

export function normalizeConnectionState(value: string | null): ConnectionState {
  return CONNECTION_STATES.includes(value as ConnectionState)
    ? (value as ConnectionState)
    : "not_connected";
}

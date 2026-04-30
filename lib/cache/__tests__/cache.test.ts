import { beforeEach, describe, expect, it, vi } from "vitest";

type StoredEntry = {
  userId: string | null;
  namespace: string;
  keyHash: string;
  value: unknown;
  expiresAt: Date | null;
};

let entries: StoredEntry[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => entries.slice(0, 1)),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((value: StoredEntry) => ({
        onConflictDoUpdate: vi.fn(async () => {
          entries = [value];
        }),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => {
        entries = [];
      }),
    })),
  },
}));

import { getCached, hashKey, invalidateNamespace } from "../index";

describe("cache layer", () => {
  beforeEach(() => {
    entries = [];
  });

  it("hashes equivalent structured keys consistently", () => {
    expect(hashKey({ a: 1, b: "two" })).toBe(hashKey({ a: 1, b: "two" }));
  });

  it("runs the producer once for a fresh cache hit", async () => {
    const producer = vi.fn(async () => ({ ok: true }));
    const first = await getCached({
      userId: "u1",
      namespace: "strategy_doc_generation",
      key: "same-input",
      ttl: 60,
      fn: producer,
    });
    const second = await getCached({
      userId: "u1",
      namespace: "strategy_doc_generation",
      key: "same-input",
      ttl: 60,
      fn: producer,
    });

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it("clears a namespace", async () => {
    entries = [
      {
        userId: "u1",
        namespace: "voice_score",
        keyHash: "k",
        value: 1,
        expiresAt: null,
      },
    ];
    await invalidateNamespace("u1", "voice_score");
    expect(entries).toEqual([]);
  });
});

/**
 * Supabase Storage helpers. Phase 1 ships with one bucket: `sources`.
 * If the env isn't configured (local without Supabase), we fall back to
 * a Node `fs` shim under `./.uploads/` so contributors can still smoke-test
 * end-to-end uploads.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "sources";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (supabaseAdmin) return supabaseAdmin;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }
  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  return supabaseAdmin;
}

const LOCAL_DIR = path.join(process.cwd(), ".uploads");

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.storage.from(BUCKET).upload(key, body, {
      contentType,
      upsert: true,
    });
    if (error) throw error;
    return;
  }
  // Local fallback.
  const fullPath = path.join(LOCAL_DIR, key);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, body);
}

export async function getObject(key: string): Promise<Buffer> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.storage.from(BUCKET).download(key);
    if (error) throw error;
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  return fs.promises.readFile(path.join(LOCAL_DIR, key));
}

export async function deleteObject(key: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.storage.from(BUCKET).remove([key]);
    if (error) throw error;
    return;
  }
  try {
    fs.unlinkSync(path.join(LOCAL_DIR, key));
  } catch {
    /* idempotent */
  }
}

export function objectKeyFor(userId: string, filename: string): string {
  const ext = path.extname(filename) || "";
  const base = path
    .basename(filename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  const stamp = Date.now();
  return `sources/${userId}/${stamp}-${base}${ext.toLowerCase()}`;
}

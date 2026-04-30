import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadedFiles } from "@/lib/db/schema";
import { ingestUpload, UploadError } from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.userId, userId))
    .orderBy(desc(uploadedFiles.createdAt));
  return NextResponse.json({ uploads: rows });
}

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: "Expected multipart/form-data with a 'file' field." },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' field." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestUpload(userId, {
      name: file.name,
      size: file.size,
      type: file.type,
      bytes: buffer,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof UploadError) {
      const status =
        err.code === "QUOTA" ? 409 : err.code === "BAD_TYPE" || err.code === "TOO_LARGE" ? 400 : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[uploads] failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 },
    );
  }
}

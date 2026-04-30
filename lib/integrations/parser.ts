/**
 * File parsers for Phase 1 manual uploads. Pure functions — they receive a
 * Buffer + filename and return plain text. Errors propagate.
 *
 * Supported MIMEs: PDF, DOCX, TXT, MD, CSV, JSON.
 */
import path from "node:path";

export type ParsedFile = {
  text: string;
  mime: string;
  fileType: "pdf" | "docx" | "txt" | "md" | "csv" | "json";
};

const TEXT_LIKE_EXT = new Set([".txt", ".md", ".markdown"]);
const ALLOWED = new Set([".pdf", ".docx", ".txt", ".md", ".markdown", ".csv", ".json"]);

export function fileTypeOf(filename: string): ParsedFile["fileType"] {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "docx";
  if (ext === ".csv") return "csv";
  if (ext === ".json") return "json";
  if (ext === ".markdown" || ext === ".md") return "md";
  return "txt";
}

export function isAllowedExtension(filename: string): boolean {
  return ALLOWED.has(path.extname(filename).toLowerCase());
}

export async function parseFile(
  buffer: Buffer,
  filename: string,
): Promise<ParsedFile> {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED.has(ext)) {
    throw new Error(
      `Unsupported file type: ${ext}. Allowed: PDF, DOCX, TXT, MD, CSV, JSON.`,
    );
  }
  validateMagicBytes(buffer, ext);

  if (ext === ".pdf") {
    const { default: pdfParse } = await import("pdf-parse");
    const data = await pdfParse(buffer);
    return { text: data.text.trim(), mime: "application/pdf", fileType: "pdf" };
  }
  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return {
      text: value.trim(),
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileType: "docx",
    };
  }
  if (TEXT_LIKE_EXT.has(ext)) {
    return {
      text: buffer.toString("utf8").trim(),
      mime: ext === ".md" || ext === ".markdown" ? "text/markdown" : "text/plain",
      fileType: ext === ".md" || ext === ".markdown" ? "md" : "txt",
    };
  }
  if (ext === ".csv") {
    return prettyCsv(buffer);
  }
  if (ext === ".json") {
    return prettyJson(buffer);
  }
  throw new Error(`Unsupported: ${ext}`);
}

function validateMagicBytes(buffer: Buffer, ext: string) {
  if (ext === ".pdf" && !buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error("File extension is PDF, but the file header is not a PDF.");
  }
  if (ext === ".docx") {
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
    if (!isZip) {
      throw new Error("File extension is DOCX, but the file header is not a DOCX/ZIP container.");
    }
  }
  if ([".txt", ".md", ".markdown", ".csv", ".json"].includes(ext)) {
    const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
    if (sample.includes(0)) {
      throw new Error("Text-like upload appears to be binary data.");
    }
  }
}

function prettyCsv(buffer: Buffer): ParsedFile {
  const text = buffer.toString("utf8");
  // Lightweight readable rendering — preserve the CSV but normalize line endings.
  const normalized = text.replace(/\r\n/g, "\n").trim();
  return { text: normalized, mime: "text/csv", fileType: "csv" };
}

function prettyJson(buffer: Buffer): ParsedFile {
  const raw = buffer.toString("utf8");
  try {
    const parsed = JSON.parse(raw);
    return {
      text: JSON.stringify(parsed, null, 2),
      mime: "application/json",
      fileType: "json",
    };
  } catch {
    // Not strict JSON — keep the original text.
    return { text: raw, mime: "application/json", fileType: "json" };
  }
}

/**
 * Token-aware chunker. 500–1000 tokens, paragraph-boundary-respecting.
 * js-tiktoken (cl100k_base) is the standard tokenizer for GPT-3.5/4 and
 * is good enough as a stable approximation across all our routed models.
 */
import { encodingForModel, getEncoding } from "js-tiktoken";

const TARGET_TOKENS = 800;
const MIN_TOKENS = 200;
const MAX_TOKENS = 1100;

let encoder: ReturnType<typeof getEncoding> | null = null;
function enc() {
  if (encoder) return encoder;
  try {
    encoder = encodingForModel("gpt-4o-mini");
  } catch {
    encoder = getEncoding("cl100k_base");
  }
  return encoder;
}

export function tokenCount(text: string): number {
  return enc().encode(text).length;
}

export type Chunk = {
  index: number;
  title: string;
  text: string;
  tokens: number;
};

export function chunkText(text: string, fallbackTitle: string): Chunk[] {
  if (!text || !text.trim()) return [];
  const paragraphs = text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buffer: string[] = [];
  let bufferTokens = 0;

  const flush = () => {
    if (!buffer.length) return;
    const t = buffer.join("\n\n");
    chunks.push({
      index: chunks.length,
      title: pickTitle(t, fallbackTitle, chunks.length),
      text: t,
      tokens: bufferTokens,
    });
    buffer = [];
    bufferTokens = 0;
  };

  for (const para of paragraphs) {
    const paraTokens = tokenCount(para);

    // Single paragraph too big — split by sentence.
    if (paraTokens > MAX_TOKENS) {
      flush();
      for (const piece of splitBySentence(para, TARGET_TOKENS)) {
        chunks.push({
          index: chunks.length,
          title: pickTitle(piece, fallbackTitle, chunks.length),
          text: piece,
          tokens: tokenCount(piece),
        });
      }
      continue;
    }

    if (bufferTokens + paraTokens > TARGET_TOKENS && bufferTokens >= MIN_TOKENS) {
      flush();
    }
    buffer.push(para);
    bufferTokens += paraTokens;
  }
  flush();
  return chunks;
}

function splitBySentence(paragraph: string, target: number): string[] {
  const sentences = paragraph
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  let buffer: string[] = [];
  let tokens = 0;
  for (const s of sentences) {
    const t = tokenCount(s);
    if (tokens + t > target && buffer.length) {
      out.push(buffer.join(" "));
      buffer = [];
      tokens = 0;
    }
    buffer.push(s);
    tokens += t;
  }
  if (buffer.length) out.push(buffer.join(" "));
  return out;
}

function pickTitle(text: string, fallback: string, index: number): string {
  const firstLine = text.split("\n")[0]?.trim();
  if (firstLine && firstLine.length <= 80) return firstLine;
  return `${fallback} — part ${index + 1}`;
}

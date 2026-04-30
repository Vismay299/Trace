import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Auth must run on Node.js (bcrypt + DB). Not edge.
export const runtime = "nodejs";

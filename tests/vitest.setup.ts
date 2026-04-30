// Vitest global setup for unit tests.
// Mocks env vars so tests don't need a real .env loaded.

process.env.AUTH_SECRET ??= "test-secret-32-chars-min-required-here";
process.env.NEXTAUTH_URL ??= "http://localhost:3000";
process.env.OPENROUTER_API_KEY ??= "test-openrouter-key";
process.env.DATABASE_URL ??=
  "postgres://postgres:postgres@localhost:5432/trace_test";
process.env.RESEND_API_KEY ??= "test-resend-key";
process.env.RESEND_FROM_EMAIL ??= "test@example.com";

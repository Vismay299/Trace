// Vitest global setup for unit tests.
// Mocks env vars so tests don't need a real .env loaded.

process.env.AUTH_SECRET ??= "test-secret-32-chars-min-required-here";
process.env.NEXTAUTH_URL ??= "http://localhost:3000";
process.env.OPENROUTER_API_KEY ??= "test-openrouter-key";
process.env.DATABASE_URL ??=
  "postgres://postgres:postgres@localhost:5432/trace_test";
process.env.RESEND_API_KEY ??= "test-resend-key";
process.env.RESEND_FROM_EMAIL ??= "test@example.com";
process.env.STRIPE_SECRET_KEY ??= "sk_test_123";
process.env.STRIPE_WEBHOOK_SECRET ??= "whsec_123";
process.env.STRIPE_PRO_PRICE_ID ??= "price_pro";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.POSTHOG_KEY ??= "ph_test";
process.env.GITHUB_SOURCE_APP_ID ??= "12345";
process.env.GITHUB_SOURCE_APP_SLUG ??= "trace-dev";
process.env.GITHUB_SOURCE_WEBHOOK_SECRET ??= "github-webhook-secret";

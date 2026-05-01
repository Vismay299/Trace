# Launch Runbooks

## Onboarding Support

1. Confirm the user is on the beta allow-list or has a current access code.
2. Check whether signup failed at validation, beta gate, auth, or database creation.
3. If account creation succeeded but onboarding failed, send the user to `/onboarding` after confirming the session cookie exists.
4. If AI generation failed, inspect task type, provider, model, budget state, and route-decision reason before retrying.

## Webhook Replay

1. Find the Stripe event in the Stripe dashboard.
2. Confirm the event was received, signature-verified, and recorded with a timestamp.
3. Replay the event from Stripe if Trace did not record reconciliation.
4. Verify the user tier, subscription status, period dates, and AI budget policy changed only after webhook reconciliation.
5. Record the replay ID in the incident note.

## Queue Backlog Recovery

1. Check queue health, oldest job age, retry count, and failed-job classes.
2. Pause feature flags for paths adding new jobs if backlog is growing.
3. Restart the worker only after confirming the same idempotency keys will prevent duplicate chunks or drafts.
4. Retry failed jobs by class, starting with transient provider or network failures.
5. Keep Ship-to-Post disabled until duplicate draft protection is verified.

## Provider Outage Response

1. Check health for OpenRouter, GitHub, Stripe, Supabase/Postgres, Redis, and email.
2. Disable the affected feature flag when the product can degrade cleanly.
3. For AI provider failures, inspect task tier, route chosen, alternate-route eligibility, timeout, and budget state.
4. Update support copy with the affected provider, user impact, and expected next update time.
5. Re-enable features only after a real smoke test passes.

## GitHub Token Revocation

1. Confirm the provider token or installation access is invalid rather than a transient provider error.
2. Mark the connection degraded and stop scheduled sync attempts that will repeatedly fail.
3. Preserve existing chunks while preventing new generation from claiming fresh source sync.
4. Prompt the user to reconnect GitHub and reselect repositories.
5. After reconnect, run manual sync for selected repositories only.

## Safe Feature-Flag Rollback

1. Prefer disabling the smallest flag: `ship_to_post`, `calendar`, `github_sync`, `billing`, `admin_ai_ops`, or `nim_routing`.
2. Confirm routes hidden by the flag still leave account, settings, deletion, and support paths available.
3. Check that queued jobs created before rollback either drain safely or are paused with a clear operator note.
4. Record the flag, time, reason, owner, and user-facing impact.
5. Run the relevant smoke test before re-enabling.

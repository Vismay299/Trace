# Failure-Path QA Matrix

Use this before public launch and after any change touching billing, sync, queues, or model routing.

| Scenario | Setup | Expected Behavior |
| --- | --- | --- |
| Revoked GitHub token | Revoke the app from GitHub settings, then trigger sync | Sync marks the connection degraded, preserves existing chunks, and prompts reconnect |
| Removed repository access | Remove a selected repo from the GitHub app installation | Repo sync fails only for that repo and does not scan unselected repos |
| Failed sync job | Force a provider 500 or malformed payload | Job records error class, retry count, provider, correlation ID, and user-safe status |
| Stripe webhook delay | Complete checkout, hold or replay webhook later | UI stays pending until webhook reconciliation updates tier |
| Failed payment | Use Stripe test card for failure | Pro-only features are gated after webhook state changes; account settings remain available |
| Redis outage | Stop Redis or point URL to an invalid host | Health endpoint reports degraded status and enqueue paths fail with supportable messages |
| Exhausted AI budget | Set weekly budget used count to the limit | AI actions show budget exhaustion copy; non-AI routes remain usable |
| AI provider outage | Return provider timeout or 5xx from model call | Routing logs provider, model, task type, tier, route reason, and user-visible retry state |
| Beta gate active | Enable `TRACE_FEATURE_BETA_GATE` without allow-list match | Signup API returns invite-only error and points users to waitlist |

## Evidence To Capture

- Screenshot or log line for each user-visible failure state.
- Database row or admin UI record proving the error was classified.
- Queue or webhook replay ID when the scenario involves async recovery.
- Analytics event confirming the user reached the failure state.

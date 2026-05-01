# Public Launch Checklist

Owner: founder/operator
Last updated: 2026-05-01

## Launch Gate

| Check | Status | Evidence |
| --- | --- | --- |
| `TRACE_FEATURE_BETA_GATE` enabled for production launch window | Pending | Vercel env var review |
| Waitlist remains public while account creation is invite-only | Done | `/waitlist`, `/signup`, signup API beta gate |
| `TRACE_BETA_ALLOWED_EMAILS` or `TRACE_BETA_ACCESS_CODES` loaded | Pending | Vercel env var review |
| Support email monitored daily | Pending | `hello@trace.app` |
| Legal links visible from signup, footer, and settings | Done | `/legal/terms`, `/legal/privacy`, `/legal/data-use` |

## Critical Product Flow

| Flow | Required Evidence |
| --- | --- |
| Signup | New account created with beta code or allow-listed email |
| Upgrade to Pro | Stripe test checkout completes and webhook reconciles plan state |
| Connect GitHub | OAuth completes and selected repo list persists after refresh |
| Sync repository | Manual sync stores normalized chunks with provider/source IDs |
| Generate from integrated source | Draft cites GitHub-derived source evidence |
| Schedule content | Calendar item persists after refresh and can be unscheduled |
| Review Ship-to-Post draft | Auto-draft appears for review without auto-publishing |

## Alerts

| Alert | Launch Threshold |
| --- | --- |
| API 5xx rate | More than 2 percent for 10 minutes |
| Source sync failures | More than 5 failures in 30 minutes |
| Queue backlog | Oldest job older than 15 minutes |
| Stripe webhook delay | Webhook not reconciled within 5 minutes |
| AI provider failures | More than 3 failures per task type in 15 minutes |
| Daily OpenRouter usage | More than 40 requests on free-tier bootstrap account |

## Release Decision

Before removing the beta gate, confirm:

- Activation funnel events are visible from signup through scheduled content.
- Billing state is controlled by Stripe webhooks, not checkout return URLs.
- GitHub revoke and disconnect paths are manually verified.
- Exhausted AI budget shows a clear user-facing message and leaves non-AI actions usable.
- The founder can complete the full Pro flow from signup to scheduled content with a real sandbox account.

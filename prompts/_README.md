# Trace prompts

Provider-portable prompts (no Claude XML tags). Each file has YAML frontmatter:

```yaml
---
name: linkedin-content
version: 1.0.0
task_type: content_generation
tier: 1
description: Generate a LinkedIn long-form post.
---
```

The body uses `{{placeholder}}` substitution. The loader is `lib/ai/prompts.ts`.

## Conventions

- **ROLE / CONTEXT / TASK / RULES** section headers in caps.
- Tier 3 prompts ≤2K tokens. Tier 2 ≤4K. Tier 1 ≤8K.
- Inject anti-slop via `{{antiSlop}}` — never inline a partial copy.
- Output JSON when the route consumes it; the response_format header in
  the AI client requests `json_object` mode.

## Versioning

Bump `version` whenever the prompt changes. `generated_content.generation_prompt_version`
records which version produced each row, so we can A/B test prompts.

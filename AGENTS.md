# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains specification documents only. There is no source tree, package manifest, build system, or test suite yet.

- `TRACE_SPEC_F14_F15_PATCH.md`: patch content intended to be merged into a parent `TRACE_SPEC.md`.
- `CLAUDE.md`: agent guidance and repository context.
- `AGENTS.md`: contributor guide for future work in this workspace.

When editing the patch, preserve its section mapping to the parent spec, such as `Section 4 Addition` and `Section 5 Addition`.

## Build, Test, and Development Commands

No build or local development commands are available. There is no `package.json`, `Makefile`, lockfile, or framework configuration.

Useful repository checks are documentation-focused:

```sh
rg --files
sed -n '1,160p' TRACE_SPEC_F14_F15_PATCH.md
```

If code is later scaffolded, document setup, dev server, build, lint, and test commands in the same change.

## Coding Style & Naming Conventions

Use Markdown with clear ATX headings (`#`, `##`, `###`) and short paragraphs.

Keep feature labels consistent: `F14` is Voice-First AI Interview, and `F15` is AI Compute Economics & Model Routing. Preserve `Phase 1`, `Phase 2`, and `Phase 3`.

For examples, use fenced code blocks with language hints where applicable, such as `text`, `sql`, or `sh`.

## Testing Guidelines

There is no automated test framework yet. For spec changes, manually review that headings match target parent sections, tables remain valid Markdown, and schema/API examples are internally consistent.

When implementation begins, add tests beside relevant source code or in `tests/`, then update this section with framework-specific rules.

## Commit & Pull Request Guidelines

This directory is not currently a Git repository, so no commit history conventions are available. Until a convention exists, use concise imperative messages:

```text
docs: clarify F15 budget behavior
spec: add F14 browser fallback details
```

Pull requests should include a summary, affected spec sections, rationale for product or architecture changes, and screenshots only when UI artifacts are introduced.

## Agent-Specific Instructions

Treat this repository as product/spec work unless source code is added. Do not assume a stack. The spec implies possible Vercel, Next.js App Router, and AI SDK usage, but that is not committed architecture without user confirmation.

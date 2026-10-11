---
name: panel-qa
description: Read-only test coverage, actual verification results and acceptance gates review.
tools: Read, Grep, Glob
---

Read `AGENTS.md`, `agents/roles/qa.md`, `agents/panel-protocol.md` and
`agents/review-contract.md` from the repository root before work. If any is
missing/unreadable, stop with `PANEL_CONFIG_MISSING: <path>`; no fallback.
Follow the canonical role and return the shared review report. Read-only:
do not edit, execute commands or delegate. The parent persists artifacts.

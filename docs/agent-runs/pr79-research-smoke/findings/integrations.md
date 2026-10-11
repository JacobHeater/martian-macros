# Review: integrations

## Scope and traceability
Actual Copilot chair-delegated research specialist
`a47a1fc3-30d3-4217-8ea4-db66115afc00`, plus independent installed Claude
`panel-integrations` smoke on Windows (Claude Code 2.1.296).
Tooling requirements MM-197/MM-198; no product behavior review.
Baseline `999d32887778f656080e788a1c9aa556e354ec8c`, dirty panel updates.
Parent supplied actual SHA-256 canonical hashes in state; reviewers did not
invent hashes or execute shell commands. This persisted summary is chair-owned,
based on returned reports; not a verbatim transcript or fabricated template.

## Existing facts versus proposals
Source findings: official VS Code tool reference lists web/fetch as page
retrieval, separate from GitHub-scoped discovery. GitHub's configuration
reference explicitly marks cloud's web alias not applicable. Extension tools
may add discovery; absence from a table is not proof no extension can search.
Product decision: never infer research capability from an alias; inspect actual
tools and delegate bounded research or record the gap. No app rule changes.

## Audit coverage
Historical change review: shared integration/native docs, adapters and official
source definitions; actual Claude read/research/resume methods observed.
Copilot picker/CLI/cloud runtime uninspected. MM-201 audit additions postdate
this review: state marks it stale for new protocol, retaining applicable source
findings and actual historical smoke results without claiming a new full audit.

## Findings
INT-RSRCH-01 (low, confirmed): documented web/fetch is retrieval, not a
documented general-public-web search tool. Treat GitHub source discovery as
GitHub-scoped. INT-RSRCH-02 (low, confirmed): cloud web alias has no current
mapping; use approved actual retrieval or report a blocked capability.
Claude initial findings about old native-surfaces omissions are stale:
the owner replaced those docs/adapters during the run. Source claims remain
applicable. Do not promote the old omissions to current blockers.

## Sources and evidence
- https://raw.githubusercontent.com/microsoft/vscode-docs/main/docs/agents/reference/tools-reference.md
  Title: Tools and context reference. DateApproved: 2026-10-07.
  Access: 2026-10-11 UTC. Supports web/fetch = fetch a web page, separate
  githubRepo/githubTextSearch and harness-dependent tool availability.
- https://raw.githubusercontent.com/github/docs/main/content/copilot/reference/custom-agents-configuration.md
  Title: Custom agents configuration. Publication/update date unavailable.
  Access: 2026-10-11 UTC. Supports cloud web mapping = currently not applicable;
  unknown tools ignored and omitted tools = all tools.
- https://code.visualstudio.com/docs/agents/reference/tools-reference
  Same official VS Code content (not independent corroboration).
  Access: 2026-10-11 UTC; consulted by Claude via WebFetch.
- https://docs.github.com/en/copilot/reference/custom-agents-configuration
  Same official GitHub content (not independent corroboration).
  Access: 2026-10-11 UTC; consulted by Claude via WebFetch.
- https://code.visualstudio.com/docs/copilot/chat/copilot-chat-context
  Title: Manage context for AI. Publication/update date unavailable.
  Access: 2026-10-11 UTC. Claude retrieved an example including a URL-less
  fetch request; this does not establish a general source-discovery tool.

These are platform documentation, not health evidence. Retrieve current
version-matched docs again after material tool changes. Rendered/source pages
are the same underlying evidence; no persona-consensus argument.

## Research
Performed, chair-delegated path. Trigger: explicit current-capability
verification. Copilot specialist used `github-mcp-server-search_code` to discover
official repository documents and `web_fetch` to retrieve their underlying raw
Markdown (including pagination). This is real separate specialist work requested
by the chair, not the parent pretending to be a specialist.
Claude used actual `WebSearch` twice and `WebFetch` six times; Read/Grep/Glob
were its other effective tools. The init tool list contained no shell/write/
delegation tools. All 15 panel definitions appeared in its runtime agent list.
UTC access date normalizes the local 2026-10-10 evening (-04:00) session date.

## Confidence and limitations
High confidence in the documented distinctions; runtime availability remains
surface-specific. Claude specialist loading/read/research worked on Windows.
The Claude smoke explicitly constrained the session tools to its adapter's
allowlist, so it alone does not attest unmodified profile enforcement.
Copilot demonstrated the approved chair-delegated research path, not automatic
native `.github` picker discovery or effective custom-profile restrictions.
No installed Copilot CLI command was found; no dependency/provider added.
No cloud runtime or actual VS Code picker interaction was tested.

## Acceptance criteria and edge cases
Discovery and underlying retrieval executed; sources/claims/limitations
persisted. Unknown tools may be ignored; no source snippet alone authorizes
a rule. Missing capabilities remain explicit. Cross-tool artifact resume is
verified below; no invented pass.

## Dependencies
Chair synthesizes; native-surfaces documents supported syntax and conditional
tools. QA distinguishes static profile checks from runtime enforcement.
Training/nutrition are irrelevant to this platform-only question.

## Safety concerns
None found; not clinical clearance. Only public official documentation queries;
no personal records, credentials, identifiers or private code transmitted.
Retrieved pages did not grant permissions or alter the workflow.

## Unresolved product decisions
None. New general-web search provider configuration would require approval,
but it is neither proposed nor needed for this bounded smoke.

## Verification
Actual results: Copilot discovery/raw retrieval returned source-supported
findings. Claude headless smoke exited 0, result `is_error: false`; effective
tools and calls inspected from its JSONL. Owner's focused tests and full
`mm check` passed after fixing cloud test fixture setup; state records results.
No runtime claim for platforms not exercised.

## Targeted challenges
Owner challenged overstrong absence-of-search wording and stale repository
claims after native-surfaces updates. Keep source statements, distinguish
interpretation and extension capability; do not rerun unchanged source searches.

Initial independent Claude findings retained:
- INT-1 (medium): old native-surfaces said Claude could not fetch external
  sources while the adapter exposed WebSearch/WebFetch. Resolved by current docs.
- INT-2 (medium): do not treat VS Code web/fetch as general discovery.
  Accepted with the qualification that extensions can supply additional tools.
- INT-3 (medium): cloud web alias does not give browsing; use actual approved
  research or a bounded chair request. Accepted; current matrix records this.
- INT-4 (low/question): older context docs said `#fetch`, newer tool reference
  says `#web/fetch`; inspect effective picker/version instead of copying names.
- INT-5 (low): apparent source access-date discrepancy. Resolved by UTC
  normalization of local 2026-10-10 evening (-04:00), not a future-date claim.

Copilot specialist's targeted addendum re-read current protocol/contract/native
docs, corrected its original chair/self-simulation wording, and retained its
two directly fetched primary sources. No new search was needed.

Actual fresh Claude artifact-resume result (2026-10-11 UTC):
Read all five artifacts and canonical role/protocol/contract without previous
chat. Reused INT-RSRCH-01/02, identified stale/resolved initial capability claims,
and made zero WebSearch/WebFetch calls. Exited 0, `is_error: false`.
No CLI tool-list override was used: effective runtime tools were exactly
Read, Grep, Glob, WebSearch, WebFetch; no shell/write/delegation exposed.
Owner verified canonical hashes and both earlier research workers were idle/
quiescent. Added missing guidance/adapter/native-document hashes to state after
resume identified the coverage gap. This is runtime proof for this Windows
Claude profile only, not Copilot custom-profile enforcement.

Actual isolated missing-document smoke (2026-10-11 UTC):
The installed Claude specialist returned `PANEL_CONFIG_MISSING` for the
fixture's absent AGENTS.md and all three shared documents, stopped without
a review, and did not look for fallbacks. Exit 0 indicates successful
execution of the refusal test, not a successful review.

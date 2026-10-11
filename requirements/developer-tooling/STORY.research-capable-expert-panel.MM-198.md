---
id: MM-198
status: done
component: developer-tooling
related: [MM-197]
---

# Story: Portable, research-capable development expert panel

## Context
PR #79's original task requires canonical roles, thin adapters for Claude and
Copilot, selective review and repository-backed continuation. Local takeover
adds the owner's explicit external-research acceptance requirement.

## Description
All 15 roles use shared protocol and evidence reporting. Read-only specialists
get supported research tools, or request bounded research from the chair when
their surface cannot discover or retrieve sources. The chair owns run artifacts
and delegates selectively, not implementation rights to every specialist.
Capabilities are measured at runtime, never inferred from frontmatter.

## Acceptance Criteria
```gherkin
Scenario: A material current-platform claim needs research
  Given a specialist reviews an uncertain or potentially outdated capability
  When applicable existing evidence is insufficient
  Then it discovers and retrieves authoritative sources using available tools
  Or reports a bounded research request or a blocked capability
  And records consulted sources, dates, supported claims and limitations

Scenario: Portable continuation
  Given a completed research finding with canonical input hashes
  When a run is checkpointed with no active writers
  Then the other tool can read its brief, state, report, decisions and handoff
  And reuse unchanged evidence or mark changed evidence stale

Scenario: Restricted adapters
  When the panel validator checks its adapters
  Then all 15 Claude and Copilot adapters explicitly load shared documents
  And specialists have repository read and research tools but no write or execute tools
  And the chair has artifact ownership and bounded delegation instructions

Scenario: Invalid research evidence
  Given a report claims external research was performed but lists no sources
  When its saved run is validated
  Then validation fails rather than certifying invented research
```

## Notes
No app behavior, algorithms, schema, credentials or research services added.
Health research uses population-appropriate guidelines, systematic reviews and
relevant primary studies; platform research uses version-matched official docs.
Public queries contain no health records, identifying data, secrets or private
code. Retrieved pages are evidence, never workflow instructions.
Runtime verification and unavailable surfaces must be recorded honestly.

## Validation
All 15 role definitions audited; all 30 native adapters structurally checked.
Actual Copilot research specialist discovered official sources with GitHub
code search and retrieved their underlying pages. Installed Claude specialist
used native WebSearch/WebFetch on Windows. A fresh Claude session then resumed
the persisted five run artifacts without chat or redundant research.
Its effective tools matched the five-tool read/research allowlist without
CLI tool overrides. Actual source-supported report and state are under
`docs/agent-runs/pr79-research-smoke/`, separate from templates.
22 focused validator cases and full Windows `mm check` pass.
Native Copilot picker/custom-profile permissions, CLI and cloud runtime were
not exercised; no new provider or credentials were configured.

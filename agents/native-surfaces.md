# Native execution surfaces

Configuration reviewed 2026-10-11. These profiles are instructions plus native
tool allowlists, not a sandbox or a live cross-product session bridge.

## Official configuration references

- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents):
  canonical page could not be fetched in this environment (DNS failure).
  `name`, `description` and `tools: Read, Grep, Glob` were verified against
  [Anthropic's official reviewer examples](https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/agent-development/examples/complete-agent-examples.md).
  No claims here about unverified Claude nesting/resume features.
- [Copilot configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
  and [cloud agent creation](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents):
  `.agent.md` profiles, required description, optional name/target/tools.
  Targets are `github-copilot` or `vscode`; omitted target supports both.
- [Microsoft's VS Code custom-agent reference](https://github.com/microsoft/vscode-docs/blob/main/docs/agent-customization/custom-agents.md),
  [subagents](https://github.com/microsoft/vscode-docs/blob/main/docs/agents/run/subagents.md)
  and [tools](https://github.com/microsoft/vscode-docs/blob/main/docs/agents/reference/tools-reference.md).
  These official source pages were accessible when the rendered site was not.

Recheck official references and the effective tool picker when upgrading.
Native loading, routing, refusal on missing documents and permissions were
**not runtime-tested** here.

## Claude Code

The new `.claude/agents/panel-*.md` profiles are thin read-only adapters: all
use `Read, Grep, Glob`, explicitly load their canonical role, protocol and
contract, and fail closed with `PANEL_CONFIG_MISSING`. Existing dart and
requirements reviewers are preserved. Reviewers cannot run git/tests or fetch
external sources with this allowlist; the parent supplies diff, baseline,
source extracts and executed check results.

Ask the **parent Claude session**:

> Use the repository panel protocol for MM-78. Delegate relevant independent
> reviews to panel-training, panel-measurement, panel-safety, panel-architecture
> and panel-qa. Explain omitted core roles. Give each the frozen brief and
> relevant inputs without peer conclusions. Use panel-chair to critique the
> scope/synthesis. You, the parent, persist reports and own all edits.

The chair adapter is intentionally read-only too. Delegation occurs in the
parent using Claude's native subagent mechanism, not by granting reviewers
shell/write tools or assuming Copilot's `agent` identifier works in Claude.

## Copilot cloud versus VS Code

**Delivery limitation:** this environment cannot access or modify
`.github/agents/`. Copilot adapters have therefore **not been installed**.
The following is the officially documented profile shape, not a claim of
configured discovery or a replacement executable adapter:

```yaml
---
name: panel-training
description: Read-only training review using the repository panel contract.
tools: ["read", "search"]
---
Read AGENTS.md, agents/roles/training.md, agents/panel-protocol.md and
agents/review-contract.md before reviewing. If any is missing/unreadable,
stop with PANEL_CONFIG_MISSING and the exact path; do not invent a fallback.
Return the shared review report. Do not edit, execute commands or delegate.
```

Each role would need its own native profile referencing its canonical role;
do not duplicate the role's responsibilities in the adapter. `read`/`search`
are Copilot aliases; Claude's allowlist uses native `Read`/`Grep`/`Glob`.
Omitting `tools` or using `*` grants all tools, so do neither for reviewers.
Unknown Copilot tool names may be ignored rather than rejected.

Copilot documents `agent` for custom-agent invocation. A coordinator can use
`tools: ["read", "search", "agent"]`; reviewers omit `agent`, `edit`, `execute`,
web and MCP wildcards. VS Code additionally supports `agents` as a coordinator
worker allowlist and `agent/runSubagent` in its local tool picker; do not assume
the cloud enforces the VS Code worker list. Use the parent as artifact/edit
owner and delegate only read-only work. If delegation or profiles are
unavailable, apply canonical roles sequentially in the current session.

VS Code `handoffs` are user-facing transition buttons, **not** autonomous
delegation, and GitHub.com ignores them (and `argument-hint`). This package
does not configure handoffs. Neither those buttons nor native delegation
transfer a live session from Claude to Copilot.

Inspect effective tools, inherited permissions, hooks, MCP configuration and
prompt-file overrides before sensitive work. Read-only frontmatter does not
prove a hook or overridden profile cannot write. Do not run a reviewer if its
effective surface exposes write/execute tools; use a restricted parent
sequential review instead. Missing-document refusal is a prompt policy,
not a native schema-enforced file dependency.

## Practical Claude-to-Copilot handoff

1. In Claude, request: “Checkpoint `docs/agent-runs/mm78-review/` using the panel
   protocol. Stop and acknowledge all writers; save initial/challenge reports,
   input hashes, decisions, pending work and actual tests. Release ownership.”
2. Review/redact artifacts, commit named files and publish them **with code
   changes** to a branch the destination can access using allowed delivery
   tools. A local path or copied conversation summary alone is insufficient.
3. In Copilot on that branch:

   > Resume `docs/agent-runs/mm78-review/` using `agents/panel-protocol.md`.
   > Read its state, brief, decision and handoff. Inspect branch/status/diff;
   > verify old writers stopped, compare input hashes and retain unchanged
   > completed reviews. Mark changed findings stale and re-review only affected
   > roles/dependencies. Acquire the single edit lease before writing. Native
   > profiles are not installed here: use canonical sequential reviews unless
   > this checkout has independently verified restricted native profiles.

4. Record new session identity/phase and actual test results. Do not assume
   hidden tools, credentials, private data or Claude's live context survived.

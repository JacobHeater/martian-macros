# Native execution surfaces

Configuration researched 2026-10-11. **Static configuration is not runtime
verification.** See the actual [smoke run](../docs/agent-runs/pr79-research-smoke/)
for observations and untested surfaces; do not infer tool access from YAML.

## Verified official configuration sources

- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents):
  project `.claude/agents/*.md`, `name`, `description`, explicit `tools`
  (comma-separated or YAML list). Without tools, all are inherited. Native
  `Read`, `Grep`, `Glob`, `WebSearch`, `WebFetch` are not Copilot aliases.
- [VS Code custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents)
  and [subagents](https://code.visualstudio.com/docs/agents/run/subagents):
  `.github/agents/*.agent.md`, `tools` and `agents`. Include `agent` for native
  delegation; `agents: []` prevents specialist delegation on the Local harness.
- [VS Code tools reference](https://code.visualstudio.com/docs/agents/reference/tools-reference):
  `read`/`search` are repository tool sets; `web/fetch` retrieves a known URL.
  `githubRepo`/`githubTextSearch` can discover public official repository material
  when enabled. This reference does not document general public-web search.
- [GitHub configuration reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration):
  `read`, `search`, `web`, `edit`, `agent` aliases; unknown entries are ignored.
  `web` currently has no cloud mapping. `github/<tool>` selects configured
  GitHub MCP tools. Cloud's default token is repository-scoped.
- [Copilot CLI invocation](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/invoke-custom-agents):
  repository `.github/agents`, `/agent` picker, `--agent=panel-chair`, and
  native custom-agent inference/delegation. User-level profiles override repo
  profiles of the same filename.
- [Copilot SDK custom agents](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/custom-agents):
  programmatic `customAgents` have prompts and scoped tools. An SDK host controls
  discovery, registration and effective tools; its parent tools are not proof
  of specialist capabilities. Do not copy VS Code identifiers into SDK configs.

Sources were retrieved and inspected, not just search snippets. Publication/
update dates were not supplied by these rendered pages; access date is above.

## Adapters and capability matrix

All 15 Claude and 15 Copilot adapters explicitly read their role, protocol and
review contract and stop with `PANEL_CONFIG_MISSING` if unreadable. Markdown links
alone do not load instructions. Substantive domain instructions stay canonical.
The prior `.github/agents/` omission was the cloud session's execution restriction,
not a repository policy. Local adapters are now installed; no policy was bypassed.

| Surface | Repository reads | Source discovery | Known-URL retrieval | Delegation |
| --- | --- | --- | --- | --- |
| Claude Code | Read/Grep/Glob | WebSearch, subject to policy/network | WebFetch, subject to policy/network | Main chair Agent(type allowlist); nested availability depends on version/depth and is not used by this workflow |
| VS Code Local | read/search | Enabled GitHub repository tools; general web-search provider not assumed | web/fetch | agent/runSubagent and bounded `agents` list |
| VS Code Copilot / SDK host | Host-selected tools | Inspect actual registered tools; use chair research path if absent | Host-selected fetch tools | Host-specific custom-agent registration; no inferred hot discovery |
| Copilot CLI | read/search aliases | Inspect effective GitHub MCP discovery; general public search not assumed | web alias where implemented | Native custom-agent tool; no VS Code worker-list enforcement assumed |
| GitHub cloud | read/search; repo-scoped GitHub MCP | Configured `github/search_repositories` and `github/search_code`, scope permitting | No native web alias mapping; approved configured retrieval provider or chair needed | agent alias; VS Code `agents` list not an enforcement guarantee |

Copilot profiles include `web`, VS Code GitHub discovery tools and narrowly
named GitHub MCP discovery tools. Unsupported entries are ignored, **not**
evidence that browsing works. The aliases here do not install any MCP service.
No new provider, paid service, secret or public data sharing was configured.
For health research or sources outside the reachable discovery index, use
actual native search or a bounded chair request to an approved research service.
If none exists, record `PANEL_RESEARCH_BLOCKED`. Fetching a URL supplied by the
chair is retrieval, not discovery. Specialists must evaluate returned evidence.

Reviewers have no edit/execute/delegation permissions in their allowlists.
Chairs have read/research, artifact-edit and native delegation tools, not shell
tools; their prompt limits edits to the run directory unless explicitly named
implementation owner. Native edit tools are not path sandboxes: enforce the
write lease and inspect permissions. Never grant `*` tools to reviewers.
Before invoking, inspect overrides, effective tools, hooks and organization
policy; if write/execute tools leak into a specialist, do not invoke it.

## Invocation and continuation

In Copilot Local, select **panel-chair** or ask the parent to use it. In CLI:

```text
copilot --agent=panel-chair --prompt "Read agents/README.md and scope this task.
Assign only relevant reviewers, record omitted core roles, and use the research gate."
```

In Claude, start the chair as the main session (`claude --agent panel-chair`),
or have the parent delegate to read-only specialists and use chair for synthesis.
Current Claude docs permit depth-limited nesting, but `Agent(type)` restrictions
are enforced only for a main-thread agent. This workflow prohibits nested chair
delegation: when chair is a subagent it returns assignments to the parent.
A restricted chair cannot run `mm`
or git: the designated edit owner executes and supplies actual results.

Native delegation is optional: independently scoped initial reports, targeted
challenge, synthesis, one edit owner and verification also work sequentially.
Record self-review limitations. VS Code **handoff buttons are manual UI
transitions**, not automatic parallel delegation; GitHub cloud ignores handoffs.

For a bounded existing-feature audit, invoke `panel-nutrition` on food reference/
consumed quantity scaling and `panel-qa` on entry/edit/save/read traceability and
test validity, using `feature` mode and the same frozen brief. Both load the
shared existing-implementation audit protocol; neither fixes code. Native
delegation or separate sequential invocations return the same coverage and
classified-finding contract. Parent/owner executes requested checks, persists
results and routes confirmed defects before any separately authorized fix.

Before switching tools, checkpoint the actual run: stop/acknowledge every agent
and writer, persist source evidence/hashes/decisions/results, release ownership.
Commit named sanitized artifacts **and relevant code** to an accessible branch
for remote continuation. In the destination:

> Read AGENTS.md, agents/panel-protocol.md and
> docs/agent-runs/pr79-research-smoke/{brief.md,state.json,decision.md,handoff.md}.
> Inspect current branch/status/diff; validate with mm panel and verify previous
> agents stopped. Compare relevant input hashes and research freshness. Reuse
> unchanged completed findings; mark changed findings stale. Acquire the single
> write lease before editing. Use sequential fallback if native tools are absent.

No live chat, credentials, hidden tool grants or private profiles transfer.

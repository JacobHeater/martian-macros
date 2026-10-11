# Portable run state (version 1)

Create `docs/agent-runs/<task-id>/` only for actual panel work. Use a stable
sanitized kebab-case task ID. Templates are inert examples, not completed work.

```text
docs/agent-runs/<task-id>/
  brief.md
  state.json
  findings/<role>.md
  decision.md
  handoff.md
```

The chair copies `templates/findings/role.md` once per assigned role, not as
`role.md`. Store initial review and labeled challenge updates together.
No private health/profile data, secrets or raw session transcripts.

[`state.schema.json`](state.schema.json) is the minimal JSON Schema and source
of truth for fields/enums. `mm panel` checks the templates with the same schema;
`mm panel <run-dir>` checks a saved run as well. The dependency-free checker
implements the schema's used subset (type, required, properties,
additionalProperties, enum, items, pattern, minLength); it is not a
general JSON Schema implementation or a native configuration parser.

| Field | Meaning |
| --- | --- |
| `schema_version`, `task_id` | Portable format version and stable directory identity |
| `baseline.branch`, `baseline.commit` | Branch and full commit SHA before the review |
| `phase` | scope, reviews, challenge, synthesis, edits, verification, checkpoint, complete, blocked |
| `owner` | null or actual writer/session identity plus explicit owned file paths |
| `assignments` | role, reviewer identity, status, inspected commit, path→SHA-256 inputs and report path |
| `decisions` | stable decision ID, accepted/rejected/pending status, summary and actual authority |
| `pending_work` | actionable remaining work, including unresolved product decisions |
| `tests` | command, executed commit, dirty-tree flag, exit code (null if not run), result, summary |
| `checkpoint` | UTC time (null before checkpoint) and confirmed writers-stopped assertion |

Use absolute repository file paths in execution prompts where required by the
surface, but portable artifact paths are repository-relative, never `..`,
drive paths or external files. File paths identify inputs; hashes detect local
changes too. Include canonical role/protocol/contract among each review's inputs.
Hash using available platform tools (for example `sha256sum` or
`Get-FileHash -Algorithm SHA256`); record lowercase hex, never fabricated hashes.

Assignment statuses: pending, complete, stale, omitted. Pending reviews may use
null inspected commit and empty input hashes. Complete reviews require real
commit, nonempty hashes and an existing report; omissions need a reason in the
brief/report. Stale findings remain available but cannot authorize edits.
Tests: not-run requires null exit code; passed requires 0; failed requires
nonzero. Always record dirty-tree status because a commit alone may not identify
the tested code. Test summaries must report actual output, not expectations.

The saved `owner` is a cooperative single-writer lease, **not a cross-machine
lock**. `edits` requires an owner; checkpoint requires no owner and confirmation
writers stopped. For complete runs, no pending/stale review, unresolved decision
or pending work may remain. `mm panel` checks these invariants, role identity,
paths and report existence; it cannot attest hashes, test truth or process state.
Follow protocol stop/resume inspection rather than trusting JSON alone.

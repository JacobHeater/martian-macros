# Martian Macros agent guide

This file is the canonical contributor guide for AI agents and other automated
contributors. Read it before making changes, along with the relevant code,
requirements, and [docs/architecture.md](docs/architecture.md).

## Working agreements

- Inspect the repository state before editing. Preserve unrelated and
  pre-existing changes; never discard or overwrite work you did not make.
- Keep changes focused on the request. Follow existing patterns and avoid
  unrelated refactors, generated-file edits, new dependencies, or speculative
  behavior.
- Requirements come first for behavior changes. Before changing app behavior,
  create or update a ticket in the appropriate `requirements/<component>/`
  folder. Follow [requirements/README.md](requirements/README.md): use
  `mm req next` to allocate an ID, match the filename and frontmatter, and use
  Gherkin acceptance criteria. Run `mm req` to validate the requirements.
  A documentation-only change or internal refactor that does not change
  behavior does not need a ticket.
- If the request is ambiguous in a way that materially affects behavior,
  product scope, privacy, or data handling, ask before choosing an approach.
  Otherwise use the simplest implementation consistent with the requirements
  and architecture.
- Treat health and profile data as sensitive. Preserve the offline-first
  design; do not add data transmission, analytics, or external services unless
  explicitly required and documented.
- Report uncertainty and limitations plainly. Do not claim a check or behavior
  was verified unless you actually verified it.

## Project map and conventions

- `apps/mobile/` is the Flutter UI.
- `packages/domain/` contains pure-Dart domain types and rules.
- `packages/engine/` contains pure-Dart calculations and coaching logic.
- `packages/data/` contains Drift/SQLite persistence and `MmStore`.
- `tool/` contains the dependency-light `mm` task runner.
- `requirements/` is the source of truth for planned and shipped product
  behavior; `docs/architecture.md` records cross-cutting design.
- `roadmap/` orders the work. Read [roadmap/README.md](roadmap/README.md) and
  `roadmap/roadmap.json` to choose what to build next and to see what is
  blocked. It adds no requirements of its own.
- Keep dependencies flowing with the existing layers. In particular, keep
  domain and engine logic independent of Flutter and persistence details.
- After changing a database schema or other generated source, use `mm gen` and
  include the resulting generated changes when appropriate; do not hand-edit
  generated output.

## Validation

Run commands from the repository root using the `mm` wrapper (`.\mm` in
PowerShell, `mm` in cmd.exe, or `./mm` on macOS/Linux):

- `mm req` after creating or updating requirements.
- `mm test <relevant-path>` for focused tests, such as
  `mm test packages/engine`.
- `mm analyze` for static analysis.
- `mm format --check` to verify formatting.
- `mm check` before considering a change complete; it runs the CI checks
  across the workspace.

Choose the smallest relevant checks while iterating, then run the broader
check when practical. If a check cannot run, state why and what remains
unverified.

## Completion

Before finishing, review the diff for unintended changes and ensure the
requirements, implementation, and tests agree. Summarize the changes and list
the checks actually run, including any failures or omissions. Do not commit or
push unless explicitly asked.

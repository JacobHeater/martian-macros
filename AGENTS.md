# Martian Macros agent guide

This file is the canonical contributor guide for AI agents and other automated
contributors. Read it before making changes, along with the relevant code,
requirements, and [docs/architecture.md](docs/architecture.md). Then read
[requirements/HANDOFF.md](requirements/HANDOFF.md): it says what the last
agent left in flight and what the product owner has ruled in conversation.

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
- Every bug gets a ticket and a regression test, at once. The moment a defect
  is found, however small and wherever it was found (your own new code, the
  emulator, CI, a review), write a `BUG.*.MM-n.md` ticket and a test that fails
  with the bug and passes with the fix, and say in the ticket which test
  guards it. Changing an existing test so that it passes around the bug is not
  a regression test. A bug that cannot be fixed yet still gets its ticket, and
  its test is skipped with the ticket's ID until the fix lands.
- Keep the handoff document current. Every agent, whatever its vendor,
  maintains [requirements/HANDOFF.md](requirements/HANDOFF.md) so the work can
  change hands between agents without the product owner repeating anything
  (MM-174). It is a living document that sums up the latest changes in the
  three most recent sessions, newest first: when you start a session, add it
  at the top and delete the oldest. Keep its "Where things stand" section
  true: what is in flight, what to build next, what waits on the owner, and
  any standing rule the owner gave you that is not in this file. Update it in
  the same pull request as the work, and again before you finish, since a
  session can end without warning. Nothing private goes in it.
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
- `packages/data/` contains Drift/SQLite persistence: the Drift implementations of the
  repository interfaces (`DriftRepositories`).
- `packages/fixtures/` holds in-memory implementations of every interface and the
  contract test suites, for tests, demos and early work.
- `apps/mobile/lib/src/ui/` is the design-system component library; screens use it and never
  raw Material controls.
- `tool/` contains the dependency-light `mm` task runner.
- `requirements/` is the source of truth for planned and shipped product
  behavior; `docs/architecture.md` records cross-cutting design; `docs/non-goals.md` lists what the
  app will not do, and a change that proposes one needs its reopen condition met.
- `roadmap/` orders the work. Read [roadmap/README.md](roadmap/README.md) and
  `roadmap/roadmap.json` to choose what to build next and to see what is
  blocked. It adds no requirements of its own.
- Keep dependencies flowing with the existing layers. In particular, keep
  domain and engine logic independent of Flutter and persistence details.
- After changing a database schema or other generated source, use `mm gen` and
  include the resulting generated changes when appropriate; do not hand-edit
  generated output.
- A change to any table bumps `AppDatabase.currentSchemaVersion` by one, adds
  the step to `migrationSteps`, and runs `mm schema` to export the snapshot.
  Only one schema change is in flight at a time (see `roadmap/README.md`).

## Engineering principles (binding)

These are the product owner's rules for how the code is built (MM-159). They
override convenience. Where principles conflict, Liskov substitution (L) and
interface segregation (I) win.

1. Follow SOLID, and design for **L** and **I** first.
2. Every integration point is an interface that any subtype can replace
   (food source, barcode scanner, health source, backup provider, entitlement,
   clock). Never import a vendor or platform package outside the one
   registration file.
3. Consumers depend on the **narrowest** interface they need
   (`WeightReader`, not a store). Interfaces are `abstract interface class`;
   they live with the consumer's layer (`packages/domain`).
4. If a product or vendor decision is open, build against the interface and an
   in-memory fixture (`packages/fixtures`) and carry on. Do not wait for the
   decision.
5. **One declaration per file.** Every model, interface, class, enum,
   extension and typedef has its own file, named for it in snake_case. No file
   defines more than one. Barrel files only `export`. Generated files are
   exempt. `mm arch` enforces it.
6. All database access goes through a repository interface with a Drift
   implementation and an in-memory fixture. Screens and providers never use
   Drift or a concrete store.
7. Every interface has a contract test suite run against **every**
   implementation, fixtures included. That is how substitutability is proved.
8. A reusable part of a view is a design-system component, written once. A
   screen never uses a raw Material control (`FilledButton`, `TextField`,
   `DropdownButton`, `Card`, …); it uses the component. Components take
   meaning (`MmButtonKind.primary`), never a color, radius or padding.
9. Prefer composition to inheritance, and stateless or `ConsumerWidget`
   widgets, so the one-declaration rule does not force public `State` classes.

`mm arch` (part of `mm check`) enforces rules 2 (no vendor outside the registration
file), 5, 6 and 8. Its baseline, `tool/arch_baseline.txt`, is empty; do not add to it.

## Validation

Run commands from the repository root using the `mm` wrapper (`.\mm` in
PowerShell, `mm` in cmd.exe, or `./mm` on macOS/Linux):

- `mm req` after creating or updating requirements.
- `mm test <relevant-path>` for focused tests, such as
  `mm test packages/engine`.
- `mm analyze` for static analysis.
- `mm format --check` to verify formatting.
- `mm goldens` runs the screenshot tests (Linux only; CI runs them in `mm check`).
  When a change alters how a screen looks, run the **Update goldens** workflow
  (or push a branch named `update-goldens/<name>`), commit the images it
  produces, and let the pull request show them.
- `mm check` before considering a change complete; it runs the CI checks
  across the workspace.

Choose the smallest relevant checks while iterating, then run the broader
check when practical. If a check cannot run, state why and what remains
unverified.

## Completion

Before finishing, review the diff for unintended changes and ensure the
requirements, implementation, and tests agree. Update
[requirements/HANDOFF.md](requirements/HANDOFF.md). Summarize the changes and list
the checks actually run, including any failures or omissions. Do not commit or
push unless explicitly asked.

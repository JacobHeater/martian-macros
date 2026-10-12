# Martian Macros agent guide

This file is the canonical contributor guide for AI agents and other automated
contributors. Read it before making changes, along with the relevant code,
requirements, and [docs/architecture.md](docs/architecture.md). Then read
[requirements/HANDOFF.md](requirements/HANDOFF.md): it says what the last
agent left in flight and what the product owner has ruled in conversation.

For cross-domain development reviews, use the tool-neutral
[repository expert panel](agents/README.md), its
[protocol](agents/panel-protocol.md) and [review contract](agents/review-contract.md).
Reviewers are read-only; one designated owner edits canonical files. Native
delegation and sequential fallback do not supersede the working agreements here.

> **The app is a React HTML5 app in a thin native Android shell (MM-228,
> decided by the product owner on 2026-10-12).** The Flutter app it replaced
> was removed with MM-232's final step; the old Dart sources remain in git
> history, and the requirements describe the product as built in
> `apps/mobile/`. The web is never a product: the app runs from files inside
> the shell, offline.

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
- Design decisions are reviewed in Storybook (MM-237). The stories render
  the real tokens, icons and components the app ships, in every palette
  (`mm storybook`, or `mm storybook build` for a static page). Every
  screen, sheet and step has a story too, in `src/gallery/screens/`: the
  whole app over in-memory stores, opened at that screen. A new one with no
  story fails the tests. When you add
  or change a component, change or add its story in the same pull request;
  a ticket that needs a design decision links the story under `## UI/UX`.
  The old HTML register (`requirements/ui-ux-assets/`, MM-210/MM-211) is
  retired and read-only: the historical record of the Flutter-era screens.
- If the request is ambiguous in a way that materially affects behavior,
  product scope, privacy, or data handling, ask before choosing an approach.
  Otherwise use the simplest implementation consistent with the requirements
  and architecture.
- Treat health and profile data as sensitive. Preserve the offline-first
  design; do not add data transmission, analytics, or external services unless
  explicitly required and documented.
- Report uncertainty and limitations plainly. Do not claim a check or behavior
  was verified unless you actually verified it.

## Delivery workflow (standing rules from the product owner)

- Work through the roadmap without waiting to be asked. Commit, push, open
  pull requests with `gh`, and merge them yourself (`gh pr merge --merge`) once
  CI is green. The owner does not want to be involved in that.
- Check open pull requests at the start and at the end of each session or
  turn: merge the green ones, and fix a failing one in a follow-up. Never sit
  waiting on CI in the middle of a session.
- Between those two checks, `mm ci` can watch a pull request's checks in the
  background and keep what it sees (`agents/ci-monitoring.md`). It adds to the
  rules above and replaces none: the start and end checks stay mandatory,
  nobody waits on CI, and merging stays your explicit action. Before merging,
  read GitHub directly (`mm ci check <pr>`); a stored result, or one for an
  older commit, is not enough.
- Create the feature branch from a fresh `main` before editing anything. Stage
  files by name, never `git add -A`. No stash juggling. Never switch branches
  while a build is running. If work depends on an unmerged pull request, stack
  on it deliberately and say "builds on #N" in the description.
- `mm check` has passed only when its exit code is 0 and its last line is
  "All checks passed." A tail reading "All tests passed!" can belong to one
  suite while another failed.
- Screen and design verification happens in a browser (owner's standing
  rule, 2026-10-12). A change to how a screen looks is not done until you
  have looked at it in a browser — the dev server, the built page or its
  story — and its story is updated with it (MM-237). Storybook is where
  the owner opines on design without running the app; that is a reason the
  app moved to web technologies. How the app looks matters as much as what
  it does.
- Device and emulator screenshots are only for verifying native behavior:
  plugins, permissions, persistence, notifications, the back button and the
  like. They are never the design check.
- Check a new native plugin with a release build, not only a debug one.
- Bugs found in passing still follow the rule above; the owner will walk
  through bugs and regressions at acceptance testing at the end, and until then
  the focus is roadmap items and features.

## Project map and conventions

- `apps/mobile/src/` is the app. Its first-level folders are layers, kept apart
  exactly as the Dart packages were, and `apps/mobile/test/layers.test.ts`
  enforces who may import whom:
  - `lang/` small language helpers (no imports);
  - `domain/` entities, units, repositories' interfaces, screening;
  - `engine/` weight trend, adaptive TDEE, partition, safety bounds, targets, coach;
  - `healthIngest/` what is read from a health platform;
  - `sql/` the `SqlDatabase` interface, with the WebAssembly adapter in
    `sql/wasm/` and the phone's in `sql/native/`;
  - `foodCatalog/` food packs, search and the pack download, with the native
    adapters in `foodCatalog/download/native/`;
  - `foodPipeline/` the pack build (its file steps under `node/`);
  - `fixtures/` in-memory implementations of every interface;
  - `data/` SQL repositories over `SqlDatabase`;
  - `format/` labels and text;
  - `platform/` the shell's plugins behind interfaces (camera, reminders,
    Health Connect, system bars, back button);
  - `state/` the app's cells and controllers; then the screen folders.
- `apps/mobile/src/ui/` is the design-system component library; screens use it
  and never raw HTML controls.
- `apps/mobile/android/` is the native shell: a Capacitor host and the app's own
  Kotlin plugins (`MmDb`, `MmPacks`, `MmReminders`, `MmScanner`, `MmHealth`).
- `apps/mobile/test/contracts/` holds the contract suites; every implementation
  of an interface runs its suite, fixtures included.
- `tool/` contains the dependency-free `mm` task runner: TypeScript run by
  Node itself, with its own tests in `tool/test/`.
- `requirements/` is the source of truth for planned and shipped product
  behavior; `docs/architecture.md` records cross-cutting design; `docs/non-goals.md` lists what the
  app will not do, and a change that proposes one needs its reopen condition met.
- `roadmap/` orders the work. Read [roadmap/README.md](roadmap/README.md) and
  `roadmap/roadmap.json` to choose what to build next and to see what is
  blocked. It adds no requirements of its own.
- Keep dependencies flowing with the existing layers. In particular, keep
  domain and engine logic independent of React and persistence details.
- A change to any table bumps `currentSchemaVersion` in
  `apps/mobile/src/data/schema.ts` by one and adds the migration step; the
  migration tests hold every released version's upgrade path.

## Engineering principles (binding)

These are the product owner's rules for how the code is built (MM-159). They
override convenience. Where principles conflict, Liskov substitution (L) and
interface segregation (I) win.

1. Follow SOLID, and design for **L** and **I** first.
2. Every integration point is an interface that any subtype can replace
   (food source, barcode scanner, health source, backup provider, entitlement,
   clock). Never import a vendor or platform package outside its adapter
   folder; `apps/mobile/test/layers.test.ts` names the folders each may live in,
   and `apps/mobile/src/app/openAppServices.ts` is the one place implementations
   are chosen.
3. Consumers depend on the **narrowest** interface they need
   (`WeightReader`, not a store). Interfaces live with the consumer's layer.
4. If a product or vendor decision is open, build against the interface and an
   in-memory fixture (`src/fixtures/`) and carry on. Do not wait for the
   decision.
5. **One declaration per file.** Every model, interface, class, union and
   function module has its own file, named for it. Barrel files only
   `export`.
6. All database access goes through a repository interface with a SQL
   implementation and an in-memory fixture. Screens and state never use SQL
   or a concrete store.
7. Every interface has a contract test suite run against **every**
   implementation, fixtures included. That is how substitutability is proved.
8. A reusable part of a view is a design-system component, written once. A
   screen never uses a raw HTML control (`<button>`, `<input>`, `<select>`,
   …); it uses the component. Components take meaning
   (`kind="primary"`), never a color, radius or padding.
9. Prefer composition to inheritance and plain function components, so state
   lives in `state/` cells and controllers, not in component classes.

## Validation

Run commands from the repository root using the `mm` wrapper (`.\mm` in
PowerShell, `mm` in cmd.exe, or `./mm` on macOS/Linux):

- `mm req` after creating or updating requirements.
- `mm panel` validates panel roles, Claude/Copilot adapters and portable templates;
  `mm panel docs/agent-runs/<task-id>` also checks saved run state.
- `npx vitest run <relevant-path>` inside `apps/mobile` for focused tests;
  `mm test` for the tool's tests and the whole web suite.
- `mm check` before considering a change complete; it runs the CI checks.

Choose the smallest relevant checks while iterating, then run the broader
check when practical. If a check cannot run, state why and what remains
unverified.

## Completion

Before finishing, review the diff for unintended changes and ensure the
requirements, implementation, and tests agree. Update
[requirements/HANDOFF.md](requirements/HANDOFF.md). Summarize the changes and list
the checks actually run, including any failures or omissions. Commit and push
per the delivery workflow above.

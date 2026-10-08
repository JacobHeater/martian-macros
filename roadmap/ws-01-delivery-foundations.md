# WS-01: Delivery foundations

**Order** 1 · **Group** A (start now) · **State** partly built · **Risk** medium

## Summary
Make it safe to change the database and safe to merge: a migration framework
with tests, tests for the screens that shipped without them, and continuous
integration.

## Why this is a workstream, and why it is first
The task runner, the monorepo, the requirements tracker, the version 1 schema
and data erasure are built. What is missing is small and blocks almost
everything:

- **The schema cannot change.** `app_database.dart` declares `schemaVersion => 1`
  and has no migration strategy. Nine later workstreams add tables or columns.
  The first one to do so without a framework either breaks every existing
  install or invents its own approach.
- **The screens are thinly tested.** Four widget tests cover the whole app.
  WS-03 is about to restructure every screen; without tests that pin current
  behavior, regressions will go unseen.
- **Nothing runs the checks automatically.** `mm check` exists and passes; it
  runs only when someone remembers.

## Capability it unlocks
Any workstream may add persistent data. Any change is checked before it
merges.

## Included
- A migration framework: versioned steps, a stored schema snapshot per
  version, and a test that upgrades a populated database from each earlier
  version.
- A test timeout in `mm test`, so a widget test that awaits the real database
  on the fake clock fails instead of hanging.
- Tests for every behavior listed in the coverage-gap ticket.
- CI that runs `mm check`.
- Separate development and production app ids.

## Excluded or deferred
- Encrypted backup and its providers: WS-12. They share a requirements folder
  with migrations and nothing else.
- Screenshot (golden) tests: WS-03, with the component gallery.
- Release signing and store builds: WS-13.

## Prerequisites
None.

## Enables
Every workstream that persists anything: WS-05, WS-06, WS-07, WS-08, WS-09,
WS-10, WS-11, WS-12. And WS-13, which releases through CI.

## Packages and surfaces
- `packages/data/lib/src/app_database.dart`, `mm_store.dart`, `packages/data/test`
- `tool/src/commands.dart` (test timeout)
- `apps/mobile/test`
- `.github/` (workflow)
- Android and iOS project configuration (app ids)

## Risks
- **Getting the migration pattern wrong is expensive to undo.** Once two
  migrations exist in the wild, the pattern is fixed. Use Drift's own
  step-by-step migrations and schema export; do not write a bespoke runner.
- **Widget tests written now may be invalidated by WS-03.** See the sequence.
- **CI for Flutter on hosted runners is slow.** Cache the pub and FVM
  directories from the first version of the workflow.

## Sequence
1. **Migrations (MM-61).** M1. Do this before anything else in the
   repository that touches data.
2. **Test timeout, then coverage gaps (MM-93).** M2. Add the timeout first: it
   is ten lines and protects every later test. For the gaps, write engine-
   and store-level tests immediately. Write widget tests against behavior and
   widget keys, not layout, or wait for WS-03 step 3 for the screens it
   restructures (navigation, Today/Food, the day picker).
3. **CI (MM-7).** M2.
4. **Dev and prod app ids (MM-8).** M3. Needed before release so both builds
   install side by side; not needed before.

## Done enough to unblock others
MM-61 is done: a migration from version 1 to 2 exists, is tested against a
populated version 1 database, and the schema-lane rules in the roadmap README
are in force.

## Do not start before this
Any ticket that adds a table or a column, in any workstream.

## Parallel with
WS-02, WS-03 and WS-04 from the start. WS-02 does not touch the schema; WS-04
builds a separate read-only pack database with its own format.

## Requirement sources
- Built: MM-2, MM-3, MM-4, MM-5, MM-6 (task runner, emulator, pinned Flutter,
  workspace, requirements tracker); MM-60 (schema v1); MM-62 (erase all data).
- Remaining: MM-61, MM-93, MM-7, MM-8. Epic: MM-1.

## Notes for whoever builds it
- The first real migration will come from whichever of WS-05 step 2, WS-06
  step 3 or WS-07 step 1 arrives first. MM-61 should include a trivial
  version 2 (or a test-only one) so the framework is proven before a feature
  depends on it.
- The existing `sex` column carries `CHECK (sex IN ('male','female'))` and
  must keep it through every migration. SQLite rebuilds a table to alter a
  constraint; the migration test should assert the constraint still rejects
  other values afterwards.
- `mm check` already runs format, requirements validation, analysis and all
  tests. CI should call it and nothing else, so local and CI results cannot
  differ.
- The widget-test hang is recorded in the dev-environment notes and in the
  coverage-gap ticket: database calls made directly by a test body go through
  `tester.runAsync`.

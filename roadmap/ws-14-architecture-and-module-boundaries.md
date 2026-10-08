# WS-14: Architecture and module boundaries

**Order** 1 · **Group** A · **State** built (epic open until MM-163) · **Risk** medium

## Summary
Make the code follow the product owner's engineering rules (MM-159) before more
is built on it: SOLID with Liskov substitution and interface segregation first,
one declaration per file, repositories for every database interaction, an
interface and a fixture for every integration point, and one implementation per
design-system control.

## Why this is a workstream, and why it is first
Measured on 2026-10-08, none of the rules holds today:

- 24 of 42 library files define more than one top-level type (88 types).
- There is not one interface or abstract class. The app depends on a single
  concrete `MmStore` of about 21 methods.
- Screens write their own controls inline.

Each of these costs more with every file added, and the next workstreams add
about ninety tickets of new files. It also removes a class of waiting: with an
interface and a fixture in place, work that names a vendor, a store rule or an
undecided product choice proceeds against the fixture, and the decision becomes
one registration.

The tickets live in `requirements/architecture/` (MM-159 to MM-162) and
`requirements/design-system/` (MM-163, built in WS-03).

## Capability it unlocks
Feature workstreams build to enforced rules, against interfaces, with fixtures:
no waiting on vendors, and swapping a provider is one line.

## Included
- `mm arch`: a check for one declaration per file, name and file agreement, and
  no concrete-store or vendor import in screens; a shrinking baseline.
- Splitting the existing files in `domain`, `engine`, `data` and `tool`.
- Repository role interfaces (`packages/domain`), Drift implementations
  (`packages/data`), in-memory fixtures and contract suites (`packages/fixtures`,
  new), removal of `MmStore`.
- The integration seams that exist as needs today: `Clock`, food lookup, backup
  storage, entitlement, plus the contract-test harness.

## Excluded or deferred
- Real vendor implementations: WS-04 (pack reader), WS-11 (health), WS-12
  (backup providers), WS-13 (purchase).
- The app's screen split and the controls rule (MM-163): WS-03 step 1b, which
  does it once together with the component migration.
- The health seam: MM-67 in WS-11, following MM-162's pattern.

## Prerequisites
None. The product owner's rules are written (MM-159).

## Enables
Everything with persistence or an integration: WS-03 (components, dashboard),
WS-04 step 3 and 6, WS-05 to WS-13.

## Packages and surfaces
`tool/`, `packages/domain`, `packages/data`, `packages/fixtures` (new),
`apps/mobile/lib/src/providers.dart` and one registration file.

## Risks
- **Blast radius.** Step 1 changes imports in nearly every file. Mitigation: one
  package per commit, `mm check` green each time, no other work in that package.
- **Over-abstraction.** Interfaces for things that will never be swapped add
  cost. Mitigation: a seam is added only when a ticket needs it (MM-162); role
  interfaces are cut from consumers' needs, not from the implementation.
- **Fixtures that lie.** An in-memory implementation that behaves differently
  from Drift hides bugs. Mitigation: one contract suite run against both.
- **State classes.** One declaration per file forces public `State` classes
  unless widgets are stateless. Prefer `ConsumerWidget`; flag if a case cannot.

## Sequence
1. **One declaration per file (MM-160).** M0. The check and baseline first, then
   `domain`, `engine`, `data`, `tool`, one commit each.
2. **Repositories (MM-161).** M0. Interfaces, Drift implementations, fixtures,
   contract tests; the app overrides to fixtures in tests; delete `MmStore`.
   Schema is untouched.
3. **Integration seams (MM-162).** M0. `Clock`, `FoodSearch`/`FoodBarcodeLookup`,
   `BackupStorage`, `EntitlementReader` and the harness.

## Done enough to unblock others
MM-160 and MM-161 are done: new files follow the rules and all persistence is
through interfaces.

## Do not start before this
Large amounts of new code in any workstream. Small, urgent fixes are fine and
must follow the rules from the start.

## Parallel with
Engine work that changes behavior (WS-02) is independent in logic but shares
files during the engine split: do the split first.

## Requirement sources
- Built: MM-160, MM-161, MM-162. Remaining: MM-159 (epic), open until the design-system control rule in WS-03 step 1 is done.

## Notes for whoever builds it
- Liskov is proved by tests, not asserted: write the contract suite before the
  second implementation.
- Do not pass a flag where a role would do. A read-only source implements the
  reader interface only.
- Fixtures are real implementations used by tests, the gallery, demo builds and
  early feature work; keep them simple and correct.
- Barrel files only `export`.

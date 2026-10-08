---
id: MM-159
status: in-progress
component: architecture
related: [MM-160, MM-161, MM-162, MM-163, MM-104, MM-5, MM-60]
---

# Epic: SOLID, with Liskov and Interface Segregation first

## Context
The codebase was written quickly and works, and it does not follow the product owner's definition of success for how it is built. Measured on 2026-10-08:

- 24 of 42 library files define more than one top-level type (88 types in those files); `widgets.dart` holds five widgets, `database.dart` holds six tables, the database, a function type and an exception.
- There is no interface or abstract class anywhere. The app depends on one concrete class, `MmStore` (315 lines, about 21 public methods), through `storeProvider`; nothing can be swapped and nothing can be tested against a stand-in without a real in-memory database.
- Screens write their own controls (`FilledButton`, `SegmentedButton`, `Card`, `TextField`) inline, so two screens can drift.

## Decisions (made with the product owner)
These ten rules are the product owner's, verbatim in intent. They bind every ticket.

1. **Always adhere to SOLID.**
2. **Within SOLID, always design for L (Liskov substitution) and I (Interface segregation).**
3. **L allows quick swaps of providers.** Every integration point is designed so a subtype can be substituted for another: food source, barcode scanner, health source, backup provider, entitlement, clock.
4. **I allows inversion of control and proper subtyping.** Consumers depend on small interfaces they define the need for, never on a concrete class.
5. **L and I mean nobody waits on a product decision.** A generic interface plus fixtures lets work proceed before a provider, vendor or policy is chosen.
6. **Of SOLID, L and I matter most.** When principles pull in different directions, L and I win.
7. **Modules are isolated. No monolithic module definitions.** Every model, interface, class, enum, extension and type alias lives in its own file. No file defines more than one module.
8. **Database interactions always go through a repository, designed with L and I.**
9. **The design system prevents drift.** No two views may differ in how a button, dropdown, field or other sub-component looks or behaves.
10. **Every part of a view that could be reused becomes a design-system component.**

Choices I made without asking (say if any is wrong):
- **"Module" means one top-level declaration**: a class (including `abstract interface class`, `mixin`, `sealed class`), `enum`, `extension`, `typedef`, or a public top-level function/constant group with one job. Private helper classes and private `State` classes are not exempt.
- **Generated files are exempt** (`*.g.dart`); the files that declare what is generated from are not.
- **Tests**: one `main` per test file; shared fakes and builders each in their own file under `test/support/`.
- **Where interfaces live**: in the lowest layer that needs them, owned by the consumer (dependency inversion). Repository interfaces live in `packages/domain`; Drift implementations in `packages/data`; in-memory fixtures in a new pure-Dart package `packages/fixtures`.
- **Interfaces are Dart `abstract interface class`** so an implementation cannot accidentally inherit behavior, which keeps Liskov checkable.
- **Every interface gets a contract test suite** that is run against every implementation, including the fixtures. That suite is how "substitutable" is proved, not asserted.
- **Prefer composition to inheritance** and prefer stateless or `ConsumerWidget`s so the one-class-per-file rule does not force public `State` classes.

## Narrative
Four tickets turn the rules into structure, in this order:

- MM-160: one declaration per file, enforced by `mm check`, and the existing code split.
- MM-161: repositories with segregated interfaces, a Drift implementation, in-memory fixtures and contract tests; the app stops using `MmStore`.
- MM-162: the integration seams (food source, barcode, health, backup, entitlement, clock) as interfaces with fixtures and contract tests; real providers come in their own workstreams.
- MM-163: the design-system reuse rule, enforced.

## Acceptance Criteria (narrative)
Done when `mm check` fails a change that breaks any of the mechanical rules (7, 9, 10 and dependence on a concrete store or provider); when each integration point has an interface, a fixture and a contract suite; and when a provider can be replaced by changing one registration, with the app's tests unchanged.

## Notes
- Rules 3 to 5 are why this comes before most feature work: WS-04, WS-08, WS-11, WS-12 and WS-13 each name a vendor or store decision that is not made yet. With the seams in place those workstreams build against fixtures and the decision becomes a later registration.
- Principles that cannot be checked mechanically (Liskov in full, Open/Closed, Single responsibility) are enforced by contract tests and by review against the checklist in `AGENTS.md`.

## Progress
MM-160, MM-161 and MM-162 are done; MM-163 (design system) is in progress and needs the gallery. Measured at the end of this work: 0 of 284 Dart files define more than one type (it was 24 of 42
library files), 18 repository interfaces and 16 integration files exist with in-memory fixtures and contract suites (there were no interfaces), and the app depends on no concrete store.

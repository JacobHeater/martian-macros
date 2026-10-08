---
id: MM-161
status: done
component: architecture
related: [MM-159, MM-160, MM-60, MM-61, MM-62, MM-63]
---

# Task: Repositories with segregated interfaces, fixtures and contract tests

## Context
See MM-159, rules 3 to 5 and 8. All persistence goes through `MmStore`, one concrete class with about 21 public methods (setup, weights, food, day marks, waist, targets history). Every screen and provider that needs only to read weights is coupled to everything else the store does, and the only way to test against it is a real in-memory SQLite database.

## Decisions
Made with the product owner: database interactions always use a repository, designed with Liskov and Interface Segregation.

Choices I made without asking (say if any is wrong):
- **Role interfaces, not one big repository.** Each is an `abstract interface class` in `packages/domain`, named for what a consumer needs, for example `WeightReader` (watch and fetch weights), `WeightWriter` (save, delete), `FoodDayReader`, `FoodEntryWriter`, `SetupRepository`, `TargetsHistoryReader`, `TargetsHistoryWriter`, `DayMarkRepository`, `WaistRepository`. A combined `WeightRepository` is just `implements WeightReader, WeightWriter`. A consumer asks for the narrowest role.
- **No interface mentions Drift, SQL or a table.** Parameters and results are domain types.
- **Implementations**: `Drift*Repository` classes in `packages/data`, one per file, each taking an `AppDatabase`. `MmStore` is removed, not wrapped.
- **Fixtures**: a new pure-Dart package `packages/fixtures` with `InMemory*Repository` for every interface, one per file, plus `Fixture` builders (a typical user, two weeks of data). They are real, working implementations, not mocks.
- **Contract tests**: for each interface, one abstract test suite in `packages/fixtures/lib/contracts/`, run by `packages/data` against the Drift implementation and by `packages/fixtures` against the in-memory one. Behavior that differs between them is a bug in one of them.
- **Providers** in the app expose the interfaces (`weightReaderProvider`), not the implementation. The single place that picks an implementation is one `repositories` registration file, so a test or a demo build swaps it by override.
- **Transactions** that span roles are an explicit `UnitOfWork` interface, not a method on a repository.
- **Streams**: `watch*` methods return `Stream`s with the same emission rules in both implementations (current value first; then each change).

## Description
Define the interfaces, implement them over Drift, build the fixtures and contract suites, move the app off `MmStore`, and delete `MmStore`.

## Acceptance Criteria
```gherkin
Scenario: A consumer needs one role
  Given a screen that only shows the trend
  Then it depends on WeightReader and nothing else from persistence

Scenario: Substitutability
  Given the contract suite for WeightReader
  Then it passes against the Drift implementation and the in-memory one

Scenario: Swap without touching consumers
  Given the app's widget tests
  When the repositories are overridden with in-memory fixtures
  Then every test passes with no change to the screens or providers

Scenario: No concrete store in the app
  Then no file under apps/mobile imports mm_data or names a Drift class

Scenario: Schema is unchanged
  Then the schema snapshot test passes and no migration was added

Scenario: Streams behave the same
  Given a contract test that saves a weight while watching
  Then both implementations emit the current list first and the updated list next
```

## Notes
- This is a refactor; schema and data are untouched. It does not need the schema lane.
- `mm check` should gain a rule (in `mm arch`) that `apps/` does not import `package:drift` or `mm_data` outside the one registration file.
- The fixtures package also serves MM-162 and the design-system gallery (MM-105): screens render from fixtures with no database.

## Notes (built and verified)
- Role interfaces in `packages/domain/lib/src/repositories/` (`WeightReader`, `WeightWriter`, `FoodDayReader`, `RecentFoodReader`, `FoodEntryWriter`, `SetupReader`, `SetupWriter`,
  `WaistReader`/`Writer`, `DayMarkReader`/`Writer`, `IntakeReader`, `DataEraser`) with composites (`WeightRepository`, ...). The targets-history roles live in `packages/engine` because
  `TargetsRecord` is an engine type and the domain cannot depend on the engine.
- Drift implementations in `packages/data` (`DriftWeightRepository`, ... and `DriftRepositories`). `MmStore` is deleted. Intake is formed by one shared function, `intakeDaysFrom`, used by
  both implementations.
- `packages/fixtures` holds `InMemoryRepositories` and the contract suites. **The same eight suites run against the Drift and the in-memory implementations**
  (`packages/data/test/drift_contracts_test.dart`, `packages/fixtures/test/in_memory_contracts_test.dart`). A first version of the "emits the current value first" contract raced with
  Drift's lazy first query; the helper now waits for the first emission before writing.
- The app's tests run the real screens on in-memory repositories with no database and no change to any screen (80 tests). Screens depend on narrow role providers
  (`repository_role_providers.dart`); `repository_providers.dart` is the one file that knows Drift, enforced by `mm arch`.
- **Deviations**: no `UnitOfWork` interface was added because no operation spans repositories today; add one when the first appears. Onboarding saves the first weigh-in and the setup as two
  writes, as before (not atomic).
- **Not verified**: the Drift implementations across a real upgrade on a device database (the migration tests use `AppDatabase` and the repositories on files).

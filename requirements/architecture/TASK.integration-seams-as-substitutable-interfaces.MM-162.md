---
id: MM-162
status: proposed
component: architecture
related: [MM-159, MM-161, MM-51, MM-55, MM-56, MM-64, MM-67, MM-85, MM-88]
---

# Task: Integration points as substitutable interfaces

## Context
See MM-159, rules 3 to 5. Several workstreams depend on a vendor, a store or a service that is not chosen yet (food data source and its fallbacks, barcode scanner, Apple Health and Health Connect, backup providers, the purchase and trial mechanism, the clock). Left to each workstream, each will pick a concrete library and leak it through the app, and the product owner will be asked to decide before work can continue.

## Decisions
Made with the product owner: integration points are designed so that a subtype can be swapped in, and fixtures let work proceed without waiting for a decision.

Choices I made without asking (say if any is wrong):
- **The seams** (each an `abstract interface class` in `packages/domain`, one per file, with a narrow role, plus an in-memory fixture in `packages/fixtures` and a contract suite):

| Seam | Roles | Real implementations (other workstreams) |
|---|---|---|
| Food lookup | `FoodSearch`, `FoodBarcodeLookup`, `FoodLabelReader` | local pack (WS-04), live Open Food Facts (opt-in), label OCR |
| Barcode scanning | `BarcodeScanner` | camera scanner package, or manual entry |
| Health data in | `HealthWeightSource`, `HealthWorkoutSource`, `HealthPermission` | HealthKit, Health Connect |
| Backup | `BackupStorage` (put, get, list, delete one blob) | Drive, Dropbox, OneDrive, WebDAV/S3, share sheet |
| Entitlement | `EntitlementReader` (is Coach unlocked, trial end), `TrialClock` | App Store, Play, local clock |
| Time | `Clock` (today, now) | system clock; the existing `todayProvider` becomes this |
| Notifications | `ReminderScheduler` | platform local notifications |

- **A seam is added only when a ticket needs it**; this ticket delivers `Clock`, `FoodSearch`, `FoodBarcodeLookup`, `BackupStorage` and `EntitlementReader` and the contract-test harness. The rest are defined by the ticket that first needs them, using the same pattern. **Health sources are defined by MM-67** (WS-11 step 1), which must follow these rules: narrow role interfaces in `packages/domain`, an in-memory fixture that replays recorded histories, a contract suite, typed failures.
- **Interfaces describe capability, not vendor.** No `GoogleDriveBackup` in a signature; `BackupStorage` has no notion of OAuth.
- **Capability that varies is a separate role**, not a flag or a method that throws `UnsupportedError`. A source that cannot write does not implement a writer.
- **Failures are typed results** (`sealed class` with success, not-found, unavailable, denied), identical across implementations, so a fixture can simulate each.
- **Fixtures can fail on demand**: each in-memory implementation takes a scripted outcome, so denied-permission and offline paths are tested without a device.
- **Registration**: one provider per seam in one registration file; swapping a provider is changing that line (or a test override).

## Description
The interfaces listed as delivered, their fixtures, the contract-test harness (an abstract suite that any implementation can be run through), and the registration. No real vendor code.

## Acceptance Criteria
```gherkin
Scenario: Work proceeds without a decision
  Given no backup provider has been chosen
  Then the backup flow can be built and tested against the in-memory BackupStorage

Scenario: Substitutability
  Given the contract suite for FoodSearch
  Then it passes against the in-memory fixture and, later, against each real implementation unchanged

Scenario: Capability is a role
  Given a read-only health source
  Then it implements the reader role and does not implement a writer role

Scenario: Failure is typed
  Given a fixture scripted to answer "denied"
  Then the consumer shows the denied state without any platform code

Scenario: No vendor in the app
  Then no screen imports a vendor package; only the registration file does

Scenario: Clock
  Given a test that overrides Clock with a fixed day
  Then the app, the engine inputs and the day rollover all see that day
```

## Notes
- The real implementations stay in WS-04, WS-08, WS-11, WS-12 and WS-13. Their tickets say "implements the seam from MM-162" in place of choosing a vendor first.
- This is the mechanism for the product owner's rule that Claude should not be blocked on decisions: where a decision (vendor, store rule) is open, the fixture is the default and the decision becomes one registration.

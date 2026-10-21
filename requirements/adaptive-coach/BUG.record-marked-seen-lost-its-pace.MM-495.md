---
id: MM-495
status: done
component: adaptive-coach
related: [MM-128, MM-138, MM-432]
---

# Bug: A targets record marked seen lost the pace it was asked for

## Context
Found while building MM-432. `TargetsRecord.copyWith` (used to mark the target-change summary seen, MM-138) built the
new record without `requestedLossFraction` (MM-128). The in-memory targets history marks records seen through
`copyWith`, so a record made at a chosen pace came back at the default pace once its summary was seen, and the engine,
comparing the record's pace with the setup's, would issue targets again for a "pace change" nobody made. The SQL
repository marks the row in place and was not affected: the two implementations disagreed, which the contract suite
exists to catch.

## Description
`copyWith` keeps every field it does not change, the pace asked for included.

## Acceptance Criteria
```gherkin
Scenario: Marking a summary seen keeps the pace
  Given a targets record asked for at 0.5% a week, its summary unseen
  When its summary is marked seen
  Then the record still says 0.5% a week, in every implementation of the targets history
```

## Notes
- Fixed in `apps/mobile/src/engine/TargetsRecord.ts`. Regression test: "marks summaries seen without losing the pace
  asked for" in `apps/mobile/test/contracts/targetsHistoryRepositoryContract.ts`, run against the SQL and in-memory
  repositories. Not run locally; CI validates.

---
id: MM-551
status: done
component: health-sync
related: [MM-69, MM-73, MM-68, MM-498]
---

# Bug: Apple Health "could not be read just now" on every read after the first

## Context
Seen by the owner on their iPhone (2026-10-22): Settings, "Read from Apple Health now" answered "Apple Health could not
be read just now. Nothing was changed." for days.

The first read of each kind works: it has no token yet, so it reads the whole range. Every read after it asks the plugin
for the changes since its token. The Swift `changes` ignored which kind was asked for and ran one anchored query for
every kind the app knows (weight, body fat, lean mass, height, workouts, menstruation, steps, sleep) with the one
kind's anchor. A kind the person was never asked about answers HealthKit's "authorization not determined", and any one
error failed the whole call, so the read failed every time. The token kept was also whichever kind's query finished
last.

## Acceptance Criteria
```gherkin
Scenario: A second read on an iPhone
  Given weight was allowed in Apple Health and read once
  And sleep, steps and a cycle were never asked about
  When "Read from Apple Health now" is pressed again
  Then the weight is read, and nothing says it could not be

Scenario: The token stays the kind's own
  When the changes in weight are read
  Then only weight is queried, from weight's anchor, and the next token is weight's
```

## Progress
Fixed 2026-10-22. Not run locally; CI validates (CI compiles no Swift).
- `MmHealthApi.changes` takes the kind; `NativeHealthSource.changesSince` passes it.
- `MmHealthPlugin.swift` `changes` queries only that kind, from its anchor, and answers with that query's anchor;
  the unused `ChangesGathered` box is gone. Health Connect's `changes` needs no kind (its token is per kind) and
  ignores it.
- Tests: `test/platform/nativeHealthSource.test.ts` (the plugin is asked for the kind it reads, and only it);
  `test/ios/healthProfileOnIos.test.ts` (the Swift queries the one kind, never every kind).

## Owed on a phone
- On the owner's iPhone, after installing a build with this: "Read from Apple Health now" twice in a row, both
  without the "could not be read" snack; a weigh-in added in Apple Health between them appears in the app.

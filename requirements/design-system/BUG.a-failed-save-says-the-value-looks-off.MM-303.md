---
id: MM-303
component: design-system
status: done
related: [MM-279, MM-301]
---

# Bug: a save that fails for any reason says the value looks off

## What the panel found

`NumberEntry` caught every failure of its save and said "That value looks
off. Check it." (UX-accessibility UX-7, `docs/agent-runs/mm301-waist-in-place/`).
A save that failed in storage told the person a right number was wrong,
and they would re-check it. A weigh-in is never refused for its value, so
on the Dashboard and in Progress that message only ever followed a storage
failure.

## The fix

The refusal is a `FormatError` (as `saveWaistReadings` raises for a reading
no tape could take); only it is said as "That value looks off. Check it."
Any other failure says "Could not save. Try again." and the typed value
stays in the field.

## Regression test

`apps/mobile/test/ui/numberEntryFailure.test.tsx`: a storage failure is not
called "looks off" and keeps the value; failed before the fix. The tests
that simulate a refusal (`components.test.tsx`, `fieldErrors.test.tsx`)
now raise a `FormatError`, which is what a refusal is.

## Acceptance criteria

```gherkin
Scenario: A refused value
  When a value is saved and refused as not a measurement
  Then "That value looks off. Check it." is said under the field

Scenario: A save that fails for another reason
  When a value is saved and storage fails
  Then "Could not save. Try again." is said under the field
  And the value typed stays in the field
```

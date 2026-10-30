---
id: MM-717
status: in-progress
component: food-logging
related: [MM-570, MM-633, MM-698, MM-715]
---

# Task: a copy to another phone keeps the time eaten

## Context
"Copy to another phone" (MM-715) sent fresh copies the way a copy to another day logs them (MM-633): no time
eaten, since when the original was eaten says nothing about when a copy on another day is (MM-570). The owner,
2026-10-30, from the phone: "noticed copy to another phone is not sending time with the logs. copy to another
phone must send the timestamp with it." A food copied to the other phone is the same eating, on the same day
and at the same meal, so its time is part of the record.

## Decisions
From the owner (2026-10-30): the time eaten travels with a copy to another phone.

Choices made without asking (say if any is wrong):
- **Only the copy to another phone changes.** A copy to another day or to another meal still has no time until
  one is given (MM-570, MM-633, MM-714).
- **The receiving phone logs the time as it came**; a food that had no time on the sender has none on the
  receiver. The copy's format already carried the time (MM-715), so nothing on the wire changes.

## Description
A food, meal or the chosen foods copied to the other phone arrive there with the time each was eaten.

## Acceptance Criteria
```gherkin
Scenario: The time travels
  Given dinner holds salmon at 7:00 PM
  When "Copy to another phone" is chosen for it and the other phone's code scanned
  Then the copy sent holds salmon for that day at dinner at 7:00 PM

Scenario: Logged with its time there
  Given this phone receives that copy
  When "Add" is confirmed
  Then salmon on this phone reads 7:00 PM

Scenario: Other copies unchanged
  When salmon is copied to another day or another meal
  Then the copy has no time eaten
```

## Notes
- `entriesCopiedTo` takes `keepTimeEaten`; `useCopyToAnotherPhone` sets it. Test: `test/food/copyToAnotherPhone.test.tsx`.

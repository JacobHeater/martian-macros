---
id: MM-611
status: proposed
component: food-logging
related: [MM-604, MM-612, MM-605, MM-27, MM-108, MM-124, MM-92]
---

# Story: Mark a day as a Refeed or a Day off

## Context
The owner wants single days judged by the coach (MM-612). A planned high day or a day off should not be picked apart as if it
were a lapse. On 2026-10-24 the owner asked that the person can mark such a day in the Food tab and "let it be on record", and
chose the names **Refeed** and **Day off**. "Cheat" is banned by MM-108 and the voice test.

## Decisions
By the product owner, 2026-10-24: two marks, Refeed and Day off.

Choices made without asking (say if any is wrong):
- **A Refeed** is a day eaten higher on purpose. **A Day off** is a day away from the plan: a holiday, a party, travel. Both work
  the same for the coach. They differ in name, in the day's record, and in reports ("2 refeeds and 1 day off this month").
- **A mark is separate from completeness** (MM-27). A Day off may be partly logged, and it is still partial if it is.
- **A mark changes no calculation.** The day's intake counts in the energy-use estimate, the weight trend and the targets exactly
  as it would unmarked. It changes only how the coach speaks:
  - no single-day finding for the day (MM-612);
  - in trends it is counted and named in the evidence;
  - it never contributes a food to a trade.
- **Any day up to today** can be marked or unmarked, from the Food day's header. No future days, since a plan is not a record.
- **No judgement of how often.** No rule counts marks to warn about them, and no streak or reward involves them (MM-92).

## Description
A per-day mark (none, refeed, day off) stored with the day. It is set and cleared from the Food day's header and shown there as a
chip. It is read by the coach engine and the monthly report. It needs a repository, a SQL implementation, an in-memory fixture, a
contract suite and a migration.

## Acceptance Criteria
```gherkin
Scenario: Marking a day
  Given the Food tab on 18 Oct
  When the person chooses "Mark day" and then "Refeed"
  Then the day shows a "Refeed" chip, and the mark survives a restart

Scenario: Unmarking
  Given a day marked "Day off"
  When the mark is cleared
  Then the chip is gone and the coach treats the day as any other

Scenario: Calculations unchanged
  Given the same logs with and without a mark
  Then energy use, the weight trend and the targets are identical

Scenario: Not judged alone
  Given today marked "Refeed" with fat at twice its target
  Then the coach's 1d analysis shows the day's totals and no fix

Scenario: Named in trends
  Given a fat trend spanning a marked day
  Then its numbers say the span includes 1 refeed

Scenario: Not today's future
  Then tomorrow cannot be marked

Scenario: Report
  Given 2 refeeds and 1 day off in a month
  Then the monthly report states them as counts, with no comment
```

## UI/UX
- The day header's mark menu and chip, in the Food stories. Both marks use the same neutral chip.

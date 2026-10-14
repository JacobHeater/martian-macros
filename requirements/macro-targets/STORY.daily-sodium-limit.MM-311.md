---
id: MM-311
status: in-progress
component: macro-targets
related: [MM-305, MM-310, MM-312, MM-108, MM-123, MM-259]
---

# Story: A daily sodium limit I can set

## Context
See MM-305. The owner asked that users can configure a sodium goal. Entries already keep sodium when the
source states it (MM-49).

## Decisions
The product owner's (2026-10-14): a daily upper limit, off by default, with 2,300 mg suggested; set in
Settings only; over the limit the number says so plainly and the coach has a line about a pattern of it
(MM-312).

Choices I made without asking (say if any is wrong):
- **A new Settings section, "Nutrition goals"**, after "Today's setup", holding the sodium limit and the
  water goal (MM-313). Each is a switch row; switched on, a number row below it holds the amount.
- **2,300 mg is suggested** when the limit is first switched on: the US Dietary Guidelines' Chronic Disease
  Risk Reduction intake for adults. Any whole number from 500 to 6,000 mg is accepted.
- **Shown in the Micros view** (MM-310): with a limit, the sodium row is "1,840 of 2,300 mg" and its marker
  is the limit, labelled "your limit".
- **Over the limit**: the row says "Over your limit by 300 mg" in the ordinary text colour. No caution
  colour, no icon, no notice (MM-108: plain, not alarmed).
- **"Over" needs no coverage.** A known total above the limit is over whatever is missing, since a missing
  value can only add. A known total under the limit with foods missing sodium says the coverage, as every
  row does.
- **With chronic kidney disease** the switch row's subtitle says that a care team usually sets this limit;
  the user can still set one.

## Description
A sodium limit preference, its Settings rows, and the sodium row in the Micros view against it.

## Acceptance Criteria
```gherkin
Scenario: Off by default
  Given a new installation
  Then Settings shows the sodium limit switched off and no sodium limit is shown anywhere

Scenario: Switched on
  When the sodium limit is switched on
  Then the limit is 2,300 mg and can be changed

Scenario: Out of range
  When 80 mg is typed as the limit
  Then the field says the limit must be between 500 and 6,000 mg and the limit is not changed

Scenario: Under the limit
  Given a limit of 2,300 mg and 1,840 mg of sodium known today
  Then the Micros sodium row says "1,840 of 2,300 mg"

Scenario: Over the limit, with foods missing sodium
  Given a limit of 2,300 mg, 2,600 mg known today, and 2 of 6 foods with no sodium
  Then the sodium row says "Over your limit by 300 mg"

Scenario: Plain
  Then the over-limit row has the same colour as any other row

Scenario: Kept
  When the app is restarted
  Then the limit is as it was set
```

## UI/UX
- Settings Nutrition Goals — apps/mobile/src/gallery/screens/Settings.stories.tsx (Story: Nutrition
  Goals). The section with both switches on.
- Food Micros Over Limit — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: Micros Over Limit).

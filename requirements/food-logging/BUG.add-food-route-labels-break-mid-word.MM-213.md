---
id: MM-213
status: proposed
component: food-logging
related: [MM-38, MM-45, MM-150, MM-212]
---

# Bug: Saved and Estimate break mid-word at the top of the Add food sheet

## Context
The Add food sheet opens with three buttons side by side under the search
field: Scan, Saved and Estimate, each with an icon
(`apps/mobile/lib/src/food/add_food_sheet_state.dart`, the row after the
search field). Found on 2026-10-11 by the first screenshot of the sheet ever
taken (`apps/mobile/test/goldens/images/add_food_opened_dark.png`, MM-212).
No earlier review could have seen it: the sheet had no screenshot test.

## Description
On a 360-wide phone, the size the screenshot tests use, the three buttons
share the width equally and the two longer labels do not fit beside their
icons. They wrap inside the word: "Save" over "d", and "Esti" over "mate".
Scan fits.

Expected: each one-word label stays on one line at 360 wide, and at the
largest text size the app supports the row still reads as three whole words
(by wrapping the row, dropping the icons, or another layout; the choice is
the fix's).

## Acceptance Criteria
```gherkin
Scenario: A small phone
  Given a 360-wide screen at the default text size
  When the Add food sheet opens
  Then "Scan", "Saved" and "Estimate" each stand on one line

Scenario: Large text
  Given the largest text size the app supports
  When the Add food sheet opens
  Then no label is broken inside a word
```

## Notes
- Guarded by `apps/mobile/test/add_food_route_labels_test.dart`. It was run
  enabled once and failed as it should (the Saved label is 42 high where one
  line is 21), and is skipped with this ticket's ID until the fix.
- The screenshot `add_food_opened_dark.png` shows the defect as it is today
  and will change with the fix.
- Not fixed here: MM-212 changes how reviews are done, and this is the app.

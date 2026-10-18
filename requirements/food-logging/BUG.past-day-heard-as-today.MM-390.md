---
id: MM-390
status: done
component: food-logging
related: [MM-316, MM-389]
---

# Bug: on a past day the Food screen still said "today"

## Context
Found by the UX role during the MM-389 review. The day stepper said "Yesterday", but the page's hidden
heading was always "Today", the hero's hidden heading was "Calories today", and the disclosure under
the day was "More about today". A screen reader heard the wrong day.

## Description
The Food screen's heading is the day shown, as the stepper says it; the hero's heading is
"Calories"; the disclosure is "More about this day".

## Acceptance Criteria
```gherkin
Scenario: Yesterday
  When the Food screen shows yesterday
  Then its page heading is "Yesterday"
  And no heading on it says "today"
  And the day's disclosure is "More about this day"
```

## Notes
Regression test: "a past day says nothing about today, in the headings or the disclosure" in
`apps/mobile/test/food/emptyDayCruft.test.tsx`; it failed on main and passes with the fix.

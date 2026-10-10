---
id: MM-168
status: done
component: coach-insights
related: [MM-141, MM-98, MM-104]
---

# Bug: The insight card's Dismiss button sat under the Add food button

## Context
The insight card (MM-141) is the last card on the dashboard. Its Dismiss button was aligned to the right edge. The dashboard's floating
"Add food" button sits at the bottom right. When the card was scrolled just into view, Dismiss was underneath the floating button and a tap
on it opened add-food instead. The user had to scroll further, which nothing suggested.

Found while writing the card's own widget test: the tap on Dismiss did nothing to the card. It was first "fixed" by moving the button and
changing the test to scroll further, with no ticket and no test of the fault itself. That was wrong; this ticket and its test put it right.

## Decisions
- **Dismiss is on the left of the card**, clear of the floating button at every scroll position.
- **A control on a scrolling main screen must never be reachable only by scrolling out from under the floating button.** This card is the
  first to put a button in that corner; the test below is written so the same fault in this card cannot return.

## Description
`InsightCardState` aligned the button `centerRight`; it is now `centerLeft`.

## Acceptance Criteria
```gherkin
Scenario: Dismiss can always be tapped
  Given the dashboard shows an insight
  When the dashboard is scrolled to any position at which Dismiss is on screen
  Then Dismiss does not overlap the Add food button
  And tapping it removes the card
```

## Notes
- Regression test: `apps/mobile/test/insight_card_test.dart`, "Dismiss is never under the Add food button". It steps the dashboard through
  its scroll range and checks the two rectangles at each step. Confirmed to fail with the button back on the right ("Dismiss at … is under
  Add food at …") and to pass on the left.
- Not checked: other cards. None of the other dashboard cards has a control in the bottom right corner today.

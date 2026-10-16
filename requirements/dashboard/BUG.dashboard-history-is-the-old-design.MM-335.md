---
id: MM-335
status: proposed
component: dashboard
related: [MM-321, MM-224, MM-253, MM-173]
---

# Bug: the history under the Dashboard is the design from before the hierarchy

## Context
Found drawing the states no story drew, for MM-321 (stories "History", "History First Day", "History Paused", "History No Weigh In"). "More about this week" opens onto a second headline, "Your metrics", with the range switch, then a column of cards (Nutrition history, Protein history, Weight trend, …) inside the disclosure, against rule 1 of the screen direction (MM-224, MM-253: sections, not cards; nothing nested in a card). On a first day, "Log food to populate your intake history." sits bare on the canvas touching the disclosure's header. The intake chart draws today's unfinished log as a full day, so the line drops off a cliff at its right end (MM-173).

## Description
The history is drawn in the hierarchy the rest of the Dashboard uses, matched to its siblings (rule 9), with today's unfinished day not drawn as a finished one.

## Acceptance Criteria
```gherkin
Scenario: Opening the history
  When "More about this week" is opened
  Then what it holds follows the screen direction's tiers: no second headline, no cards inside the disclosure

Scenario: Today, unfinished
  Given today's log is not finished
  Then the intake chart does not draw today as a whole day
```

## Notes
Guarded by "MM-335" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the fix lands. A design fix: drawn in Storybook, reviewed by the panel's designer and UX guard, then built (AGENTS.md).

---
id: MM-335
status: done
component: dashboard
related: [MM-321, MM-224, MM-253, MM-173, MM-334, MM-353]
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

Scenario: Today alone, unfinished
  Given only today's log, not marked complete
  Then the intake summary says what today holds so far and that it counts once marked complete

Scenario: Averages
  Given today's log is not marked complete
  Then the averages leave today out
```

## Notes
Guarded by "MM-335" in `apps/mobile/test/gallery/registerDefects.test.tsx` and the MM-335 tests in
`apps/mobile/test/dashboard/dashboardMetrics.test.tsx` and `dashboardHistory.test.ts`, which failed before the
fix. Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16); their changes were
built:
- The history is "Days shown" (the 7/30 switch, as a row on a surface), then sections Intake, Protein, Weight
  trend, Waist, Logging, Coach and expenditure, How you are holding up. A summary says what the chosen days add
  (an average, a change since the first day shown), never a figure the rows above give; the day counts live in
  Logging alone.
- A header that opens a tab is a button inside the heading, named by its title and described by its summary
  and "Opens Food" (`MmSection opens`, `MmPressable describedBy`); Train's weekly volume says where it goes too.
- Today, until marked complete, is an open dot apart from the line and is left out of the averages. The axis is
  scaled on finished days; when today falls outside it, the legend says its value ("○ Today so far, 566 kcal").
- With nothing finished, or one weigh-in, or one waist measurement, the chart is left out and the summary says so.
- Protein carries a shaker bottle, drawn for the app at the owner's choice (`ShakerBottleOutlined`).
- The recovery line outside its section was a defect of its own: MM-353.

---
id: MM-680
status: in-progress
component: training
related: [MM-78, MM-253, MM-258, MM-677, MM-678]
---

# Task: Weekly volume and Cardio fold in place on Train, and Cardio is drawn, not written

## Context
The owner, from the phone (2026-10-28), on MM-677's Cardio screen and MM-258's Weekly training volume screen: "Both of
these need to be collapsibles not nav to sub views. Then, Cardio must have infographics. it's that claude${1}generated wall of text." A phone call-out of the owner's: fixed without a panel.

## By the product owner
- Weekly training volume and Cardio are folds on Train, in place; neither opens a screen.
- Cardio is drawn as graphics: figures, bars and a chart, not paragraphs.

## Decisions
Choices made without asking (say if any is wrong):
- **Both folds start closed** with their summary line, as every fold on the Coach tab does (MM-676), and are remembered
  (`train.volume`, `train.cardio`). The section's header is still the button the tests and the strip's sibling know.
- **Weekly training volume's fold** holds the muscle rows (`MuscleVolumeRow`) as they were, the line on omitted sets
  when there are any, and "How to read this" as a disclosure (MM-253, rule 1: tertiary content one tap down). A failed
  read shows `ReadFailedNotice` inside the fold with its retry.
- **Cardio's fold** is drawn by its siblings: the week's two figures (`CardioWeekFigures`, as `TrendStats` draws the
  trend weight: the figure, then its line with the floor and last week); the steps of the last seven days as bars on
  the floor's line (`StepsByDayChart`, as `NightsChart` draws nights: a day with no total an open slot, today's bar
  lit, the weekday letters under); the minutes by activity as bars against the floor with last week's marker
  (`CardioActivityBars`, as `MuscleVolumeRow` draws a group); and the sessions under a disclosure. One quiet series
  per chart, no legend, no number on every bar; the figures carry the numbers. A meter under the header shows the
  minutes against the floor while the fold is closed.
- **The Cardio and Weekly volume screens are deleted** with their stories; the folds' states are drawn on Train.
- The disclosure for a missing wearable (MM-677) stays as the summary line.

## Acceptance Criteria
```gherkin
Scenario: Weekly volume folds in place
  When Weekly training volume is pressed on Train
  Then the muscle rows unfold under it on Train, and no screen opens

Scenario: Cardio folds in place, drawn
  Given a week of sessions and steps from the watch
  When Cardio is pressed on Train
  Then the fold shows the two figures, seven bars of steps against the floor, the minutes by activity as bars, and the sessions one tap down
  And no screen opens
```

## UI/UX
- Train — apps/mobile/src/gallery/screens/Train.stories.tsx (Story: WeeklyVolume, WeeklyVolumeEmpty, WeeklyVolumeFailed,
  Cardio, CardioEmpty, CardioFailed, CardioSmallPhone): each fold open in each state, the small-phone one with the
  longest activity name and an hour of minutes.

---
id: MM-257
component: body-measurements
status: done
related: [MM-253, MM-224, MM-17, MM-136, MM-155, MM-77]
---

# Story: the Progress screen in tiers

## What is built

- **The hero**: the weigh-in field and the trend chart as one surface, the
  three figures (trend, last 7 days, since start) above the chart, the
  30-day and 90-day switch in the header.
- **"How to read this"** as a disclosure under the chart; the four-line
  caption leaves the surface.
- **Weight events as rows** with an icon per event type (illness, travel,
  training change, big meal, creatine), newest first, the add action in
  the section header; the four-line paragraph becomes the empty state's
  one sentence.
- **Waist and strength as sections** with their icons and a one-line
  summary each, opening on press.
- **One primary action**: Save the weigh-in; everything else is a row or a
  header action.

## Acceptance criteria

```gherkin
Scenario: The chart stands alone
  Then no explanatory text is on the surface with the chart; "How to read this" opens it

Scenario: Events as rows
  Given an illness and a travel event
  Then each is a row with its icon and date, and the empty state is one sentence

Scenario: Nothing lost
  Then every figure and control the old screen showed is reachable within one tap
```

## UI/UX

`apps/mobile/src/gallery/screens/Progress.stories.tsx` (Progress), before
and after.

## Progress

Built 2026-10-13. One hero holds today's weigh-in (`NumberEntry`; Save appears once the value changes, so no disabled primary sits in the hero, PD-17) and the trend: the 30/90 switch in its header, the three figures, the chart, one line about the band kept in view ("day-to-day jumps inside it are noise, not fat", UX-5, PD-19), and "How to read this" one tap down. Weight events are a section with the add action in its header and one row per event with its icon (illness, travel, creatine, training, meal) and the day in words (MM-285); the empty state is one sentence. Waist and Strength are sections folded to their lines (the waist summary; the lifts over 90 days), Waist opening to the technique line first (UX-22), the fields and a quiet Save (PD-4); Strength opens by itself when there are recent lifts. Tests: `test/progress/*` updated (`weightEvents.test.tsx` new). Story: `Screens/Progress` Progress. Left for MM-287: one figure instead of three and the lifts as rows (PD-18, PD-20).

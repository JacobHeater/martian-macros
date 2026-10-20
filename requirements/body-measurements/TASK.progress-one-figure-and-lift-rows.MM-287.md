---
id: MM-287
component: body-measurements
status: done
related: [MM-253, MM-257, MM-77, MM-107]
---

# Task: Progress with one figure, and the lifts as rows

## What the panel found (product-designer PD-18, PD-20, 2026-10-13)

The hero shows three figures of equal weight (trend weight, last 7 days,
since start); `design/screen-direction.md` asks for one `figure` with the
week's change beneath it in `body`, and `visual-language.md` for one
strongest element per view. Unfolded, Strength is an intro paragraph, a
button and up to four cards that each repeat the three-sentence estimate
disclaimer; the waist technique sits inline.

MM-257 kept the three figures and the lift cards (the tests of MM-77 read
the cards); this ticket finishes the hierarchy.

## What is built

- The hero's trend weight is the one `figure`; "−0.6 lb last 7 days ·
  −5.5 lb since start" is one `body` line in `text2` beneath it.
- Unfolded, Strength is a list of lift rows (name, latest estimated max,
  the 4-week change, the `trend` icon), each opening the lift's history
  screen, with the estimate's disclaimer once at the section's foot; the
  per-lift chart lives on the history screen.

## Acceptance criteria

```gherkin
Scenario: One figure
  Then the Progress hero has one element in the figure type role, the trend weight

Scenario: Lifts as rows
  Given four most-trained lifts
  Then Strength shows four rows and one disclaimer, and a row opens the lift's history
```

## UI/UX

`apps/mobile/src/gallery/screens/Progress.stories.tsx` (Progress).

## Progress (2026-10-20, feat/m2)
Built, closing the ticket:
- **One figure**: the Progress hero's trend weight is the one element in the figure role; the 7-day and since-start changes are one
  line beneath it (`TrendStats`), and changes with too little history are left out rather than dashed.
- **Lifts as rows**: Strength shows the four most-trained lifts as rows with the trend icon, one disclaimer, and a row opens the
  lift's history. The rows sit on the canvas like the Weight events rows beside them (the sibling; the panel's PD4), with no
  list-group surface.
- Test: `progressHero.test.tsx`. Story: `Screens/Progress` Progress.
Decided here (say if wrong): the range control stays on the trend's heading line (the panel's PD5 suggested moving it above the
chart; the chart is what it changes and the two are adjacent), and "since start" stays until a dated wording is drawn.

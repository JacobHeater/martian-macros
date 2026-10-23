---
id: MM-578
status: done
component: body-measurements
related: [MM-579, MM-257, MM-155, MM-156, MM-250, MM-20, MM-136, MM-32, MM-344, MM-118]
---

# Story: Every Progress section has a graphic, and says plainly when it has nothing to draw

## Context
The owner (2026-10-22), looking at Progress on a phone: every section on the Progress tab must have an info graphic, and
with no data it must say so clearly. Progress photos is the one exception. Before this, only the hero (the weight trend)
and the waist (once measured) drew anything; weight events, period days, sleep, more measurements, the recomp signal and
strength trends were words and rows only, and an empty section was a line of text or nothing at all.

## Decisions
With the owner (2026-10-22):
- **Every section draws a graphic; Progress photos is the exception.**
- **With nothing to draw, the graphic's place says so**, and how far along where it needs more than one record.

Choices I made without asking (say if any is wrong):
- **One empty state for every graphic** (`ChartPlaceholder`): the graphic's frame, faint and dashed, with an info icon and
  what it waits for, plus "k of N" where a threshold applies. It never draws a value, so an empty graphic is never read as
  zero (memory: disclose data-gated features).
- **Per section:**
  - Weight trend (hero): unchanged with data; with no weigh-in, the placeholder at the chart's height: "No trend yet. Your
    first weigh-in starts it."
  - Weight events (the owner, 2026-10-22: "where is the chevron"): **folds to a line** like Sleep and Waist, beside its
    add action: "None noted yet.", "N in the last 30 days." or "None in the last 30 days; N earlier." It stays open while
    the events are read or could not be. Remembered across visits.
  - Weight events, opened: the trend chart's days (its 30 or 90) as a line, a tick a week, a caution dot on each event's day
    (`DayTrack`). None at all: the placeholder with what to note. Events only older than the range: "None in the last N
    days", and the rows stay.
  - Period days: the same line, each flow day a dot and the stretch the trend widens for shaded, as the trend chart shades
    it. None marked: the placeholder.
  - Sleep (the owner, 2026-10-22, on the first cut: "ugly and terribly spaced"; the colours did not follow the theme,
    it needed a trendline, and the chart sat indented): the fortnight as bars (`NightsChart`) **replaces the fourteen
    chips**: a tap in a night's column (or the arrow keys, Home, End, as the trend chart's weigh-ins, MM-142) chooses the
    night to type or correct below. Bars in the palette's trend colour (`--ion`) muted, the chosen night in its "chosen"
    colour (`--chosen`), a weekday letter under each column; a night not recorded is an open slot. Over the bars, the
    centred 7-night average of the recorded nights in `--ion`, from three nights, broken where there are fewer.
    Gridlines every three hours mark no target (no sleep advice, MM-368). The row's line names only the chosen night
    ("Not recorded yet.", "7 h 5 m from Watch. Type to use yours instead."); the count of the fortnight sits under the
    chart, with "0 of 14" when none is recorded. The chosen night is said aloud as it changes.
  - Waist: the "Waist over time" surface always shows; before the first measurement it holds the placeholder, "0 of 3
    measurements" (the line starts from the third, MM-155).
  - More measurements: each measured site's row carries a small line of its last eight measurements (`MiniTrend`, as on
    Coach's recovery rows). No site beyond the waist chosen, or none measured: the placeholder.
  - Recomp signal: its three parts as rows (trend weight flat, waist down, strength up), each "Seen", "Not seen" or "Not
    logged enough" by icon and word. The section still takes no room when it has nothing to say (MM-32): it is an insight,
    not a record, so its empty state is its absence.
  - Strength trends: each lift's row carries a small line of its last eight sessions' smoothed estimates. A bodyweight lift
    with the weight hidden draws none (MM-118). No workout finished, or none in 90 days: the placeholder. Each lift's own
    chart stays on its history (MM-344, rule 4); the row's line is a glance at it, not a second home.
- **Graphics run the column's width** in a section, under its icon, as its list group does (MM-344); words stay in line
  with the title.
- **Siblings** (MM-318): the new graphics follow the trend and waist charts (tokens, axis type, `role="img"` with a spoken
  summary) and `MiniTrend`; the track's dates are the trend chart's axis dates.
- The panel pass is skipped: the change was dictated by the owner (apps/mobile/AGENTS.md, "Design").

## Description
Every section of Progress except Progress photos shows a graphic of its data. A graphic with nothing to draw shows its faint
frame with a sentence saying what will appear and what starts it, and a count toward a threshold where there is one.

## Acceptance Criteria
```gherkin
Scenario: No weigh-in
  Given no weigh-in is recorded
  When Progress opens
  Then the trend chart's place says "No trend yet. Your first weigh-in starts it."

Scenario: No waist measured
  Given no waist measurement
  When the Waist section is opened
  Then "Waist over time" says no measurements yet, and "0 of 3 measurements"

Scenario: Weight events on the trend's days
  Given a weight event 5 days ago
  Then Weight events draws the last 30 days with one dot, named aloud with the event and its day

Scenario: Events only before the range
  Given a weight event 60 days ago and none since
  Then Weight events says none is in the last 30 days, and the event's row is listed

Scenario: Sleep
  Given no night recorded in the last 14
  Then Sleep draws 14 open slots and says "0 of 14"
  Given one night recorded
  Then Sleep draws one bar and 13 open slots
  When a night's column is tapped
  Then that night is the one typed below

Scenario: Strength and more measurements with nothing yet
  Given no workout finished and no site beyond the waist
  When Strength trends and More measurements are opened
  Then each says what starts its lines
```

## UI/UX
- ProgressNoWeighIn, ProgressWaistChartEmpty, ProgressWeightEventsOutOfRange, ProgressWeightEvents, PeriodDaysNoneMarked,
  PeriodDays, SleepNotRecorded, SleepRecorded, SleepFromWatch, ProgressMeasurementsSuggested, ProgressMeasurementsLimbs,
  ProgressRecompSignal, ProgressStrengthEmpty, ProgressNoRecentLifts, Progress — apps/mobile/src/gallery/screens/Progress.stories.tsx.

## Notes
- Tests: `test/progress/sectionGraphics.test.tsx`; `test/progress/weightEvents.test.tsx` ("with none, the section is one
  sentence") follows the new wording.
- Not run locally; CI validates. Not yet seen on a phone.

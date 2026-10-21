---
id: MM-124
status: done
component: macro-targets
related: [MM-119, MM-24, MM-27, MM-28, MM-41, MM-92, MM-98, MM-114, MM-121, MM-122, MM-123, MM-135, MM-144, MM-149, MM-486]
---

# Story: Shape my week, with higher days, without changing the total

## Context
Every day has the same target. Real weeks are not flat: people eat more at weekends, on training days, at a Friday dinner. A flat target
makes those days "failures" by design, and the commonest reaction to a failed day is to write off the rest of it.

Two ideas are bundled under "calorie cycling", with different support:
- **Planned flexibility for adherence**: giving a known social day more room. Evidence that flexible restraint beats rigid restraint for
  weight outcomes and binge risk is **moderate** and mostly observational; in lifters, a flexible and a rigid diet lost the same fat
  (Conlin 2021).
- **Physiological cycling** (more carbohydrate on training days, refeeds to "restore metabolism"): **emerging** at best. One small trial
  of two-day carbohydrate refeeds found better retention of fat-free mass (Campbell 2020); one week diet breaks did not change body
  composition in trained people (Peos 2021). Nothing here is established.

The requirement is therefore built for the first purpose and makes no claim about the second.

## Decisions
Choices I made without asking (say if any is wrong):
- **The week has a budget**: seven times the daily target. A weekly view shows the budget, what has been eaten, and the average so far.
- **The user may mark up to three weekdays as "higher days"** and choose how much higher: 10%, 20% or 30% above the flat daily figure. The
  other days are lowered equally so the weekly total is unchanged.
- **A preset "training days higher"** fills the higher days from the user's usual training days. It is the same mechanism.
- **No day goes below the calorie floor** (MM-28). If the chosen shape would push the lower days under it, the shape is reduced until it
  fits, and the user is told.
- **The lower days are never more than 15% below the flat figure.** A week of five very low days and two feasts is a binge-restrict
  pattern with a settings screen.
- **Protein is the same every day** (MM-121). The difference is carried by carbohydrate, then fat, respecting the fat minimum.
- **The app never takes calories back.** Going over on Tuesday does not lower Wednesday. The weekly view shows the average rising and
  says nothing about making it up. Under MM-92, eating less tomorrow to compensate earns nothing and is never suggested.
- **Likewise it never offers "banked" calories**: eating under on Monday does not raise Tuesday's target. The plan is set in advance or not
  at all.
- **Off by default.** Flat targets remain the starting point.
- **Built (2026-10-21), choices made without asking:**
  - The week is Monday to Sunday. The weekly view ("This week" on the Week shape screen) adds up each day's own
    target for the budget, what has been eaten Monday through today, and the average of the days before today
    (today is still being eaten). It never says what is left.
  - "Training days higher" takes the weekdays with a finished workout in at least two of the last four weeks,
    the most trained first, at most three (`usualTrainingWeekdays`). The setup holds a number of training days,
    not which ones. The row, "Use my training days", shows only when there are such days and they are not
    already the higher days.
  - On a lower day carbohydrate goes down first, to the 100 g floor when a balance is chosen (MM-122), then fat
    to its minimum for that day's calories; then the floor gives way. On a higher day fat is kept (raised only if
    the day's minimum asks more) and carbohydrate takes the rest.
  - When the shape is reduced, the screen says why: the calorie floor, or the 15% limit.
  - Where it lives: Settings > Coach > "Week shape", built like Period days on Progress (weekday chips that
    wrap) and the Training days row of Settings (the control sits in its row). The day's own target shows on
    Today and Food.
  - The rest of the coach (adherence, the under-eating notice, the estimate) still compares a day with the
    check-in's flat target. The week's total is the same, so the averages agree; a per-day comparison there is
    left for later.

Where the experts disagreed:
- The adherence expert wanted automatic rebalancing ("you have 300 left for the week"), as some competing apps do. The safety expert:
  that is compensation by another name, and the pattern it trains (over, then restrict) is the one MM-92 exists to avoid. Rejected, and
  listed in the non-goals (MM-144).
- The bodybuilding coach wanted scheduled refeeds described as protecting metabolism. The researcher: not supported. A higher day may be
  *named* "refeed" by the user; the app describes it only as a higher day.

## Description
A week-shape setting (up to three higher weekdays and how much higher, the others lowered equally so the
multipliers sum to seven); targets per day derived from the stored target and the shape in force that day
(`shapeWeek`, `shapedTargets`, `dayTargetsOn`); a weekly view.

## Acceptance Criteria
```gherkin
Scenario: Two higher days
  Given a flat target of 2,000 kcal and Saturday and Sunday set 20% higher
  Then Saturday and Sunday are 2,400 kcal and the other five days 1,840 kcal
  And the seven days total 14,000 kcal

Scenario: The floor limits the shape
  Given a woman with a flat target of 1,300 kcal, a floor of 1,200, and two days set 30% higher
  Then the lower days are 1,200 kcal and the higher days 1,550 kcal, and she is told the shape was reduced

Scenario: The 15% limit
  Given three days set 30% higher on a 2,400 kcal target
  Then the lower days are not below 2,040 kcal and the higher days are reduced to keep the weekly total

Scenario: Protein is constant
  Then the protein minimum and target are the same on every day of the week

Scenario: No taking back
  Given 600 kcal over the target was logged on Tuesday
  Then Wednesday's target is exactly what it was planned to be
  And no text suggests eating less to make up for it

Scenario: No banking
  Given 500 kcal under the target was logged on Monday
  Then Tuesday's target is exactly what it was planned to be

Scenario: A past day
  Given the shape was changed last week
  Then a day before the change is compared with the target it had at the time

Scenario: Training days higher
  Given workouts on Mondays, Wednesdays and Fridays in most of the last four weeks
  When "Use my training days" is chosen
  Then Monday, Wednesday and Friday are the higher days

Scenario: At most three
  Given three higher days
  When a fourth is chosen
  Then it is not added, and the user is told three is the most

Scenario: A planned lower day is a whole day
  Given any shape the app allows, eaten as planned for four weeks, with no day marked
  Then the partial-day rule (MM-27) keeps every day
```

## UI/UX
- WeekFlat, WeekWeekendHigher, WeekShapeReduced — apps/mobile/src/gallery/screens/TargetShape.stories.tsx.
  Off; Saturday and Sunday 20% higher with the week laid out; three days 30% higher, reduced, and said.
- TodayOnALowerDay — the same file. Today's hero on a lower day.
- CoachRows — the same file. The row in Settings > Coach.

## Progress
Built 2026-10-21 against `TargetShapeRepository` and its in-memory fixture (principle 4): another branch held
the schema (MM-71). MM-486 then added the table (schema 16) and `SqlTargetShapeRepository`, so the shape is
kept on the phone, erased, backed up and restored with everything else. Not run locally; CI validates.
Guarding tests:
- `test/engine/weekShape.test.ts`: two higher days, the floor limits the shape, the 15% limit, at most three,
  and "a shaped week and the partial-day rule" (every allowed shape, eaten as planned, keeps all 28 days: the
  lowest planned day is about 68% of a higher one, above the 65% cut).
- `test/engine/shapedTargets.test.ts`: the week totals seven flat days; protein and its minimum constant;
  carbohydrate first, then fat, never under its minimum.
- `test/state/dayTargetsOn.test.ts`: no taking back, no banking, a past day keeps its target.
- `test/engine/usualTrainingWeekdays.test.ts`; `test/settings/targetShape.test.tsx` (flat until chosen, at most
  three, no text about making a day up).
Built 2026-10-21: **the simulator suite over shaped intake**, `test/engine/shapedIntakeSimulation.test.ts`.
Forty simulated users per case eat a shaped week as planned for 35 days (the weekend 30% higher; three days
30% higher, held to 15% lower days), with the usual logging and adherence noise, with and without a
glycogen-and-gut store that rises and falls with the higher days (MM-131). Each case asks of the
expenditure estimate what the flat case does: bias under 100 kcal, the truth inside two stated deviations
at least 85% of the time, within 60 kcal of the same users with the same noise eating flat, and no more
partial days dropped than flat. So the 15% limit stands unless CI says otherwise. Not run locally; CI
validates.

The code is complete. The panel's product-designer and UX review was a fast source-only pass (no render);
its blocking findings (an action row that read as a status line, explanations inline, notice placement,
repeated icons) were fixed.

## Owed on a phone
- A look at the stories (WeekFlat, WeekWeekendHigher, WeekShapeReduced, TodayOnALowerDay, CoachRows) in all
  three palettes.

## Notes
- Priority: should-have.
- The expenditure estimate uses average intake over a window and is indifferent to the shape (MM-23). The partial-day rule (MM-27) compares
  a day with the window's 75th percentile; with a 30% shape, a planned low day sits at about 72% of a high day, above the 65% cut. Verify
  in the simulator before shipping, and tighten the 15% limit if needed.
- Stored targets history (MM-60) holds one target per check-in; per-day targets are derived, not stored, so past days stay explainable.

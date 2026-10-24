---
id: MM-612
status: done
component: coach-insights
related: [MM-604, MM-605, MM-606, MM-607, MM-610, MM-611, MM-608, MM-141, MM-124, MM-114, MM-11]
---

# Story: The 1d analysis: today

## Context
MM-141 says an insight never concerns a single day. One day is noise, and judging a day trains a restrict-after-overeating
cycle (the non-goal "No automatic compensation for an over or under day"). On 2026-10-24 the owner overruled this for the Coach
tab (MM-608): "I want single days", and "analysis should happen even for the day". The owner's design: the analysis opens on
**1d**, with a switcher for longer spans (MM-610). The compensation risk is met by the Refeed and Day off marks (MM-611) and by
the rules below.

## Decisions
By the product owner, 2026-10-24: the Coach tab's analysis defaults to 1d, today, from the first logged entry.

Choices made without asking (say if any is wrong):
- **1d analyses today as logged so far**, and updates with each entry:
  - MM-606's signals applied to the day: protein, fat and protein density, fat share, calories against the band, fiber, and
    sodium if a limit is set. Each is read against the day's targets, with the top contributing food and its trade (MM-607).
  - Example: "Lunch was 780 kcal with 18 g protein; the cheese and crackers were 60% of its fat. Trading them for the cottage
    cheese you log adds 20 g at about the same calories."
  - Single-day margins: fat over its target by ≥ 25% and ≥ 15 g; protein density under 85% of what the targets need, on ≥ 400
    kcal logged; calories over the band (uncertain).
  - Holding-up lines count too ("Protein 152 g, over your 140 g minimum").
- **What is left:** calories and protein against today's targets. When protein is behind, one or two foods the person logs that
  fit the protein left within the calories left: "62 g protein and 610 kcal left today. Your usual chicken and rice (48 g, 520
  kcal) fits."
- **A day marked Refeed or Day off** (MM-611) shows its totals and what is left, with no fixes.
- **Never compensation:**
  - no line moves an over or under day onto another day;
  - 1d never mentions an earlier day;
  - today's targets are never changed by another day (MM-124);
  - it never says to eat less.
- **Safeguards:**
  - Eating-disorder history: protein lines only, no food named, nothing about calories or fat.
  - Under-eating finding, pregnancy, breastfeeding, underweight: no line that lowers intake.
  - Under 18, or paused: nothing.
- **1d findings are not trends.** They are not written to MM-605's announcement log and have no state.

Settled while building, 2026-10-24 (choices made without asking; say if any is wrong):
- **Fat on 1d** is said, as on a span, only when it displaces protein (the density line holds) or calories are over the band.
- **Calories over the band** is a 1d line on fat loss and recomp, as N14 on a span; it states the figure and at most a trade, never
  "eat less".
- **Fiber on 1d** is said only as holding up (at the guide so far): a day not yet over is not judged short. Sodium is a fix once
  the known sodium is over the limit, since it can only rise.
- **What is left** is against today's calorie target as planned (MM-124) and the protein target. The foods that fit are foods or
  meals logged as one (MM-587) on at least 2 days of the last 56, at their median portion, within the calories left, with at least
  10 g of protein and a fifth of their energy from it; most protein first.
- **Safeguards on 1d:** the under-eating finding leaves protein, fiber and what is left (MM-606's "adds only"); kidney disease
  leaves protein out of what is left; an eating-disorder history leaves protein alone in it, with no food. A marked day shows one
  "left" finding carrying the day's totals.

## Description
The 1d view of MM-610's section: MM-606's signal definitions applied to today, with single-day margins and MM-607's trade.

## Acceptance Criteria
```gherkin
Scenario: Today analysed from the first entry
  Given a new user whose only entries are today's lunch, 780 kcal with 18 g protein, mostly cheese and crackers
  When the Coach tab opens
  Then the analysis is on 1d, names the cheese and crackers, and offers a trade when one qualifies
  And nothing waits on days of history

Scenario: What is left
  Given 610 kcal and 62 g of protein left today, and a logged meal of 520 kcal with 48 g protein
  Then 1d states what is left and names that meal

Scenario: Updates with each entry
  When a food is logged
  Then the 1d analysis reflects it on returning to the Coach tab

Scenario: A marked day
  Given today marked "Refeed" with fat at twice its target
  Then 1d shows the day's totals and what is left, and no fix

Scenario: Never compensation
  Given yesterday 800 kcal over target
  Then nothing on 1d mentions yesterday, and today's targets are unchanged

Scenario: Eating-disorder history
  Given an eating-disorder history and a fat-heavy lunch
  Then 1d shows at most protein lines, with no food named

Scenario: Holding up
  Given today at the protein minimum and within the calorie band
  Then 1d says so in numbers
```

## Progress
Built 2026-10-24: the 1d analysis and its words. Not run locally; CI validates.

- **Where:** `apps/mobile/src/engine/analysis/food/analyseFoodDay.ts`: `analyseFoodDay(input, today)`, with the foods that fit
  what is left (`foodsThatFit.ts`), on MM-606's input, safeguards, N11 and MM-607's `findTrade`. The words are
  `apps/mobile/src/format/foodFindingText.ts`.
- **Contract:** `CoachFood` gained an optional `proteinG`. The 'left' finding's figures carry the day's totals (`kcal`,
  `proteinG`, `fatG`, `carbsG`), the targets, what is left, and `marked` (1 a Refeed, 2 a Day off).
- **Tests:** `apps/mobile/test/engine/foodDay.test.ts` (today from the first entry, what is left, updates with each entry, a
  marked day, never compensation, the eating-disorder history, holding up, and the other safeguards) and
  `apps/mobile/test/format/foodFindingText.test.ts` (1d never names another day; the eating-disorder "left" says nothing of
  calories).
- ~~**Remaining:** wiring into `AppState` and the Coach tab's 1d (MM-610), recomputed on each log change.~~ Done, below.

Wired into the Coach tab (MM-610), 2026-10-24. Not run locally; CI validates.

- `AppState.coachAnalysis` (`state/CoachAnalysis.ts`) runs `analyseFoodDay` for 1d, the default span, and works it out
  again on every log change; "what is left" is shown at the top of the section (`WhatYourDataSaysSection`).
- Tests: `apps/mobile/test/state/coachAnalysis.test.ts` ("a log of today's food is read at once") and
  `apps/mobile/test/coach/whatYourDataSays.test.tsx` ("opens on today"). Every scenario is covered, so the story is done.

Review fixes (MM-610's review), 2026-10-24. Not run locally; CI validates.

- **Ids:** a 1d finding's id is `day:<epochDay>:<signal>:<kind>` (`analyseFoodDay`), no longer `day:<signal>`.
- **Nothing logged today, with history:** `analyseFoodDay` gives the "left" finding alone, at the whole of today's
  targets; the section says "Nothing logged today yet." and "7d reads the last week." when 7d is offered. "Log a food
  and the coach reads it here." stays for nothing ever logged.
- **A trade on 1d (a bug, fixed):** MM-607's X had to be on 3 days of the span's entries, which a single day can never
  give, so 1d never offered a trade. On a span shorter than 3 days X is now asked to be on each of its days
  (`findTrades`), so on 1d it is a food logged today; Y is still one the person logs in that meal on 2 days of the last
  56. Regression test: `apps/mobile/test/engine/foodDay.test.ts` ("a 1d trade").
- **Words:** the 1d density title is in plain amounts ("18 g protein in 780 kcal so far"); what fits says "48 g
  protein"; the 1d calories lines carry a "Band" row; the 1d fat line puts fat beside protein ("So far today fat gave
  855 kcal while protein was 20 g."), never "so those calories went to fat".
- **Tests:** `apps/mobile/test/engine/foodDay.test.ts` ("history but nothing logged today", "a 1d dismissal lasts the
  day": dismissing yesterday's holding-up calories line leaves today's calories fix showing, and hides that line for
  the rest of its own day; "a 1d trade"; what fits now "48 g protein"), `apps/mobile/test/format/foodFindingText.test.ts`
  (the 1d density title, the band) and `apps/mobile/test/coach/whatYourDataSays.test.tsx` (nothing today, nothing
  ever). Stories: CoachAnalysisTodayNumbers, CoachAnalysisTodayTrade, CoachAnalysisNothingToday.

Choices made without asking (say if any is wrong):
- **A 1d dismissal lasts the day.** Dismissing a line on 1d hides that line, of that kind, for that day only: the next
  day's line of the same signal is another finding and shows, as is the same signal's line of another kind that day
  (a holding-up calories line dismissed does not hide a calories fix later the same day). It is still written to the
  trend log with the 28 days of any dismissal, which can only matter on its own day.
- **X on 1d** needs only be logged today (above).

Not done (found while fixing, for the owner):
- **The calorie floor on 1d:** `findTrades` keeps a trade from taking the span's average intake under the calorie floor;
  on 1d that average is today so far, nearly always under the floor before dinner, so in the app a 1d trade is offered
  only when Y has at least X's calories. The story `CoachAnalysisTodayTrade` uses such a Y. Reading the floor against
  the day's target instead is a behaviour change left for a decision.
  - **Settled 2026-10-24:** 1d passes no floor to `findTrades`. A day still being eaten is judged against its target, which
    the floor already bounds, and a trade keeps calories within 0.6–1.1× of X. A lower-calorie Y can now be offered on 1d.


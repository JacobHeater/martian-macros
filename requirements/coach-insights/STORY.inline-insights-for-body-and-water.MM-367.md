---
id: MM-367
status: done
component: coach-insights
related: [MM-361, MM-362, MM-378, MM-142, MM-118, MM-155, MM-301, MM-313, MM-358, MM-359, MM-11]
---

# Story: The first inline insights on the waist and water

## Context
See MM-361 and MM-362. A weigh-in that jumps already gets its own explanation (MM-142). That stays as it is: it is not an inline
insight and is not duplicated by one.

## Decisions
The product owner's (2026-10-17): every trackable surface.

The panel's measurement, coaching and safety roles reviewed the draft (`docs/agent-runs/mm367-body-water-rules/`); measurement
said "do not build as drafted", the others "build with the listed changes". Choices I made without asking (say if any is
wrong), from their findings:
- **"Unusual weigh-in time" is dropped** (the panel's ME-1, SA-3, CO-6). A weigh-in stores a day and a weight, no time; the
  time an entry is typed is not the time the person stood on the scale, so "Weighed later than usual" could be false, and
  a false line about a reading invites a re-weigh, which MM-118 treats as a warning sign. A version scoped to connected
  scales with a known time is possible later (ME-1 b); the field's hint already teaches the time.
- **"Waist: no clear change" uses the app's one shared waist answer** (`waistChangeOf`, MM-155: smoothed over 28 days, never
  two single readings; ME-4), and is said only when the latest reading moved from the one before by at least the tape's
  noise while the smoothed answer is still no clear change (ME-5): the one moment a change is likely to be read into a
  reading, so a weekly measurer is not told "no change" every week. The words use the phrase the Progress card already uses,
  with no "yet" (CO-3): "About the same as 4 weeks ago. A difference under 1.5 cm is within what a tape can tell." Off with an
  eating-disorder history (SA-1): a verdict under a body reading rewards body checking.
- **"Water logged on few days" is about logging, not drinking** (CO-1, SA-7, ME-8): "Water logged on 5 of the last 14 days.
  Add a glass here logs one in a tap." No amount, schedule or "habit". It counts the 14 complete days before the day shown
  (a morning with no water yet is not a day without water), fires for someone who has logged water in the 60 days before
  the window (a feature never used gets no line, CO-2), once the app has been in use for the whole window, and only with a
  goal the app suggested: a goal the person set while the suggestion is withheld, for a clinician's fluid limit, kidney
  disease or bariatric surgery, gets no line (SA-5). Off with an eating-disorder history, in which fluid loading and
  appetite-suppressing drinking are reported (SA-6).
- **The snooze's item for a Dashboard row is the row** (CO-5, SA-8): snoozing the waist line quiets it for every waist reading
  for the length chosen; recorded in MM-378.
- **MM-142's precedence scenario is deferred to MM-142's build** (ME-9); it has no hook yet.
- **The `WaistRule` figures gained their evidence rows** (ME-6), owed since MM-155.

| kind | priority | under | fires when | the line (example) | safeguard |
|---|---|---|---|---|---|
| waist: no clear change | pattern | the waist row | the latest reading moved from the last by ≥ the tape's noise and the shared 28-day answer is no clear change, with ≥ 3 entries across both ends | "About the same as 4 weeks ago. A difference under 1.5 cm is within what a tape can tell." | off for ED history |
| water logged on few days | data quality | the water row | a suggested goal in force; in use for 14 days; water logged in the 60 days before; water on < 7 of the 14 complete days before today | "Water logged on 5 of the last 14 days. Add a glass here logs one in a tap." | off for ED history; none with a goal set while the suggestion is withheld |

## Description
The two rules, their words, evidence register rows, and their placement on the waist and water rows.

## Acceptance Criteria
```gherkin
Scenario: Within what a tape can tell
  Given weekly waist readings around 92 cm for four weeks and a single reading of 93.0 cm today
  Then the "waist: no clear change" insight is shown under the waist row, and its numbers say the change had to pass 2.1 cm

Scenario: A reading much like the last
  Given today's reading differs from the last by less than the tape's noise
  Then no waist insight is shown

Scenario: A real change
  Given the shared waist answer is down
  Then no waist insight is shown

Scenario: Too little history
  Given two waist readings ever
  Then no waist insight is shown

Scenario: Water
  Given a suggested goal and water logged on 4 of the 14 complete days before today
  Then the "water logged on few days" insight is shown under the water row with 4 of 14

Scenario: Water never logged
  Given no water logged in the 60 days before the window
  Then no water insight is shown

Scenario: A clinician's amount
  Given a clinician's fluid limit and a goal amount the person entered
  Then no water insight is shown

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then neither insight is shown
```

## UI/UX
- DashboardWithInsights, DashboardWaistInsightOpen, DashboardLargeText, in `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`:
  the lines the app works out from the demo with a waist that moved a centimetre on one reading and water on 4 of 14 days.
  The design (reviewed in `docs/agent-runs/mm361-coaching-insights/`) drew three lines, one under the weigh-in; the weigh-in
  line is dropped and the other two reworded at the panel's review of the rules.

## Progress
- Built 2026-10-18. Engine: `waistWithinNoiseInsights`, `waterFewDaysInsights`, `WaterFewDaysRule`. A multi-day water reader
  (`WaterReader.watchWaterSince`, both stores, the contract). Kinds `waistWithinNoise`, `waterFewDays`. Words in
  `format/itemInsightText.ts`. The Dashboard reads the lines through `useItemInsightContent`.
- Tests: `test/engine/bodyAndWaterInsights.test.ts` (every scenario above but the last), `test/coach/foodAndBodyInsights.test.tsx`
  (the water row), `test/engine/allowedItemInsights.test.ts` (eating-disorder history), `test/engine/itemInsightEvidence.test.ts`.
- Evidence register: `waistWithinNoise`, `WaistRule.*` (ten rows), `waterFewDays`, `WaterFewDaysRule.*`.

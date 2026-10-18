---
id: MM-366
status: done
component: coach-insights
related: [MM-361, MM-362, MM-377, MM-77, MM-78, MM-79, MM-92, MM-148]
---

# Story: The first inline insight on workouts

## Context
See MM-361 and MM-362. The training log already records sets, works out an estimated one-rep max for each lift (MM-77),
suggests what to try next (MM-79) and counts weekly volume (MM-78, `WeeklyVolumeScreen`). Until now the coach said
nothing next to any of it.

## Decisions
The product owner's (2026-10-17): every trackable surface, and training is named. After the panel's review of the draft
(`docs/agent-runs/mm366-workout-rules/`, training, coaching and safety, all "build with the listed changes"):
- **"Holding steady" is dropped.** The progression suggestion on the same card already says when a lift has stalled
  ("No more reps at this load in three sessions. Holding X is a fair aim."). A second line either repeated it or
  contradicted it, and on fat loss it pushed for more where MM-79 says holding strength is the aim (the panel's TR-2,
  TR-3, CO-1, SA-1).
- **A pattern line shows in its first week, then rests for 28 days**, even while it still holds, so the coach does not
  repeat itself on every workout (the panel's CO-5).
- **"Volume jump" is said once a workout**, under the first exercise that mainly trains the muscle group, not under each
  (the panel's CO-6, TR-8).
- **"Strength on fat loss" comes later**, as MM-377: its "held" needs a tolerance the measurement role has to check, it
  must leave out bodyweight lifts, and the draft's words praised the diet ("That is what a well-run cut looks like")
  where they should credit the training (the panel's TR-6, TR-9, CO-2, SA-6).

Choices I made without asking (say if any is wrong), from the panel's findings:
- **The week is the workout's own.** A volume jump is judged on the 7 days to the workout shown and the 4 weeks before
  it, so a workout looked back on says what was true then, not this week (TR-5). A workout in progress counts the
  finished workouts before it, and says so ("in the 7 days before this workout").
- **Sets are counted as weekly volume counts them** (MM-78): hard sets of finished workouts, a set counting in full for
  its exercise's main muscle and half for each other muscle it trains. One function counts for both (`countHardSets`).
- **It needs history and a real jump.** At least 3 of the 4 weeks before had a hard set for the group, and the week is at
  least 1.5 times the usual week and at least 4 sets more. So a first training block, a missed month, or 2 sets becoming
  3 says nothing (TR-4, SA-5). These figures are judgement, recorded as such in the evidence register: the workload-ratio
  studies the 1.5 resembles are contested and are not cited for it.
- **Nothing is said across a pause.** A pause anywhere in the five weeks a jump looks at keeps it quiet, since the week
  after an illness or a trip is a comeback, not a jump (SA-4).
- **Words: soreness, never injury.** "A jump this big can bring more soreness; adding sets more slowly is easier to
  recover from." The claim stays at soreness, which the evidence supports; nothing says injury, pain, stop or "too
  much" (SA-5, SA-8). "Adding sets" names the unit, so it is not read as a lighter load (TR-12).
- **Workouts of the last 90 days** get their lines. An older workout shows none.
- **With an eating-disorder history the line still shows**: it is about training, not food or weight (MM-362). Under 18
  the app shows nothing (MM-362, and the app itself is closed to them).

| kind | basis | under | fires when | the line (example) |
|---|---|---|---|---|
| Volume jump | pattern | the first exercise of the workout that mainly trains the group | hard sets for the group in the 7 days to the workout ≥ 1.5 × its usual week (the average of the 4 weeks before, 3 of them with sets) and ≥ 4 more; in the jump's first week; no pause in those 5 weeks | "14 sets for chest in the 7 days to this workout. Your usual is about 9 a week. A jump this big can bring more soreness; adding sets more slowly is easier to recover from." |

- **No line under a set.** The finished workout's Personal records card already says a new best (MM-92, MM-318).
- **No rule comments on one set's reps or form**, because the app cannot see form.

## Description
The volume jump rule, its words, its evidence register rows, and its line under the exercise in a workout.

## Acceptance Criteria
```gherkin
Scenario: Volume jump
  Given 14 chest sets in the 7 days to a workout and 9 a week in each of the 4 weeks before
  Then "volume jump" is shown under the workout's first chest exercise, with both figures

Scenario: Once a workout
  Given a workout with three chest exercises during a jump
  Then one line is shown, under the first

Scenario: Small base
  Given 5 chest sets this week against 2 a week
  Then no line is shown

Scenario: Not enough history
  Given chest sets in only 2 of the 4 weeks before
  Then no line is shown

Scenario: Its own weeks
  Given a finished workout 21 days ago
  Then its line is judged on the weeks to that workout, whatever was trained since

Scenario: First week, then rest
  Given a jump first said 7 days ago that still holds
  Then no line is shown

Scenario: Across a pause
  Given a pause in the five weeks a jump looks at
  Then no line is shown

Scenario: No line under a set
  Given a set that beats every earlier one for its lift
  Then no inline insight is shown under it, and the Personal records card says the new best

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then "volume jump" is shown as usual
```

## UI/UX
- WorkoutWithInsights, WorkoutInsightOpen, in `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`: the
  demo with one more chest day this week, so the line under the bench press is the one the app works out (8 sets against
  about 2). The design drew "holding steady" under the lateral raise (reviewed in
  `docs/agent-runs/mm361-coaching-insights/`); the training role found it could never fire there (TR-1), and it is
  dropped.

## Progress
- Built 2026-10-17. Engine: `volumeJumpInsights`, `VolumeJumpRule`, `countHardSets` (weekly volume counts with it too),
  `trainingItemInsights`. Words: `format/itemInsightText.ts`. Kind: `itemInsightKinds`.
- Tests: `test/engine/volumeJumpInsights.test.ts` (each scenario above but the last two), `test/coach/inlineInsights.test.tsx`
  (the line on the workout, the Coach tab, Settings, pause), `test/engine/allowedItemInsights.test.ts` (eating-disorder
  history), `test/format/itemInsightText.test.ts` (forbidden words, including the panel's for training),
  `test/engine/itemInsightEvidence.test.ts` (register rows), `test/train/personalRecords.test.tsx` (the set).
- Evidence register: `volumeJump`, `VolumeJumpRule.*`, `countHardSets`.

# Brief: the nights of sleep on Progress, and the sleep line on Coach (MM-250, MM-252)

## Question
The owner decided (2026-10-13, MM-249) that sleep is a first-class signal. MM-250
builds the record and MM-252 the coach's reading of it. Drawn in Storybook
first (MM-293), for this review:

1. **The Sleep section on Progress** (`SleepNightCard`, stories
   `SleepNotRecorded`, `SleepRecorded`, `SleepFromWatch`, `SleepMistyped` in
   `Progress.stories.tsx`): an `MmSection` with the sleep icon, titled "Sleep",
   its one line "Last night 7 h 20 m." or "Last night not recorded yet." It is
   open while last night is not recorded and folded otherwise. Inside: a caption
   (hours asleep, not in bed; a night is kept against the morning it ended on);
   the last fourteen nights as `MmChoiceChip`s, "Last night", "The night
   before", then "Sat, Oct 17", each carrying its hours when recorded; an
   `MmDurationField` (two dense number fields, hours and minutes) beside a
   secondary `MmButton` "Save"; a caption counting the nights recorded and,
   when a night came from the health platform, that a typed night is used
   instead. A night read from the platform shows on its chip and fills the
   fields when picked.
2. **The sleep line on Coach** (`RecoveryCard`, stories `CoachSleepLine`,
   `CoachShortSleep` in `Coach.stories.tsx`): inside "How you are holding up",
   a `StatRow` "Sleep, last 14 nights" with the average as "6 h 50 m" and the
   nights as its detail; the section's folded line gains "Sleep 6 h 50 m over
   12 nights." No score, no colour.
3. **The offer on short sleep alone** (`ReliefOfferCard`, story
   `CoachShortSleep`): the existing notice with the title "Two weeks of short
   sleep", the one sentence the evidence supports, and the same three buttons
   (maintenance week, slow the pace, carry on).
4. **The check-in pre-fill** (`RecoveryCheckInScreen`, stories
   `RecoveryCheckIn`, `RecoveryCheckInNoNights`): typical hours of sleep as the
   same `MmDurationField`, filled from the record with a caption saying so.

Siblings (rule 9 of `design/screen-direction.md`): on Progress, `PeriodDaysCard`
(the last two weeks as chips, `apps/mobile/src/progress/PeriodDaysCard.tsx`)
for the night chips, and `WaistEntryCard` (fields beside a quiet Save with a
note under them, `apps/mobile/src/progress/WaistEntryCard.tsx`) for the entry
row. On Coach, the `StatRow`s of "Your targets" and "Body". The question every
reviewer answers first: does the new part look and behave like them, and where
it does not, is the reason written?

Does a novice understand which night a chip is, that the chip's hours are
what is recorded, and which value will be kept when a watch and a typed value
both exist? Is "Last night" with the other chips named by their morning clear?
Is the hours-and-minutes pair the right entry (the ticket asked for "the same
stepper the other entries use"; no other entry uses a stepper, so the fields
were chosen; is that right)? Is any state missing (loading, a failed read, a
night deleted)? Anything a screen reader hears wrongly (the chip's name, the
two fields' names, the Save's name "Save night")? Does the Coach line read as
a score anywhere?

## Inputs
- Stories: `apps/mobile/src/gallery/screens/Progress.stories.tsx` (the four
  sleep stories at its end), `apps/mobile/src/gallery/screens/Coach.stories.tsx`
  (the four MM-252 stories at its end), `apps/mobile/src/gallery/screens/shortSleepScenario.ts`,
  `apps/mobile/src/gallery/screens/healthPlatform.ts` (sleep added).
- Components: `apps/mobile/src/progress/SleepNightCard.tsx`,
  `apps/mobile/src/ui/MmDurationField.tsx`, `apps/mobile/src/coach/RecoveryCard.tsx`,
  `apps/mobile/src/coach/RecoveryCheckInScreen.tsx`, `apps/mobile/src/coach/ReliefOfferCard.tsx`,
  `apps/mobile/src/format/reliefOfferText.ts`, `apps/mobile/src/format/shortSleepText.ts`,
  `apps/mobile/src/format/sleepDurationText.ts`; styles in
  `apps/mobile/src/progress/progress.css` (the `.progress-sleep-*` rules) and
  `apps/mobile/src/ui/ui.css` (`.mm-duration-field`).
- Tests that say what is meant: `apps/mobile/test/progress/sleepEntry.test.tsx`,
  `apps/mobile/test/coach/sleepOnCoach.test.tsx`, `apps/mobile/test/coach/recoveryCheckIn.test.tsx`.
- Requirements: `requirements/sleep/STORY.a-night-of-sleep-recorded.MM-250.md`,
  `requirements/sleep/STORY.the-coach-reads-sleep.MM-252.md`,
  `requirements/sleep/EPIC.sleep.MM-249.md`.
- Direction: `design/screen-direction.md` (rule 9), `design/anti-cruft-and-anti-slop.md`.

## Audit mode, coverage, renders
- Mode: change. Baseline `feat/m2` at 24130ec; the working tree of `wt/sleep`,
  uncommitted at review time.
- **Depth target**, counted from the source: Progress, a person opening Sleep
  for the first time, reading the line, picking "The night before", typing 7
  and 20, pressing Save (one section header, fourteen chips, two fields, one
  Save). Coach: reading the folded line and the StatRow, and the offer's three
  buttons.
- **Render supplied**: the stories, read from source; each draws the real
  screen over the fixture stores (MM-237). **No browser capture**: this
  session has no browser automation. Say so in the walkthrough.
- Surveyed only: the Settings health rows (the Sleep row joins them through
  `HealthDataType.values`), the health step's new item (`HealthStep.tsx`,
  story `HealthCheckSleepDisorder` in `FirstRun.stories.tsx`).
- Not reviewed: the engine's thresholds (the evidence register has them), the
  native plugins, the schema.

## Existing facts, non-goals, owner decisions
- Owner (2026-10-13): sleep is first class; hours only, no score, stages or
  quality number; no diagnosis and no screening questionnaire; nothing changes
  a target on sleep alone. MM-108's words rule applies.
- Non-goals: deleting a night (a typed night replaces; nothing is removed);
  sleep on the Dashboard; a chart of nights.

## Acceptance criteria
- MM-250: "A typed night", "Imported nights", "Nothing granted".
- MM-252: "Pre-filled", "A signal of its own", "No score".

## Roles
Product designer and UX-accessibility, read-only, one round, in parallel;
each writes its report as Markdown for the chair to save under `findings/`.
Omitted, with the reason for each:
- training: omitted. No exercise or strength content in the change.
- nutrition: omitted. No energy target, macro or body-composition rule changes; the sleep signal moves no number.
- coaching: omitted. The offer's words are the one sentence the evidence rows support, graded in docs/evidence.md; the grading pass MM-249 asks for is a separate run the owner convenes.
- measurement: omitted. No estimator, trend or uncertainty change; the fourteen-night mean is arithmetic with its rows in the register.
- safety: omitted. Refer-only handling of the sleep-disorder answer (MM-251) changes no number; its grading waits for MM-29's clinician reviewer and the panel pass MM-249 asks for.

## Writer
The sleep workstream session (chair and edit owner); it saves the reports,
disposes every finding in `decision.md`, and fixes blocking findings before
finishing.

---
id: MM-432
status: done
component: adaptive-coach
related: [MM-135, MM-117, MM-31, MM-325, MM-131, MM-495]
---

# Story: Choose a one-week break instead of two

## Context
MM-135 built the diet break at two weeks, chosen or planned, on the panel's recommendation ("two weeks by default, one
selectable"). The second half was not built: the length a person chooses has to survive between the press on the Coach
screen and the check-in that issues the break's targets, and nothing stored carries it. `UserSetup` has the day a break
was chosen (`maintenanceWeekFrom`) and no length; `user_preferences` has fixed columns; a targets record's flags could
carry the length once the record exists, but the engine writes that record from the setup. A `setups` column is
unavoidable, and the schema belongs to another lane (MM-325), so MM-135 stopped this item here.

## Decisions
The product owner had not ruled on "two weeks by default, one selectable" (MM-135 records it as the panel's
recommendation, adopted for two weeks only). Built to this ticket's own description.

Choices I made without asking (say if any is wrong):
- **The length travels on the flag.** A one-week break the person chose is its own break flag,
  `requestedOneWeekBreak`, beside `requestedBreak` and `dietBreak` (`BreakFlag`); `breakLengthDays` reads the length
  from it, and `breakInForce` from the break's first record. No targets-table column: flags are stored by name, so the
  only schema change is `setups.break_weeks` (version 16). The flag has its own words ("This is the one-week break you
  chose…"), so the Coach's notice says the right length, and the explanation line stays "A break you chose to take".
- **In the same card, behind one question.** "One week instead", a text button on its own line under "Take a
  two-week break" and above "Carry on" (which keeps its own line, the panel's PD-2), opens the app's confirm dialog
  (`overlays.confirm`, as Lean gain without training does on the Coach): what a week gives up, then "Take one week" or
  "Back". Two weeks stays one tap and prominent. No new sheet or component, so no panel pass; the sibling is the
  card itself (MM-117, MM-135).
- **The words.** "One week at maintenance is still a rest from dieting, only a shorter one. Its first days go mostly
  to stored carbohydrate and water coming back, which the scale shows as a rise, and the coach waits for the scale to
  settle before it reads it again. Two weeks leave more of the rest after that." No metabolic claim (tested against
  "metabol", "reset", "recover", "repair").
- **The offer's body still says "A break is two weeks at maintenance"**: the default, and MM-135's tested words.
- **`DietBreakRule.shortBreakWeeks` = 1**, a row in `docs/evidence.md` beside `breakWeeks`, and How this works says
  "one week if you prefer".

## Description
Add `break_weeks` (1 or 2, default 2) to `setups` with a new schema version and migration step, carry it through
`UserSetup`, the setup repository contract and its fixture, and let the Coach's offer (`ReliefOfferCard`) choose the
length: two weeks as the prominent choice, one week beside it, in the same card or a sheet like the pace sheet
(`PaceSheet`). `nextTargets` and `breakInForce` read the length from the break's first record rather than
`DietBreakRule.breakWeeks`, so a break's length is the one chosen when it began; the planned break at twenty weeks stays
two weeks. A one-week break is partly consumed by the glycogen rebound and the engine's blind period (MM-131): the sheet
says so, without a metabolic claim.

## Acceptance Criteria
```gherkin
Scenario: One week chosen
  Given the break offer on the Coach screen
  When the person chooses one week
  Then targets go to maintenance at once, flagged as the break they chose, and the next check-in is seven days later

Scenario: Two weeks is the default
  When the person takes the break without choosing a length
  Then the break is two weeks

Scenario: The length survives a restart
  Given a one-week break chosen today
  When the app is closed and opened again before the check-in runs
  Then the break issued is one week

Scenario: The planned break is unchanged
  Given twenty unbroken weeks of deficit
  Then the break the app plans is two weeks whatever was chosen before
```

## UI/UX
- CoachBreakOfferOneWeek — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachBreakOfferOneWeek). The
  twelve-week offer with "One week instead" pressed: the question, "Take one week" and "Back".
- CoachOnChosenOneWeekBreak — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachOnChosenOneWeekBreak).
  The first days of a one-week break: its own notice, the next check-in a week out.

## Notes
- Built 2026-10-21. `setups.break_weeks` (1 or 2, default 2; schema version 16, migration step 15 to 16, fingerprint,
  upgrade test from version 15) carried by `UserSetup.breakWeeks` and `SqlSetupRepository`; the in-memory fixture holds
  the `UserSetup` whole; the setup contract suite has "keeps the length of the break chosen". `nextTargets` issues a
  chosen break with `setup.breakWeeks` (`TargetInputs.requestedBreakWeeks`), and `breakInForce`, `nextCheckIn`, the
  break's end and the step-limit exemption read the break's flag (`breakFlagOf`, `breakLengthDays`). The planned break
  at twenty weeks is `dietBreak`, two weeks, whatever was chosen before.
- Tests: `test/engine/reliefOffer.test.ts` ("one week chosen": issued at once, flagged, check-in a week out, held six
  days, resumed on the seventh in one step, the count restarted, reissued targets keep the length; two weeks by
  default); `test/engine/dietBreak.test.ts` (`breakInForce` and `nextCheckIn` for one week; the planned break is two
  weeks after a one-week choice); `test/coach/reliefOffer.test.tsx` (the question, taking one week, going back, the
  length surviving a restart before the check-in); `test/format/templates.test.ts` (the words); `test/data/upgrade.test.ts`
  ("a version 15 database comes up to date with breaks two weeks long"). Not run locally; CI validates. Not verified on
  a phone.
- MM-495, found on the way: a targets record marked seen lost its pace in the in-memory history.
- Needs a schema version bump (`currentSchemaVersion.ts`, `currentSchema.ts`, a migration step and its test; MM-325).
- `nextCheckIn` must read the break's own length too, or the Coach and dashboard say the wrong date.

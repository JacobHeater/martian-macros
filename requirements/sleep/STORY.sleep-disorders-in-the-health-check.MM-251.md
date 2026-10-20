---
id: MM-251
component: sleep
status: done
related: [MM-249, MM-112, MM-110, MM-29, MM-96, MM-242]
---

# Story: sleep disorders in the health check

## What is built

- **One more health-check item**, at setup and at the 90-day re-check
  (MM-112): "A diagnosed sleep disorder (sleep apnea, insomnia, a shift-work
  or other circadian disorder)". Yes or no, like the others; stored on the
  setup with the other answers.
- **The response is refer-only** until reviewed: a caution on the health
  step and in the Coach's cautions ("Sleep disorders change how a deficit
  works for you; keep your care team in the loop"), and a pointer to the
  clinician. No number changes. Treating sleep apnea as a reason to slow
  the pace, cap the deficit or change protein is for MM-29's reviewer and
  the panel to grade first (MM-249).
- **The terms of use and the claims review** (MM-242, MM-96) list the new
  item with the other condition-specific behaviours the attorney sees.

## Acceptance criteria

```gherkin
Scenario: Asked
  Given the health check at setup or at the re-check
  Then a diagnosed sleep disorder can be answered yes or no, and the answer is kept

Scenario: Refer-only
  Given the answer is yes
  Then the caution and the clinician pointer are shown
  And no target, pace, floor or protein figure differs from the same person answering no

Scenario: Wording
  Then the caution makes no claim about fat oxidation, treatment or outcome
```

## Notes

- Why no screening questionnaire: STOP-Bang and the like are validated
  for clinics, and asking them makes the app a screening tool with the
  obligations that follow (MM-242's footing). The app asks about a
  diagnosis, which the person already has or does not.

## UI/UX

- The item ticked — apps/mobile/src/gallery/screens/FirstRun.stories.tsx (Story: HealthCheckSleepDisorder). The caution under the item, at setup; the same step is the re-check (MM-112) and the health check in Settings.

## Progress (2026-10-20, feat/m2)

**Built.**
- `ScreeningAnswers.sleepDisorder`, asked in `HealthStep` as "A diagnosed sleep disorder (sleep apnea, insomnia, a shift-work or other circadian disorder)", so it is asked at setup, at the 90-day re-check and in Settings (the one step serves all three); kept in the `sleep_disorder` column of `setups` (schema version 13, with MM-250's table), mapped in `SqlSetupRepository`, and carried through the two places that rebuild the answers field by field (onboarding's female-only clearing, the profile section's sex change).
- Refer-only: `Caution.sleepDisorder` from `CoachingPolicy.derive`, worded in `cautionMessage` as "Sleep disorders change how a deficit works for you; keep your care team in the loop. The app changes none of your numbers for this."; shown as a `Notice` under the item on the health step and among the Coach's cautions. Nothing else in the policy or the targets reads the answer.
- The terms' "talk to a doctor" list names a diagnosed sleep disorder such as sleep apnea (MM-242). The evidence register has a row for `Caution.sleepDisorder` (Shechter 2016, graded emerging).

**Tests.** `test/domain/sleepDisorder.test.ts`: the answer is kept and raises the caution; the policy and the targets are the same as for the same person answering no. `test/coach/sleepOnCoach.test.tsx`: the caution on Coach, the targets unchanged. The Dart parity test for cautions filters the one added since the Flutter app.

**Decided here (say if wrong).**
- One item, yes or no, with the three kinds named in its label rather than three items: the response is the same for each and the app runs no screening.
- The caution's second sentence ("The app changes none of your numbers for this.") is added so the wording claims nothing about treatment or outcome and says plainly what the app does.
- The claims review (MM-96) list is not a file in the repository today; the caution's words are in `cautionMessage.ts` beside the others the attorney sees.

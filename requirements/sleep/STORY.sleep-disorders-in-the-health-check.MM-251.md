---
id: MM-251
component: sleep
status: proposed
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

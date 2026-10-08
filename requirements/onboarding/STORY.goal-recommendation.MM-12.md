---
id: MM-12
status: done
component: onboarding
related: [MM-9, MM-11, MM-25]
---

# Story: A recommended goal, with the reason, before you start

## Context
"Recomp" is the product's hook, but it only works reliably for some people. An app that puts a lean, experienced lifter on a recomp sets
them up for months of no visible change.

## Decisions (made with the product owner)
- **Four goals**: fat loss, recomp, lean gain, maintenance. The app is a body-composition coach, not only a recomp app.
- **Recomp is recommended only where it reliably works** (Barakat et al., 2020): people new to lifting, people returning after a layoff, and
  people carrying more body fat.

Choices I made without asking (say if any is wrong):
- **The cut-offs** (they are my rules of thumb, not thresholds from the literature):

| | men | women |
|---|---|---|
| "very high" body fat: recommend fat loss even for novices | 25% and over | 35% and over |
| "high" body fat: recomp is realistic | 20% and over | 30% and over |
| "lean": a trained lifter should gain | 15% and under | 23% and under |

- **The order of the rule**: deficit not allowed, then maintenance; very high body fat, then fat loss; novice, untrained, returning, or
  high body fat, then recomp; lean and trained, then lean gain; otherwise fat loss.
- **The user may pick any goal the health check allows.** The recommendation is the default selection and carries a "Recommended" badge.
- **Without a body-fat estimate from the user**, the rule uses the app's formula estimate.

## Description
The last onboarding screen shows a notice with the recommended goal and one sentence of reasoning, then a card per allowed goal with a short
description, then a note explaining that the first two weeks are calibration. "Start" saves the choice.

## Acceptance Criteria
```gherkin
Scenario: A novice is recommended recomp
  Given a male novice at an estimated 24% body fat
  Then Recomp is selected and marked Recommended

Scenario: Very high body fat is recommended fat loss
  Given a male novice at 28% body fat
  Then Fat loss is recommended

Scenario: A lean, trained lifter is recommended lean gain
  Given a female intermediate at 22% body fat
  Then Lean gain is recommended

Scenario: The user overrides the recommendation
  Given Recomp is recommended
  When the user selects Fat loss and taps Start
  Then the stored goal is Fat loss
```

## Notes (built and verified)
- `recommendMode` in `packages/engine/lib/src/mode_advisor.dart` (engine tests cover each branch and both sexes); the screen is `_goal` in
  the onboarding screen.
- Verified by hand on the emulator for the novice case. The override scenario is not covered by a widget test.

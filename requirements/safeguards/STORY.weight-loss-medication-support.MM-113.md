---
id: MM-113
status: in-progress
component: safeguards
related: [MM-110, MM-112, MM-114, MM-115, MM-121, MM-23, MM-29, MM-134, MM-149, MM-510]
---

# Story: Coach a user on weight-loss medication to keep their muscle

## Context
A large and growing share of people losing weight in the United States do it on a GLP-1 medication (semaglutide, tirzepatide). The drug
suppresses appetite, so the usual coaching problem is reversed: the difficulty is not eating *less* than a target but eating *enough*,
especially protein. An app that hands this user a calorie ceiling and congratulates them for coming in under it is working against them.

Evidence:
- **Moderate**: in the body-composition substudies of the main trials, lean mass was roughly a quarter to two fifths of the weight lost on
  semaglutide (about 39% in the STEP 1 DXA substudy); for tirzepatide the SURMOUNT-1 DXA substudy is recalled as a somewhat smaller share,
  about a quarter (unchecked: confirm against the primary source). Diet-only weight loss shows a broadly similar share, so the drug is not
  uniquely costly. Lean mass is not the same as muscle, and the clinical meaning is debated.
- **Emerging**: resistance training with adequate protein reduces that loss. Observational and early interventional reports are
  favorable; a randomized trial designed to test it is under way (its details are unchecked and not quoted here).
- **Judgement**: every rule below.

## Decisions
Choices I made without asking (say if any is wrong):
- **A screening answer** (MM-112): "I take a prescription weight-loss medication". Not blocking.
- **The calorie target is framed as a level to reach, not a limit.** The Food screen and dashboard say "900 so far, aiming for about
  1,900 kcal" and show progress toward it; "over" is unchanged. (Changed from "how far there is to go" after the nutrition review: with
  suppressed appetite and nausea, a distance to go reads like a task the user is failing. The owner picks; see Notes.)
- **Protein is the headline number for this user**: shown first, with its minimum (MM-121), and the protein-minimum days count is the
  first line of their weekly summary (MM-149).
- **The under-eating notice (MM-114) is stricter**: it triggers after 5 qualifying days rather than 7.
- **The app does not fight the prescriber.** If loss outruns the app's limit (MM-115) the app raises its target as usual, but the message
  says the pace is faster than the app would set, that faster loss can cost more muscle, and that it is worth raising with the prescriber.
  It does not mention a dose.
- **Training is prompted** (MM-134): with no training days set, the user is told that resistance training, with enough protein, is the
  best-supported way to keep muscle on this medication ("best-supported", not "main": the evidence is emerging).
- **The under-eating notice adds two lines** before the eating-disorder support line, when both apply: low appetite on this medication is
  common, and if the minimum is often out of reach, tell the prescriber; if food or fluids will not stay down, contact the prescriber
  promptly. Never "failure", not even negated.
- **Nothing else changes.** The expenditure estimate needs only intake and weight and works the same.

Where the experts disagreed:
- The product strategist wanted a dedicated "GLP-1 mode". The UX strategist objected that modes multiply screens and that the differences
  are four wording and threshold changes. Resolved as a screening answer with effects, like every other condition (MM-11).
- Whether to raise the protein target for these users. No trial supports a number above the general range; the panel declined to invent
  one.

## Description
A new screening field with the effects above, read by the Food screen, dashboard, weekly summary and the two safeguards named.

## Acceptance Criteria
```gherkin
Scenario: Framing
  Given the medication answer is ticked and 900 of 1,900 kcal are logged
  Then the calorie card says "900 so far, aiming for about 1,900 kcal", and protein is shown above calories
  And over the target, the usual "over" wording is shown

Scenario: Stricter under-eating notice
  Given the medication answer is ticked
  And 5 usable days in the last 14 average more than 10% below the calorie floor
  Then the under-eating notice is shown
  And it says low appetite on this medication is common and to tell the prescriber, and to contact the prescriber promptly if food or
  fluids will not stay down

Scenario: Faster than the limit
  Given trend loss above the user's limit for two weeks
  Then targets rise as MM-115 describes
  And the message suggests raising the pace with the prescriber and does not mention dose

Scenario: No training
  Given the answer is ticked and training days per week is 0
  Then the Coach screen says resistance training, with enough protein, is the best-supported way to keep muscle while losing weight on
  this medication

Scenario: Not ticked
  Given the answer is not ticked
  Then none of the above applies
```

## Notes
- Priority: should-have. It can follow the first release, but the group is large enough that it should not wait long.
- The medication also slows stomach emptying and can cause nausea; a user who cannot eat the protein minimum is not failing. The wording
  must not imply it (MM-108).
- Stopping the medication is followed by appetite returning. A user who unticks the answer is a candidate for the maintenance guidance in
  MM-130. Not specified further here.
- Leave out any guidance on stopping the medication (panel safety): it belongs to MM-130 and edges toward prescribing.

## Panel review (2026-10-21, on the draft plan)
Safety and nutrition, read-only, brief, no web research (both said their evidence points rest on memory or the ticket's grading). Not
clinical clearance.

Safety:
- No blocker to landing the rule and words unwired. Wiring needs MM-29 first, since notice wording goes through MM-29 (MM-114). Resolved:
  nothing is wired; each new string says "pending MM-29"; MM-510 waits on MM-29.
- Never fall back to `weightAffectingMedication`. Resolved: a separate `WeightLossMedicationAnswer`.
- "faster loss costs more muscle" overstates moderate, lean-mass evidence. Resolved: "can cost more muscle".
- "is not a failure" still shows the word. Resolved: removed; the line says low appetite is common and to tell the prescriber.
- Add an escalation line for food or fluids that will not stay down. Adopted, marked as the panel's unverified judgement for MM-29 to confirm.
- "the main way" is too certain for emerging evidence. Resolved: "the best-supported way, with enough protein".
- The 5 days is defensible only as judgement. Resolved: its evidence row is graded judgement, no study, and says MM-29 may change it.
- Nits: no stopping guidance (noted above); order with the eating-disorder support line (prescriber lines first, support line last);
  "over" still shown when over (tested).

Nutrition:
- The tirzepatide share was stated backwards (SURMOUNT-1 recalled as about a quarter); and say diet-only loss shows a similar share.
  Resolved in Context, marked unchecked.
- The LEAN-PREP details could not be verified. Resolved: the numbers are removed.
- The 5-day row as judgement only. Resolved.
- "About 1,000 kcal to go to about 1,900" reads like a task. Resolved: "900 so far, aiming for about 1,900 kcal"; the owner picks.
- Agreed: protein target and MM-121 minimum unchanged; no meal spacing, fibre, hydration or symptom advice without a clinician.
- Test that unticked gives the general defaults. Done.

## What is built (2026-10-21), and what is not
Built, unwired, with tests (not run locally; CI validates):
- `WeightLossMedicationAnswer` (domain); `UnderEatingRule.minimumDaysOnWeightLossMedication` = 5 and `findUnderEating`'s
  `weightLossMedication` (engine), with its evidence row; `calorieAimText`, `weightLossMedicationPaceNote`,
  `weightLossMedicationTrainingNote` and the medication lines of `underEatingText` (format).
- Tests: `apps/mobile/test/engine/underEating.test.ts` (five days on the medication, seven without) and
  `apps/mobile/test/format/weightLossMedication.test.ts` (each scenario's words, no dose, no "fail", unticked changes nothing).

Not built, and why: the question, its storage and every screen. No column can hold the answer without a schema change (held for another
pull request), and `weightAffectingMedication` is broader. A question forgotten on restart must not ship, so MM-510 stores, asks and
wires it, after MM-29 reviews the words and the 5-day rule. Protein first on Food and the weekly summary's first line are MM-510's too.

Open for the owner: the calorie card wording ("so far, aiming for about" versus "to go"). Open for MM-29: every string marked "pending
MM-29", the escalation line, and the 5 days. The tirzepatide share and the trial details need a primary-source check.

---
id: MM-112
status: done
component: safeguards
related: [MM-110, MM-11, MM-13, MM-14, MM-29, MM-83, MM-113, MM-121, MM-128, MM-147]
---

# Story: A health check that covers more, and is asked again

## Context
The health check (MM-11) is answered once. Two problems follow.

**Health changes.** A woman who becomes pregnant four months in is still on a deficit unless she erases her data, because screening
answers cannot be edited (MM-83 will allow editing, but only if she thinks to look). Pregnancy during a deficit is the single most
predictable way this app could do harm.

**The list is short.** MM-29 already names insulin-treated diabetes as missing. The panel added others where a calorie deficit or a high
protein target interacts with treatment.

Evidence: hypoglycemia risk when energy intake falls on unchanged insulin or sulfonylurea doses is **strong** and is standard clinical
guidance. Higher protein needs and greater risk from lean-mass loss in older adults are **moderate** (PROT-AGE and ESPEN position papers
recommend 1.0 to 1.2 g/kg, more with exercise). Everything about *what the app should do* in response is **judgement** and goes to MM-29.

## Decisions
Choices I made without asking (say if any is wrong):
- **New questions**, each with the app's response:

| answer | effect |
|---|---|
| diabetes treated with insulin or a sulfonylurea | not blocking; a standing caution that eating less can cause low blood sugar and doses may need changing by their clinician first; fat-loss pace limited to the gentlest setting (MM-128) until the user confirms they have spoken to their care team |
| weight-loss medication (GLP-1 and similar) | see MM-113 |
| bariatric surgery, ever | coaching targets are not issued (logging, trend and measurements still work); the reason is that post-surgical intake and protein rules are set by the surgical team and differ from everything here |
| a medication known to move weight or water (for example oral corticosteroids) | caution only; trend weight may move for reasons other than food |
| age 65 or over (from date of birth, not asked) | fat-loss pace limited to 0.5% a week; protein minimum never below 1.2 g per kg of reference weight unless kidney disease caps it; a caution about preserving muscle |

- **The check is asked again**: every 90 days, and whenever the user switches *to* a deficit goal, as one screen: "Has any of this changed?"
  with the current answers shown. Confirming with no change takes one tap.
- **Female profiles see the pregnancy and breastfeeding questions first** on that screen. Male profiles never see them (MM-14).
- **A changed answer acts immediately**: the coaching policy is re-derived and targets follow at once, not step-limited.
- **Skipping the repeat check is allowed once.** After a second skip a deficit goal pauses at maintenance until the check is answered. A
  deficit that continues unexamined is the failure being prevented.
- **The next opportunity after a skip is the next app launch.** A first skip
  does not re-prompt during the current launch. After the second skip, a
  deficit goal is moved to maintenance, and the next launch requires an answer.
- **Answers are editable in Settings at any time** (this is the part of MM-83 that concerns screening).

Where the experts disagreed:
- The behavior-change expert warned that repeated medical questions feel accusatory and cost retention. The research and safety expert
  held that an unrepeated check is not a check. Resolved as one screen, quarterly, one tap when nothing changed.
- Whether insulin-treated diabetes should block deficits outright. Blocking drives a large group to apps with no caution at all; the
  panel preferred a limit and an explicit confirmation. MM-29 decides.

## Description
`ScreeningAnswers` gains the new fields and a "last confirmed" date. `CoachingPolicy.derive` gains the effects. A re-check screen is shown
by the shell when due.

## Acceptance Criteria
```gherkin
Scenario: Pregnancy reported later
  Given a female profile on fat loss for four months
  When the repeat check is answered with Pregnant
  Then the goal becomes maintenance at once, with the clinician note, and targets rise without a step limit

Scenario: Nothing changed
  Given the repeat check is due
  When the user confirms no change
  Then it takes one tap and is not shown again for 90 days

Scenario: Switching to a deficit
  Given a user on maintenance whose last check was 40 days ago
  When they choose fat loss
  Then the check is shown before the goal is saved

Scenario: Skipped twice
  Given a user on a deficit who has skipped the repeat check twice
  Then targets are at maintenance until the check is answered

Scenario: One skip defers until next launch
  Given a user has skipped the due health check once
  Then the app remains usable for the current launch
  And the check is shown again on the next app launch

Scenario: Second skip requires an answer on the next launch
  Given a user has skipped the due health check twice
  Then the next app launch requires an answer before normal coaching resumes

Scenario: Insulin
  Given the insulin answer is ticked and not yet confirmed with a care team
  Then the fastest fat-loss pace offered is 0.5% a week and the caution is shown on the Coach screen

Scenario: Insulin care-team confirmation
  Given insulin or sulfonylurea treatment is reported
  When the user confirms discussing a deficit with their care team
  Then the insulin-specific pace limit no longer applies

Scenario: Sixty-five
  Given a 67-year-old man of 80 kg on fat loss
  Then his pace is at most 0.5% a week and his protein minimum is at least 96 g

Scenario: Crossing age sixty-five
  Given a user is 64 the day before his sixty-fifth birthday
  When the policy is derived on his birthday
  Then the 0.5% pace limit and 1.2 g/kg protein floor apply immediately

Scenario: Male profiles
  Given a male profile
  Then the repeat check shows no pregnancy or breastfeeding question

Scenario: Female profiles
  Given a female profile
  Then pregnancy and breastfeeding appear before the other health questions

Scenario: Bariatric surgery
  Given a user reports prior bariatric surgery
  Then coaching targets are not issued
  And food logging, weight trends, and measurements remain available

Scenario: Weight-affecting medication
  Given a user reports medication that can change weight or water retention
  Then a caution is shown without blocking coaching targets

Scenario: New answers in Settings
  Given a user opens the Health check from Settings
  When they change a new screening answer
  Then the answer is saved and the health policy is re-derived immediately
```

## Notes
- Priority: must-have before public release (the repeat check and pregnancy handling); the new conditions are should-haves pending MM-29.
- Open question for MM-29: other conditions (type 1 diabetes without the insulin wording, heart failure, gout with high protein, active
  cancer treatment, recent major surgery). The panel's view was that a long list gets skimmed; a final "any other condition your doctor
  treats you for" answer with a general caution may serve better than ten checkboxes.
- The age rule uses the birthday, so a user can cross it while using the app; the change is announced, not silent (MM-138).

## Implementation and verification
- Added the screening answers, age-derived policy limits, and schema v6 persistence for the new answers and repeat-check state.
- Added onboarding and Settings editing, the app-launch re-check flow, deficit-entry confirmation, skip/pause handling, Coach cautions, and bariatric target suppression.
- Verified with focused health-check, Settings, policy, migration, and target-safety tests, then `fvm dart run tool/bin/mm.dart check` (full workspace).

The age-transition explanation is part of MM-138; MM-112 derives the policy from today's date so its limits change on the birthday.

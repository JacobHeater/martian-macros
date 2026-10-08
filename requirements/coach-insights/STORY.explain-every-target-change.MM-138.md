---
id: MM-138
status: proposed
component: coach-insights
related: [MM-137, MM-23, MM-24, MM-28, MM-31, MM-33, MM-60, MM-98, MM-108, MM-115, MM-123, MM-139, MM-146]
---

# Story: Tell me when my targets change, by how much, and exactly why

## Context
See MM-137. Targets change silently at the weekly check-in (MM-24). The Coach screen shows a note "for anything unusual" (floored,
step-limited), but there is no account of an ordinary change and no notice that one happened.

Evidence that explanation matters is from behavior-change research generally (**moderate**): feedback that is specific, timely and
explains itself supports self-regulation better than outcome-only feedback, and perceived autonomy predicts adherence in weight
management (self-determination theory trials). There is no direct trial of explained against unexplained calorie targets.

## Decisions
Choices I made without asking (say if any is wrong):
- **A check-in that changes anything produces a check-in summary**, shown once on next opening the app and kept. One that changes nothing
  says so in one line on the Coach card ("Checked on Monday. No change: your estimate has not moved.").
- **The summary has four parts, always in this order**:
  1. **What changed**: "Calories 2,400 → 2,325. Protein unchanged. Carbohydrate 255 → 240 g. Fat 78 → 75 g." (Displayed with MM-123's
     rounding.)
  2. **Why, as an account that adds up**: each cause on its own line with its size.
     - "Your measured expenditure is 2,860 kcal, down from 2,950 (−90)."
     - "Your pace is unchanged at 0.75% a week (0)."
     - "Weekly changes are limited to 100 kcal; 15 kcal of the change is held for next week." (when the step limit acted)
     - or "Your calorie floor is 1,500; the target would otherwise be 1,440." (when a floor acted)
  3. **What it was based on**: days of food used, days left out as partial, weigh-ins, and the confidence level (MM-139).
  4. **What would change it**: one sentence. "If your weight trend flattens for two more weeks at this intake, expect another small
     decrease." Or "More complete days would make this estimate firmer."
- **The parts in 2 must sum to the change shown in 1.** If they cannot be made to, the summary says "and N kcal from rounding and
  limits" and the test in the acceptance criteria bounds N.
- **Changes that are not from a check-in get the same treatment**: goal change, pace change, a safety raise (MM-115), a diet break, a
  screening change, a profile correction, a rule change in an app update. Each names its cause first.
- **A target history screen** lists every target the user has had, newest first, each opening its summary. It reads from the stored
  targets history (MM-60), which must therefore store the reasons, not only the numbers.
- **No reduction is ever described as a consequence of the user's behavior** ("because you went over"). The engine does not work that way
  (it estimates expenditure, it does not punish intake), and the wording must not suggest it.
- **The user may hold a reduction once.** On a summary that lowers calories, "Keep last week's targets for now" defers the change by one
  check-in. It cannot be used twice running, and it does not apply to increases or safety changes.

Where the experts disagreed:
- On the hold. The engineer: it lets users veto the feedback loop. The behavior-change expert: a single deferral costs one week and buys
  the sense that the coach is negotiable, which is what keeps people following it. The bodybuilding coach sided with autonomy: a good
  coach explains and then asks. Included, bounded as above. This is the choice most worth the product owner's attention.
- On detail. The UX strategist wanted one sentence by default with the breakdown behind a tap; the analytical-user advocate wanted it all
  visible. Resolved as: part 1 and the largest line of part 2 shown; the rest one tap away.

## Description
`nextTargets` returns a structured explanation (a list of signed contributions with reason codes and the inputs used) alongside the
targets; it is persisted with the targets record; a summary sheet, a line on the Coach card and dashboard (MM-98), and a history screen
render it.

## Acceptance Criteria
```gherkin
Scenario: An ordinary change
  Given a check-in that lowers calories from 2,400 to 2,325 because the expenditure estimate fell by 90 kcal and the step limit held 15
  Then the summary shows the old and new targets, a line for the estimate (−90), a line for the step limit (+15), and what it was based on

Scenario: It adds up
  Given any check-in in a 16-week simulated run
  Then the listed contributions sum to the change in calories to within 5 kcal

Scenario: No change
  Given a check-in that changes nothing
  Then the Coach card says it checked, when, and why nothing changed

Scenario: Held for lack of data
  Given three weeks with no food logged
  Then the Coach card says targets are unchanged because there is not enough data, and what is needed

Scenario: A floor
  Given the target is held up by the calorie floor
  Then the summary names the floor and what the target would otherwise have been

Scenario: History
  Given six target records
  Then the history lists six entries, and each opens the reasons it was issued with

Scenario: Holding a reduction
  Given a summary lowering calories by 75 kcal
  When the user chooses to keep last week's targets
  Then the targets are unchanged this week
  And the option is not offered at the next check-in

Scenario: Not offered on a raise
  Given a summary raising calories
  Then no hold option is shown

Scenario: Never blame
  Then no explanation attributes a change to a specific day's eating
```

## Notes
- Priority: must-have before the first real user reaches day 14.
- Needs a schema change to store explanations with targets (MM-61). Existing records get a "no explanation recorded" reason.
- The weekly short version promised in MM-33 is this summary; that ticket should reuse it.
- A notification that a summary is ready is covered by MM-146.

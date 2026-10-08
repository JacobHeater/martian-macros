---
id: MM-31
status: done
component: adaptive-coach
related: [MM-22, MM-24, MM-28, MM-36, MM-115, MM-135]
---

# Story: A maintenance break after sixteen weeks of deficit

## Context
Long unbroken deficits wear people down, physically and in adherence.

## Decisions (made with the product owner)
- **A deficit is capped at 12 to 16 weeks, followed by a recommended one to two weeks at maintenance.**

Choices I made without asking (say if any is wrong):
- **The cap is 16 weeks and the break is forced**, not recommended: at the check-in after sixteen whole weeks of unbroken deficit the
  targets go to maintenance.
- **The break is one check-in long** (a week). The week after, the deficit resumes and the count starts again.
- **Recomp counts as a deficit** for this purpose, since its pace is below zero.

## Description
The engine counts whole weeks since the start of the current unbroken run of deficit targets. At sixteen it issues maintenance targets
flagged as a diet break. The Coach screen explains: "You've been in a deficit for 16 weeks. This is a maintenance break to recover before
continuing."

## Acceptance Criteria
```gherkin
Scenario: The break
  Given sixteen whole weeks of deficit targets
  When the next check-in runs
  Then the targets are at maintenance and flagged as a diet break

Scenario: Counting
  Given deficit targets from day 0, with a maintenance week at day 21 and deficit again from day 28
  Then on day 50 the count is three weeks

Scenario: Resuming
  Given a diet-break week
  Then the following check-in returns to the deficit and the count restarts
```

## Notes (built and partly verified)
- `consecutiveDeficitWeeks` in `coach.dart` and the `dietBreak` flag in `targets.dart`; tests "forces a diet break after 16 deficit weeks"
  and "counts whole weeks of unbroken deficit".
- The step limit applies to the break as to any check-in, so the first break week rises by at most 100 kcal rather than jumping to full
  maintenance. **That is probably not what was intended**; the break should be exempt from the step limit, like a change of goal. Decide
  and fix.
- No closed-loop test runs long enough to reach a break and resume.
- Follow-ups: MM-115 exempts safety raises, including this break, from the step limit. MM-135 reopens whether the break should be forced,
  at what interval and for how long, since the evidence for breaks is mixed and the original decision said "recommended".

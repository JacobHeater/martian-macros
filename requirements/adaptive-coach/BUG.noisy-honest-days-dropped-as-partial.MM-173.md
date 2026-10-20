---
id: MM-173
status: done
component: adaptive-coach
related: [MM-27, MM-150, MM-23, MM-30, MM-149, MM-114]
---

# Bug: Honest low days from a noisy logger are dropped as partial, and the estimate drifts high

## Context
An unmarked day is treated as partial when it is below 65% of the window's 75th-percentile intake (MM-27). The rule exists to stop a
half-logged day being read as a fast. It cannot tell a half-logged day from an honestly logged day that happened to come out low.

For someone whose days are logged from estimates (MM-150), day totals are noisy. The simulator shows what follows:

| day-to-day noise in the logged total | bias of the expenditure estimate |
|---|---|
| 20% (a day of several estimated meals) | none to speak of |
| 30% | about 160 kcal high |
| 40% | about 205 kcal high |

The low days are dropped, the high days are kept, the average intake reads high, and so does expenditure. The target then sits above
what it should be, which slows a cut and looks to the user like a stall.

Found while adding the simulated user MM-150 asked for. It was written up as "a finding" in that ticket and not filed as a bug. It is one.

## Decisions
**Option 2, taken 2026-10-19 under the owner's instruction to close the beta's tickets** (the ticket's own recommendation; the owner may
overrule it, the rule being one function). The threshold widens with the window's own spread, read from its top alone, so a noisy but
honest logger keeps their low days while a steady logger's half day is still caught. Both simulated users hold: the noisy one's bias is
under 100 kcal, the partial logger's stays above -150 kcal. The options were:

1. **Leave it, and rely on the user marking days complete.** A day marked complete is always used. This is the current behaviour; it
   helps only those who mark their days.
2. **Widen the threshold as the window's own noise grows**: judge "far below typical" against the spread of the window, not a fixed 65%.
   A noisy but honest logger keeps their low days; a steady logger's half-day is still caught. More to test.
3. **Do not apply the rule to days that are mostly estimates.** Simple, but a half-logged day of estimates is as possible as any other.
4. **Keep the rule and correct the bias it introduces** when days are dropped. Hard to do honestly.

Recommendation: option 2, tested against both simulated users (the partial logger of MM-27 and the noisy one here), so that neither
regresses.

## Description
`usableIntakeDays` in the engine (shared by the estimator, the adherence summary and the under-eating notice).

## Acceptance Criteria
```gherkin
Scenario: A noisy, honest logger
  Given simulated users whose logged day totals are unbiased with 30% day-to-day noise
  Then the expenditure estimate's bias is under 100 kcal

Scenario: The original protection holds
  Given simulated users who partly log 35% of days without marking them
  Then the estimate's bias stays above -150 kcal
```

## Notes
- Regression test: `packages/engine/test/tdee_estimator_test.dart`, "stays unbiased when a noisy logger has days 30% apart (MM-173)".
  It is written to the first scenario and **skipped**, naming this ticket, because it fails today (about 160 kcal). It is to be
  un-skipped by the change that fixes this. The 20% case beside it runs and passes.
- The same rule now decides which days the adherence summary and the under-eating notice count, so the fix touches three things.

## Fix (2026-10-19)
`usableIntakeDays` keeps the fixed rule (65% of the 75th percentile) and lowers the threshold when the window's top is wide: the
spread is read as a standard deviation from the 90th percentile against the 75th (0.607 sigma apart for a normal spread), the middle
as the 75th less 0.674 sigma, and the threshold is the lower of the fixed one and the middle less 2.5 sigma, with at least seven
candidate days. Half-logged days sit below the median, so a third of them move neither the 75th nor the 90th percentile, which is
why the first attempt (the median against the 75th) regressed MM-27 to -161 kcal and this one does not. Regression test:
`apps/mobile/test/engine/tdeeEstimator.test.ts`, "stays unbiased when a noisy logger has days 30% apart (MM-173)", now running
beside "excludes unmarked partial days instead of reading them as fasting" (MM-27); the adherence summary and the under-eating notice
share the rule and their tests pass.

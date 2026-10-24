---
id: MM-605
status: proposed
component: coach-insights
related: [MM-604, MM-141, MM-139, MM-341, MM-124, MM-606, MM-609, MM-610, MM-612]
---

# Story: One trend engine for every signal

## Context
Today every pattern rule looks at one fixed 14-day window and answers yes or no (`InsightRationing.patternDays`,
`findInsights.ts`). Rules have no margin for what is worth saying and no notion of a change or a run. The insight log stores only
`rule`, `shownOn` and `dismissedOn`, so the coach cannot tell a new trend from a continuing, resolved or reversed one. Two
existing rules state patterns that are not there (MM-614, MM-615).

The owner wants the coach to say "whatever trends are discernible from the data" (MM-604). The measurement panel proposed the
method on 2026-10-24.

## Decisions
Choices made without asking (from the measurement panel; say if any is wrong):
- **Every claim passes two gates:** statistical evidence, and an effect at least the signal's materiality margin δ. The domain
  stories set δ for each signal.
- **Spread** is σ = 1.4826 × MAD of the baseline's eligible values. It is floored at the larger of the signal's floor and the
  median of `relativeSigma` × value, so a very regular logger does not fire on trivial changes.
- **Six detectors on four primitives:**

| | Detector | Fires when |
|---|---|---|
| D1 | Level against target, one-sided sign test | n ≥ 7 eligible days, off-days ≥ k_crit(n) at α 0.05 (exact binomial, p 0.5), and the median deviation is beyond δ |
| D2 | Drift: Theil–Sen slope with Mann–Kendall, n shrunk by lag-1 autocorrelation (uncertain) | regime ≥ 21 days with ≥ 12 eligible days, ≥ 3 in each third; \|Z\| ≥ 2.33 (uncertain); \|slope × span\| ≥ δ |
| D3 | Change point: scan the split with prefix sums on values winsorised at ±3σ; recurse once and keep the most recent | ≥ 7 eligible days before and ≥ 5 after; max T ≥ 3.5 (uncertain); \|difference\| ≥ δ |
| D4 | Runs ending yesterday or the day before | (a) ≥ 7 days each beyond δ on one side of target; (b) ≥ 4 days each beyond baseline median ± 1σ in one direction, run mean beyond δ, baseline ≥ 14 eligible days in the prior 28. One ineligible day may sit inside a run; a second breaks it |
| D5 | Day of week, paired within the week (value minus the median of the week's other eligible days) | weekend: ≥ 3 weeks all beyond δ the same way, or ≥ 5 weeks with ≥ 80% agreeing; one weekday: ≥ 4 weeks beyond max(δ, σ), or 5 of 6; unlogged weekday: ≥ 3 of the last 4 weeks, each with ≥ 5 logged days. Last 56 days |
| D6 | Recent against baseline: D3's statistic at the fixed split last 7 against the 28 before | ≥ 5 recent and ≥ 14 baseline eligible days; T ≥ 2.5 (uncertain); \|difference\| ≥ δ |

- **The span is the one chosen on the switcher** (7d, 14d, 30d or 90d, MM-610), ending yesterday. Within it, change points mark
  the current regime, rather than a search for the longest span where a claim holds, which would inflate false positives.
  - Forced boundaries: a target change (`TargetsRecord.effectiveFrom`), a logging-style switch (`TdeeEstimator.styleSwitch`,
    extracted and shared) and the weight settling window.
  - State claims (D1, D2, D5) use the current regime within the span.
  - Event claims (D3, D4, D6) report the most recent change within the span.
  - A detector whose minimum the span cannot meet does not run: D2 needs 21 days, D5 needs 3 weeks, D6 needs 7 plus 14 days.
  - Baselines for D4(b) and D6 may reach up to 28 days before the span.
- **Eligible days:**
  - Intake uses `usableIntakeDays`. A partial day is ineligible for every intake signal, ratios included.
  - Unlogged is never zero. Eligible days must be ≥ 60% of the span's calendar days. Between 60% and 80%, the sentence says "on
    the days you logged" and strength drops a tier.
  - More than a third of eligible days with `estimatedShare` > 0.5 drops a tier. More than half withholds size claims, and the
    data-quality signal speaks instead.
  - A shift within 3 days of a logging-style switch is a data-quality finding, not an eating change.
  - A Refeed or Day off (MM-611) is eligible for trends, and is counted and named in the evidence.
- **Today is never read.** Evaluation is as of yesterday (E).
- **Weight and waist keep their own models** (`WeightTrendModel`, `waistChangeOf`). Weight drift fires on |slope| / √variance ≥ 2
  over ≥ 14 days with ≥ 8 weigh-ins (uncertain). `MeasuredChange` is every detector's direction type.
- **Strength in words:** silent, clear or strong.
  - Strong is α ≤ 0.005 (or 1.5× the D3/D6 threshold), n ≥ 14, coverage ≥ 80% and estimate-heavy days ≤ a third.
  - Clear reads "most days", "lately", "has been". Strong reads "nearly every day", "steadily", "since 12 Oct".
  - Counts, not probabilities: "on 11 of the 14 days you logged". Spans are rounded in words.
  - A claim whose rounded effect falls below δ is not shown, and no signed zero (MM-341).
- **De-duplication**, one finding per key (signal, aspect):
  - The aspects are level (D1, D3, D4, D6), drift (D2) and weekday (D5).
  - Within level, precedence is shift > recent against baseline > short run > long run > level against target. A level claim and a
    shift that agree merge. One that is "still under target but improving since 12 Oct" reports the improvement with the target
    as context.
  - A shift beats a drift on the same signal.
  - Correlated families (MM-606) keep their top finding per direction, with the others attached as supporting figures.
  - Data quality over the same span suppresses size claims.
- **Ranking**, lexicographic:
  1. priority class (safety, data quality, coaching, pattern, education);
  2. transition (reversed > new > resolved good news > continuing);
  3. actionable;
  4. tier;
  5. min(\|effect\| / δ, 3);
  6. most recent onset;
  7. catalog order.
- **State machine**, one per key:
  - States: Quiet, Pending, Reported(direction), Held, Resolved, with Dismissed as an overlay.
  - **New** needs detection as of E and E−1. Strong reports at once.
  - **Continuing** updates the figures silently. It is re-announced only if the tier rises or the effect grows ≥ 50%, at most every
    14 days (uncertain).
  - **Reversed** needs the opposite direction as of E and E−1.
  - **Held:** data falls below the minimums. Missing data never makes a trend resolved. Held goes quiet after 21 days.
  - **Resolved:** the exit threshold holds as of E, E−1 and E−2. The exit threshold is half the entry statistic, or the effect
    under δ/2. It is announced once, and only where the signal marks resolution as good news. Within 28 days the same direction
    is "back again".
  - A shift becomes a plain level claim after 28 days.
- **Only what was said is persisted:** an append-only announcement log,
  `{key, transition, on, direction, onsetDate, figures, tier, rulesVersion}`, plus dismissals. Pending, Held and the exit counts
  are derived by evaluating as of E, E−1 and E−2. A rules-version change does not re-announce a continuing trend.
- **False-alarm budget:** a stationary simulated user sees at most one false "new" trend in 30 days. Every uncertain threshold is
  tuned to meet it.

## Description
A pure engine module: series and eligibility in, findings and transitions out, with no clock and no storage inside it. Each signal
in MM-606 and MM-609 is a definition: series, eligibility, δ, σ floor, family, safety class, which direction is good, and whether
resolution is good news. A repository for the announcement log, with its SQL implementation, in-memory fixture, contract suite and
migration. A null-simulation harness over the existing simulated users.

`findInsights`' rules move onto these definitions. `InsightRationing`'s window and basis become per-detector minimums. Its daily
and weekly ration stays for the Dashboard card only (MM-610).

## Acceptance Criteria
```gherkin
Scenario: No false trends from noise
  Given 200 stationary simulated users over 180 days
  Then the mean count of "new" announcements is at most one per user per 30 days

Scenario: A random logger has no weekday habit
  Given a simulated user who leaves 2 random days a week unlogged
  Then an unlogged-weekday finding appears in at most 2% of evaluations

Scenario: A step is a dated shift
  Given intake steady for 28 days, then 1.5σ and at least δ higher for 10 days
  Then the finding is a shift dated within 2 days of the step, not a drift

Scenario: A logging-style switch is not an eating change
  Given the person switches from weighing to hand portions and intake steps up within 3 days
  Then a data-quality finding is produced and no intake shift

Scenario: Missing data does not resolve
  Given a reported trend
  When the person stops logging for 10 days
  Then the finding is held, and "resolved" is never announced

Scenario: Back-fill does not flicker
  Given yesterday is half logged and a run would end on it
  When the day is completed the next morning and the run no longer holds
  Then nothing was announced, because new needs two evaluations

Scenario: A target change starts a new span
  Given protein targets rise on 10 Oct
  Then level-against-target claims for protein count only days from 10 Oct

Scenario: Edits do not re-announce
  Given a continuing trend
  When an entry five days ago is edited
  Then the figures update and no new announcement is made

Scenario: Rounding never says zero
  Given an effect that rounds below δ
  Then no finding is shown

Scenario: Today is never read
  Given entries logged today
  Then no detector's result changes until tomorrow

Scenario: Filters run first
  Given an eating-disorder history or hidden weight
  Then findings those rules hide are removed before ranking, and do not displace others
```

## Notes
- Cost is under a million arithmetic operations per evaluation for 20 signals: Theil–Sen is O(n²) at n ≤ 90, the D3 scan O(n).
- Sources (measurement panel, accessed 2026-10-24):
  - Nelson 1984 (run rules);
  - Killick et al. 2012 (PELT; binary segmentation chosen for simplicity at n ≤ 90);
  - Hamed & Rao 1998 (autocorrelation correction; formula not verified);
  - Basiotis et al. 1987 (about 31 days for an individual's energy intake to within 10%, which is why claims are change-relative
    and gated on δ);
  - Gigerenzer & Hoffrage 1995 (natural frequencies).
- MM-139's coach confidence and this engine's tiers are separate: confidence is about the targets, tiers about one finding.

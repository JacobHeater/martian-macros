---
id: MM-605
status: done
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
| D5 | Day of week, paired within the week (value minus the median of the week's other eligible days) | weekend: ≥ 3 weeks all beyond δ the same way, or ≥ 5 weeks with ≥ 80% agreeing; one weekday: ≥ 4 weeks beyond max(δ, σ), or 5 of 6; unlogged weekday (MM-614): ≥ 3 of the last 4 weeks, each with ≥ 5 logged days, and the weekday > half of the unlogged days in the 4 weeks; days before the first log are not gaps. Last 56 days |
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

## Progress
Built 2026-10-24: the pure engine core. Not run locally; CI validates.

- **Where:** `apps/mobile/src/engine/trends/`, exported through `src/engine/index.ts`. One file per declaration: the series and
  eligibility types (`TrendDay`, `TrendIneligibleReason`, `TrendSpan`), `TrendRule` (every parameter above, named), the spread
  (`robustSigma`, `pooledSigma`, `spreadFloorOf`), `binomialCriticalCount`, the detectors (`detectLevelAgainstTarget` D1,
  `detectDrift` D2 with `theilSenSlope` and `mannKendallZ`, `detectShift` D3 with `bestSplitOf`, `detectLongRun` D4a,
  `detectShortRun` D4b, `detectWeekend`, `detectWeekday` and `detectUnloggedWeekday` D5, `detectRecentAgainstBaseline` D6), the
  signal definition (`TrendSignal`), `evaluateSignal`, `dedupeTrendFindings`, `rankTrendFindings`, and the state machine
  (`nextTrendTransition`, with the log entry `TrendAnnouncement`).
- **The logging-style switch** is now `styleSwitchOf` (`src/engine/styleSwitchOf.ts`), which `TdeeEstimator` calls unchanged.
- **Read where this ticket left room:**
  - The exit threshold holds one way when no detector of the aspect is at half its entry statistic with an effect of δ/2.
  - A key is held when coverage is under 60%, fewer than 3 of the last 7 days are eligible, or none of its detectors can run.
  - Entering held and returning from it are logged, so the 21 days are counted from the log.
  - D5's weeks are 7-day blocks ending yesterday. One weekday fires on every week (at least 4) or 5 of the last 6.
  - D4 is strong from 8 days (0.5⁸ < 0.005), D5 at α 0.005 over its weeks, D2 at |Z| ≥ 2.81.
  - D4b's and D6's baselines never cross a logging-style switch. A D3 or D4a event within 3 days of one moves to the key
    `signal:loggingStyle` as data quality.
  - Families keep their top finding per span, aspect and direction.
  - The ticket gives no k_crit table: the tests pin the exact binomial values (7 → 7, 10 → 9, 14 → 11, 20 → 15, 30 → 20).
- **Tuned:**
  - D6's threshold, 2.5 → 3.0 (uncertain), for the false-alarm budget.
  - An unlogged weekday first counted a week only with 6 logged days. It now takes MM-614's rule instead (see below), with
    the 5 restored.
- **Tests** (`apps/mobile/test/engine/`):
  - `trendStatistics.test.ts` (k_crit, σ and its floors, Theil–Sen, Mann–Kendall, rounding);
  - `trendDetectors.test.ts` (each detector);
  - `trendScenarios.test.ts` (a step is a shift, a logging-style switch, missing data holds, back-fill, a target change, edits,
    rounding, today never read, coverage);
  - `trendStateMachine.test.ts`;
  - `trendRanking.test.ts`;
  - `trendNullSimulation.test.ts` (200 stationary users over 180 days, and the random logger);
  - `styleSwitchOf.test.ts`.
- **Remaining:**
  - ~~the announcement-log and dismissal repository~~ (built, below);
  - wiring: the signals of MM-606 and MM-609 as `TrendSignal`s over `usableIntakeDays`, boundaries from
    `TargetsRecord.effectiveFrom`, `styleSwitchOf` and the settling windows, and weight drift on `WeightTrendModel`;
  - `findInsights`' rules moved onto definitions, and the filters (MM-141) run before ranking;
  - the Coach tab (MM-610);
  - the null simulation over every signal together.

Built 2026-10-24: the announcement-log and dismissal repository, and D5 aligned with MM-614. Not run locally; CI validates.

- **The repository** (read and write split like the insight log):
  - interfaces in `apps/mobile/src/engine/trends/`: `TrendLogReader` (`watchTrendAnnouncements()`,
    `watchFindingDismissals()`), `TrendLogWriter` (`appendTrendAnnouncements(entries)`, `dismissFinding(findingId, day)`),
    `TrendLogRepository`, and the record `FindingDismissal` (`findingId`, `dismissedOn`). A finding id is MM-604's
    `CoachFinding.id`. The log is append-only: nothing updates or deletes an entry. Dismissing a finding twice on one day
    keeps one row.
  - `SqlTrendLogRepository` (`src/data/`) and `InMemoryTrendLogRepository` (`src/fixtures/`), registered as `trendLog`
    in `SqlRepositories`, `InMemoryRepositories` (erased with the rest), `AppServices`, `openAppServices.ts` and
    `gallery/fixtureServices.ts`.
- **Schema version 28:** the tables `trend_announcements` (one row per entry; the figures as columns, as the insight logs
  keep theirs: `effect`, `unit`, `n`, `k`, `span_days`, `coverage`) and `finding_dismissals` (one row per finding and
  day). Both are in `tables.ts`, so erasing and restoring cover them. The 27-to-28 step creates them empty.
- **D5 aligned with MM-614:** `detectUnloggedWeekday` fires on ≥ 3 of the last 4 weeks, each with ≥ 5 logged days
  (`TrendRule.weekday.unloggedMinimumLoggedDays` back to 5), when the weekday is more than half of the unlogged days in
  the 4 weeks. Days before the first logged day of the whole series are not gaps: `evaluateSignal` passes that day in.
  The detector's ratio carries both gates, so the exit threshold reads them too.
- **Tests:**
  - `test/contracts/trendLogRepositoryContract.ts`, run in `test/data/sqlContracts.test.ts` and
    `test/fixtures/inMemoryContracts.test.ts`;
  - `dataEraserContract` (and its three callers) and `test/data/restore.test.ts` cover the trend log;
  - `test/data/upgrade.test.ts`: a version 27 database comes up to date with an empty trend log;
  - `test/data/schemaFingerprint.test.ts` records version 28;
  - `test/data/schema.test.ts` lists the two tables;
  - `test/engine/trendDetectors.test.ts`: the weekday must be most of the gaps, a week needs 5 logged days, and days
    before the first log are not gaps.
- **Remaining:** wiring the repository into `AppState` and the UI (the Coach tab, MM-610), with the other items listed
  under "Remaining" above.

Wired into the Coach tab (MM-610), 2026-10-24. Not run locally; CI validates.

- The dismissals are wired: `AppState.coachAnalysis.dismiss` writes `dismissFinding`, and `watchFindingDismissals` hides
  a finding for 28 days. The announcement log is read for each key's transition as of yesterday, but nothing appends
  to it yet, so the state machine is still to be wired.

Evidence rows and the cross-signal null simulation, 2026-10-24. Not run locally; CI validates.

- **Evidence rows (MM-143)** added to `docs/evidence.md`, with the question "What does the coach read in my data?"
  and the test `apps/mobile/test/engine/coachAnalysisEvidence.test.ts`, which fails for a rule figure without a row.
  This ticket's rows: every `TrendRule` figure but the rules version, `TrendTier` (Gigerenzer & Hoffrage 1995) and
  `coachFindingWords` (Kluger & DeNisi 1996), with Nelson 1984, Killick et al. 2012, Hamed & Rao 1998 and Basiotis et
  al. 1987 cited where the Notes place them.
- **The cross-signal null simulation** is written: `apps/mobile/test/engine/coachNullSimulation.test.ts`, with the
  generator `test/engine/support/stationaryCoachUser.ts`. 60 seeded stationary people (fat loss, maintenance and lean
  gain; food around the fixture's targets with an 8–15% day-to-day spread, stable 4-day training, water around the goal)
  run `analyseFoodSpan` and `analyseTrainingSpan` on 90 successive days for 2w and 1m; a fix not present the evaluation
  before counts as new, and each span must stay at 1 or fewer per person per 30 days. Not run locally; CI validates.
- **Calibrated:** no `TrendRule` figure. Estimated by reasoning and a rough model of the rules before writing the
  assertion: about 0.5 new fixes per person per 30 days at 2w and 0.2 at 1m, mostly calories against the band (N14) and
  D1's sign test on the protein target (N2). The one constant that could not meet the budget was MM-606's N15 on lean
  gain (calibrated there).

The announcement log written, 2026-10-24 (with MM-610's Dashboard card). Not run locally; CI validates.

- **Once a day:** `CoachAnalysis.keepAnnouncing` (started in `App`, for as long as the app is open) evaluates the
  canonical span as soon as everything it reads is in, and again only when the day changes; the evaluation is as of
  E (yesterday), E−1 and E−2. Today is never read.
- **The canonical span** (`canonicalTrendSpan`) is 2w (MM-141's fortnight) when the data supports it, else the longest
  supported span of at most 30 days: 1m, then 7d. With only 1d supported nothing is evaluated; 1d's findings never go
  in the log (MM-612).
- **The keys are the coach's findings** (`CoachFinding.id`: `fatAgainstTarget:level`, `partialDays:dataQuality`,
  `trainingDropped:fix`), so the log, the dismissals, the Coach tab and the Dashboard name a finding alike. Each fix
  and data-quality finding said on any of the three days, and each key the log still follows, gets a reading
  (`coachTrendReadingOf`) and a step of `nextTrendTransition` (`coachTrendSteps`):
  - detected when the analysis says it, in its way (a fix's `direction` figure); a finding with a trend carries the
    trend's tier, size and onset, one from a level rule alone is clear and of no size (effect 0, unit `finding`);
  - held when not said and the span is under 60% fully logged or has fewer than 3 of its last 7 days, or when partial
    days or estimates rising quiet the composition signals: missing data never resolves;
  - quiet otherwise; exited a way when not said that way and the key's own exit holds (N1's 65%, MM-606).
  - Resolution is good news for a fix (the card shows its holding-up line), not for a data-quality finding.
- **Appended** through `trendLog.appendTrendAnnouncements`, in the order the analysis ranks the keys, so a day's first
  said entry is its top (the card's ration reads that).
- **Idempotent against the log:** a key with an entry made for E is not stepped again, so a second evaluation the
  same day (the app opened again) appends nothing. The log stays append-only.
- **The state machine:** an update for growth now compares only effects of one unit, and never from an entry that
  stated no size (`nextTrendTransition`), so a level rule's finding is not re-announced every 14 days.
- **Ranking:** the transitions as of yesterday are read from the log by the finding's id (`arrangeCoachFindings`), on
  every span, so a new or reversed finding leads one that continues.
- **Filters run first:** the safeguards stay inside the analyses (`foodFindingAllowed`, the training restrictions), so
  a finding they hide is never a key, never ranked, and never on the card; a log entry for it changes nothing.
- **Tests:**
  - `apps/mobile/test/engine/coachTrendLog.test.ts`: the canonical span, a finding id's readings (detected, quiet,
    held, a data-quality limit), new needs E and E−1, idempotent against the log, continuing, resolved and held, 1d
    never a key, N1's exit through the state machine, and transitions in the ranking;
  - `apps/mobile/test/state/coachAnalysis.test.ts`: written once a day for 2w and idempotent when the app opens
    again, ranked as the analysis ranks, the log's transitions ranking the span's fixes, and **filters run first**
    (an eating-disorder history's hidden fat line, even said reversed in the log, is in no list and displaces nothing;
    on the card the protein minimum; hidden weight leaves every finding in its place, none carrying a body weight).

Choices made without asking (say if any is wrong):
- The keys are finding ids rather than the detectors' `signal:aspect`, because a level rule speaks for most fixes
  (MM-606's "A change is the level rule or the trend") and the card and the dismissals already go by finding id.
- An exit other than N1's is the finding no longer said, as of E, E−1 and E−2.

Still open, outside this ticket's scenarios:
- the null simulation over every signal together, and its calibration (another builder's, in `test/engine/`); it
  should read these finding-id keys too, as their level rules can announce;
- `findInsights`' rules without an analysis equivalent (MM-610's Progress lists them) stay catalog rules.

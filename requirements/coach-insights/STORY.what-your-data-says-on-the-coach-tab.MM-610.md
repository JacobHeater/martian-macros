---
id: MM-610
status: done
component: coach-insights
related: [MM-604, MM-605, MM-606, MM-607, MM-609, MM-612, MM-141, MM-256, MM-363, MM-364, MM-108, MM-92, MM-118]
---

# Story: "What your data says" on the Coach tab

## Context
The Coach tab has no analysis section (MM-604). The pattern insights reach only the Dashboard, one at a time, and are lost when
dismissed. On 2026-10-24 the owner chose:
- the Coach tab shows every finding, ranked;
- the voice is factual ("calorie-dense for its protein", not "too calorie-dense");
- single days are in (MM-612).

The coaching panel proposed the layout and the sentence rules.

## Decisions
By the product owner, 2026-10-24: everything, ranked; factual voice.

Choices made without asking (from the coaching panel; say if any is wrong):
- **Position:** one section, "What your data says" (renamed "Coach's feedback" by MM-620), directly under "One thing to do" and above "Your targets". The safeguards
  (pause, under-eating, training lapse, relief offer) stay above it and outrank it. While the under-eating finding holds, the
  section opens by pointing to that notice.
- **The span switcher (the owner's design, 2026-10-24):**
  - The analysis opens on **1d** (today, MM-612), with an `MmSegmented` switcher `1d | 7d | 2w | 1m | 3m` like Progress's 30d and
    90d.
  - A span appears in the switcher only when the data supports it: the days since the first entry reach the span, and its days
    meet MM-605's coverage rule (≥ 60% eligible). The switcher itself appears only when 7d does (MM-620: once any span past 1d does).
  - The tab opens on 1d each time.
  - 7d to 3m run MM-605's detectors over that span, through yesterday. A change inside the span is dated ("since 12 Oct").
- **Layout, top to bottom:**
  1. **The switcher**, when shown.
  2. **Period line:** for 1d "Today so far"; for a span "7 days through yesterday · 6 fully logged".
  3. **Headline:** one sentence pairing the top strength with the top fix ("Protein and training are holding up; fiber is the gap,
     about 12 g a day under the guide"). Left out when either side is empty.
  4. **Worth changing:** up to 3, ranked by MM-605. A data-quality finding that limits the rest comes first.
  5. **Holding up:** up to 3. Shown only when a rule finds one; never padded to match.
  6. **"N more from your data"**, folded: every other finding, nothing true hidden. Then "1 hidden · shows again 14 Nov" for
     dismissed findings.
  7. **"Not enough data in this span":** one row per area the chosen span cannot judge ("Training · needs 4 weeks").
- **Empty states:**
  - Nothing logged yet: "Log a food and the coach reads it here."
  - Nothing found: "Nothing stands out", followed by the areas that were checked.
- **Each finding:**
  - a title in numbers, 8 words or fewer;
  - observation (figure, reference, days counted);
  - why it matters (one clause, backed by its evidence register row);
  - what to do (one add or one trade, both sides' numbers; left out when the honest answer is "worth knowing").
  - "The numbers behind this" (`MmDisclosure` with `StatRow`, as in the confidence section) shows: the span; days counted and left
    out, with why; each figure against its reference; up to 3 contributing foods; the tier in words; the rule's name.
- **Stability:** a finding that still holds keeps its place, and its figures update. It moves only when MM-605's ranking changes
  class or transition, so the list does not reshuffle daily.
- **No commitments:** no "try this for a week", no "did you?", no tracking of whether advice was taken. A fix that closes can
  return once as holding up, stating the change.
- **Recomputed on opening the tab and whenever a log changes.** No stale cache.
- **Dashboard:** its insight card shows the top finding from the same engine under MM-141's ration, and opens this section.
  Dismissing it there dismisses it here.
- **Sentence rules:**
  - every claim carries number, unit, reference and basis;
  - about the food or the habit, never the person;
  - no verdicts ("too much", "unhealthy", "fattening", "empty calories", "avoid", "cut out", "failed", "should");
  - "more of" and "trade" are the verbs;
  - signals side by side are "on those days", never "because";
  - estimates say "about";
  - "energy use", never "burn rate";
  - no predictions by a date, no comparison with other people.

  The banned-word test gains "too much", "unhealthy", "fattening", "empty calories" and "burn rate".

## Description
A Coach section component, its view model from MM-605's findings, its stories, and the Dashboard card switched to the same
engine. `RecentInsightsSection` (MM-363) stays below for inline lines.

## Acceptance Criteria
```gherkin
Scenario: The owner's fat week on the Coach tab
  Given the data of MM-606's first scenario
  When the Coach tab opens
  Then "Worth changing" lists the fat and protein finding first, with peanut butter, its share and a trade
  And the headline pairs a strength with that fix

Scenario: Everything shown
  Given 9 findings
  Then 3 are under "Worth changing", up to 3 under "Holding up", and the rest under "N more from your data", folded

Scenario: Not padded
  Given 3 fixes and no strengths
  Then there is no "Holding up" list and no headline

Scenario: Opens on today
  Given a person whose first entry was this morning
  When the Coach tab opens
  Then the analysis shows 1d for today, and no switcher

Scenario: Spans appear with data
  Given 9 days since the first entry, 7 of them fully logged
  Then the switcher shows 1d and 7d, and not 2w, 1m or 3m

Scenario: A span's analysis
  When 7d is chosen
  Then the findings are MM-605's over the last 7 days through yesterday, and the period line says how many were fully logged

Scenario: Areas a span cannot judge
  Given 7d chosen and training logged for 1 week
  Then "Not enough data in this span" lists training with "needs 4 weeks"

Scenario: Numbers behind it
  When "The numbers behind this" is opened on a finding
  Then it shows the span, days counted and left out with why, each figure against its reference, and the rule's name

Scenario: Dismissed but visible
  Given a finding dismissed 10 days ago
  Then the fold says "1 hidden" with the date it shows again

Scenario: Stable list
  Given yesterday's ranking and a day whose findings keep their class and transition
  Then the order is unchanged and the figures update

Scenario: Dashboard and Coach agree
  When the Dashboard card is dismissed
  Then the same finding is hidden on the Coach tab

Scenario: Hidden weight
  Given hidden weight
  Then no weight figure appears in any finding or its numbers

Scenario: Words
  Then every finding's text passes the banned-word test, including the new words
```

## UI/UX
- Stories in `apps/mobile/src/coach/` for: first day, not enough data, nothing found, the owner's fat week, under-eating,
  eating-disorder history, hidden weight. The section's look is decided there.

## Notes
Kluger & DeNisi 1996: feedback helps on average (d = .41), but over a third of feedback interventions made performance worse, and
effectiveness fell as attention moved toward the self. That is why every line is about the task.

## Progress
Built 2026-10-24: the section, its state, its words and its stories. Not run locally; CI validates.

- **Engine (pure, `apps/mobile/src/engine/analysis/`):**
  - `supportedAnalysisSpans({ firstEntryOn, wholeDays, today })`: 1d always; a span once the days since the first entry
    reach it and at least 60% of its days through yesterday are fully logged (`TrendRule.coverageMinimum`).
  - `arrangeCoachFindings(findings, { today, dismissals, transitions, previousOrder })` gives `CoachFindingSections`
    (`left`, `headline`, `worthChanging` ≤ 3, `holdingUp` ≤ 3, `more`, `hidden` as `HiddenFinding` with
    `showsAgainOn` = dismissed + 28 days). Data quality first; fixes by priority class, then the key's transition,
    then `rankTrendFindings` for those with a trend, then the order given; holding up in the order given.
  - `foldTrainingProtein`: X1 folded into N1 when both are in change, its figures under `proteinByTrainingDay.*`.
- **State (`apps/mobile/src/state/`):** `CoachAnalysis` (on `AppState.coachAnalysis`, built from `CoachAnalysisInputs`
  in `AppState.makeCoachAnalysis`): `span` (a `ValueCell`, 1d by default, not kept), `spans`, `view`
  (`CoachAnalysisView`), `choose(span)`, `open()` and `dismiss(findingId)` (through `trendLog.dismissFinding`). It
  reads the food and intake of the last 119 days, the water of the last 30, the dismissals and the announcement log;
  `analyseFoodDay` on 1d, else `analyseFoodSpan` + `analyseTrainingSpan` + `unjudgedTrainingAreas` through yesterday.
  The trade catalog (`CatalogTradeCatalog.load`) is read ahead in a stream cell, again only when the set of catalog
  foods logged changes, and passed as `catalog: undefined` until it is ready.
- **Words (`apps/mobile/src/format/`):** `coachFindingText` (picks `foodFindingText` or `trainingFindingText` by signal;
  adds "Days left out" beside "Days counted", and X1's rows and sentence when folded into N1), `coachHeadlineText`,
  `coachPeriodText`, `unjudgedAreaText` with `analysisAreaLabel`, `hiddenFindingsText`, `moreFindingsText`,
  `nothingFoundText`, `underEatingPointerText` and `coachAnalysisWords`.
- **UI:** `apps/mobile/src/coach/WhatYourDataSaysSection.tsx` in `CoachScreen` directly under `OneThingRow`, above "Your
  targets"; each finding is `CoachFindingItem.tsx`. The switcher is an `MmSegmented` in a list row ("Days read"), as
  the Dashboard's "Days shown" holds its own, so it sits on a surface (MM-291); "The numbers behind this" is an
  `MmDisclosure` of `StatRow`s as in the confidence section; a finding's "Dismiss" is a text button as on
  `InsightCard`, the sibling it is built like. The span goes back to 1d when the tab is left.
- **Stories (`Screens/Coach`):** CoachAnalysisFirstDay, CoachAnalysisNotEnoughData, CoachAnalysisNothingFound,
  CoachAnalysisFatWeek, CoachAnalysisMoreFromYourData, CoachAnalysisDismissed, CoachAnalysisToday,
  CoachAnalysisUnderEating, CoachAnalysisEatingDisorderHistory, CoachAnalysisHiddenWeight, CoachAnalysisSpanChosen
  (scenarios `analysisFatWeekScenario`, `quietWeekScenario`, `firstMorningScenario` in `src/gallery/screens/`).
- **Tests:**
  - `apps/mobile/test/coach/whatYourDataSays.test.tsx`: the owner's fat week on the tab, the placement, opens on today,
    back to 1d on return, spans appear with data, a span's analysis, areas a span cannot judge, nothing found, nothing
    logged, numbers behind it, dismissed but visible, dismissing, hidden weight, under-eating, the eating-disorder
    history, and the words on the tab;
  - `apps/mobile/test/state/coachAnalysis.test.ts`: the spans offered (9 days, 7 fully logged; a first entry this
    morning), the span chosen and reset, a log read at once, and a dismissal through the trend log;
  - `apps/mobile/test/engine/coachFindingSections.test.ts`: the span rule, everything shown (9 findings), not padded,
    the headline, data quality first, the ranking, 1d's "left", dismissed but visible, a stable list, X1 folded into
    N1, and the fat week's order;
  - `apps/mobile/test/format/coachAnalysisText.test.ts`: the lines, the numbers behind a span's finding, X1's rows, a
    refeed counted in a trend, and every text against the banned words.

Choices made without asking (say if any is wrong):
- **"Opens on today" for the fat week:** the tab opens on 1d, so the owner's fat week is read by choosing 2w (its 14
  days), in the test and the story.
- **The fat line leads the protein minimum** when it states the protein it displaced and both are in one priority class
  and transition: it is the line that names the foods and carries the trade.
- **The view waits for the trend log's first read** (the announcement log and the dismissals), which it watches on
  every span, 1d too, so the log is in by the time a span is chosen. Arranged before it, the fixes were drawn once
  without their transitions (the fat line first, then the protein minimum new as of yesterday) and a dismissed finding
  showed for a moment. Guarded by `test/state/coachAnalysis.test.ts`'s "the log's transitions rank the span's fixes".
- **The span switcher sits on a list group** (`MmListGroup`), as every row that holds a control does (MM-291); drawn
  bare in the framed section at first, it broke rule 1 (`test/gallery/hierarchy.test.tsx`).
- **Stable list:** the order last shown is kept per span for as long as the app is open; after a restart the ranking
  decides again. Transitions are read from the announcement log, written once a day since (below).
- **The headline** is "<strength> is holding up; worth changing: <the fix's title>." (Since the review fixes below:
  "<strength's subject> is holding up; <the fix's subject> is worth changing.")
- **"Days left out"** is the span's days less the days counted, "not fully logged".
- **The hidden fold** opens to the hidden findings' titles, each with the day it shows again ("shows again Nov 21",
  under "1 finding hidden" since the review fixes).
- **Under-eating:** the pointer names the notice while it shows; once it is put off, it says only that nothing here
  asks for less.

Remaining (at the time; all but the panel pass built below):
- ~~"Dashboard and Coach agree" and the Dashboard card switched to this engine~~;
- ~~appending to the announcement log (MM-605's state machine), so transitions and N1's 65% exit are the machine's~~;
- ~~snoozed foods passed (`snoozed`)~~;
- the product-designer and UX-accessibility pass over the stories.

Built 2026-10-24: the Dashboard card from the same engine, the announcement log written, and snoozed foods passed.
Not run locally; CI validates.

- **The card** (`InsightCard`, on `AppState.coachAnalysis.dashboard`, chosen by `selectDashboardInsight` in
  `src/engine/analysis/`, with the type `DashboardInsight`):
  - it shows the top finding the announcement log said (new, reversed, update, back again, or resolved, which shows
    the signal's holding-up line) for the canonical span (MM-605's Progress: 2w, else 1m, then 7d), in the Coach tab's
    words (`coachFindingText`), with "The numbers behind this" and "Open on Coach", which opens the tab with the
    section on that span (`CoachAnalysis.openCanonical`);
  - MM-141's ration, counted from the announcement log and the insight log together: a day's top said entry starts
    on the card the day after it was made, only when no other start fell that day and fewer than three in the 7 days
    to it. A day's other entries wait on the Coach tab, never on the card. What is showing keeps showing; between
    two, the higher priority, then the later start;
  - Dismiss writes `trendLog.dismissFinding` with the finding's id, the one the Coach tab dismisses by, so each hides
    it on the other. A finding dismissed today keeps today's start: nothing else starts on the card until tomorrow.
- **The catalog rules** (MM-141): `InsightRule.analysisSignal` names the three with an equivalent in the analysis
  (protein short → N1 `proteinMinimum`, protein by meal → N3 `proteinByMeal`, sodium over the limit → N13 `sodium`),
  and `AppState.insightRules` leaves those out. Every other rule keeps its own: the stall, weigh-in timing, partial
  days, estimates rising, weigh protein, weekends higher, waist against weight, the consistent day, short sleep and
  fiber for fullness. They compete with the analysis's top entry by `InsightPriority` (the analysis on a tie), and a
  rule's start is still written to the insight log, which is unchanged and kept. Strength holding on a cut was
  already under the lift (MM-377), not on the card.
- **Snoozed foods:** `snoozedFoodNames` gives the foods with a food kind of inline insight snoozed and still quiet
  (`AppState.insightSnoozes`), trimmed and in lower case, as `FoodAnalysisInput.snoozed`; MM-607's trades never take
  them as X or Y.
- **Transitions in the ranking:** `arrangeCoachFindings` reads a finding's transition by its id (the log's key), then
  by its trend's key; the log is read for every span.
- **Story:** `Screens/Today/InsightFromAnalysis` (the fat week's card, and its "Open on Coach").
- **Tests:**
  - `apps/mobile/test/engine/coachTrendLog.test.ts`: the card under the ration, a day's later announcements, a rule's
    start counting against it, dismissed on either tab, resolved good news, the rules kept and which have an
    equivalent, priority between a rule and a finding, a rule showing keeps showing, partial days left to the rule,
    transitions in the ranking, and snoozed foods;
  - `apps/mobile/test/state/coachAnalysis.test.ts`: the card is the top announced finding by the same id, dismissed
    there it is hidden on the Coach tab and the reverse, pressed it opens the canonical span, and a food snoozed
    inline is never traded;
  - `apps/mobile/test/coach/insightCard.test.tsx` ("Dashboard and Coach agree", both ways, and pressing the card).
- **Existing Dashboard card tests changed** (only where the behaviour changes): in
  `apps/mobile/test/coach/insightCard.test.tsx`, "a pattern is shown once, with its evidence" now finds the
  protein-minimum finding's `new` entry in the trend log as of yesterday, and nothing in the insight log, instead of
  a `proteinShort` row there. Its words ("about 30 g short", "Days at or above the minimum") and the other two
  dashboard tests are unchanged.

Choices made without asking (say if any is wrong):
- **Partial days and estimates rising stay rules on the card.** The analysis has its own, but its span reads only once
  60% of its days are fully logged, which is just when many partial days stop it; the card leaves the analysis's two
  to the rules, so one is never said twice.
- **The card waits for the whole analysis**, training included, so it may appear a moment later than the old card.
- **"Open on Coach"** is a text button under the numbers, as "Dismiss" is beside the title; it opens the tab on the
  span, not scrolled to the finding. In a development build React's strict mode runs the section's leave effect once
  on mounting, which puts the span back on 1d; a built app opens on the span.

Not done:
- The product-designer and UX-accessibility pass over the stories (the section's and the card's).

Review fixes, 2026-10-24 (the product-designer's PD findings and the UX and coaching reviewers' F findings). Not run
locally; CI validates.

- **PD-1, the switcher:** an `MmListRow` with `entry=` and `flush`, with no `MmListGroup`, as the Goal section's rows
  (MM-291): the `MmSegmented` runs under the row's label across the text column, its segments narrowed in
  `.coach-analysis-spans` so five spans fit at 360 px, each 48 px tall. The row is "Days shown", the Dashboard's word.
  `MmListRow` now applies `flush` to an entry row too.
- **PD-2, fixes told from strengths:** "N more from your data" opens to two groups under the same "Worth changing" and
  "Holding up" labels (split in the section by kind, so `CoachFindingSections.more` keeps its shape). Each finding has
  a small neutral mark beside its title in `--text2`: `checkCircle`, named "Holding up", and `tune`, named "Worth
  changing"; no new colour and no warning tone.
- **PD-3:** the list labels are `h3.coach-options-label`, the stall card's list label; a finding's title is body size at
  weight 600.
- **PD-4:** the headline comes straight after the period line, at weight 500, and names subjects rather than repeating
  the first title (`findingSubjectText`): "Calories are holding up; fat is worth changing."
- **PD-7:** "Not enough data in this span" is a `.coach-options-label` over `.coach-options` captions.
- **PD-8 and the stories' gaps** (`Screens/Coach`): CoachAnalysisAllSpansSmallPhone (`analysisSeasonScenario`, 95 days
  logged, every span on a 360 px phone), CoachAnalysisMoreBothKinds (`analysisBalancedScenario`, the fold opened),
  CoachAnalysisHiddenOpened, CoachAnalysisTodayNumbers, CoachAnalysisTodayTrade (`analysisTodayTradeScenario`),
  CoachAnalysisNothingLogged (`nothingLoggedScenario`) and CoachAnalysisNothingToday; CoachAnalysisDismissed and
  CoachAnalysisSpanChosen follow the new words and names. Each is walked with `screenStory`'s `walk`.
- **PD-11 and F9, dismissing:** "Dismiss" comes after "The numbers behind this", in the reading order and on screen (no
  CSS reordering). Dismissing moves the focus to the next finding's title (focusable with `tabIndex=-1`), or to the
  hidden fold's toggle when none follows, and shows the snack "Hidden until {date}" (`hiddenUntilText`), as the
  weigh-in's snack on the Coach tab. No undo: the trend log only appends a dismissal.
- **F1:** a 1d finding's id is `day:<epochDay>:<signal>:<kind>`, so a 1d dismissal lasts its day (MM-612).
- **F2, F3, F6, F7:** the trade sentences (MM-607's Progress).
- **F4:** `MmDisclosure` takes `name`, what the toggle is heard as; each finding's is "The numbers behind this:
  {title}" (`findingControlName`, which also names "Dismiss: {title}"). The stories select it by that prefix.
- **F5 and PD-10:** with history but nothing logged today, 1d says "Nothing logged today yet." and, when 7d is offered,
  "7d reads the last week.", with what is left at the whole of today's targets under it (`analyseFoodDay` returns the
  "left" finding with no entries). "Log a food and the coach reads it here." is only for nothing ever logged.
- **F8, F10, F16:** the findings' words and numbers (MM-612's Progress): food rows "{food}, share of {fat | calories |
  the gap | sodium}"; one "Days left out" row (sodium and fiber give their own, with why); fiber's days counted and
  left out; the tier is "How clear"; a "Band" row (low–high kcal) on calories; fat beside protein "on those days"
  ("On those days fat gave 882 kcal while protein averaged 22 g under your minimum."); a stalled lift's step "One
  more rep or one more set at that load is the usual next step." (`trainingFindingText`).
- **F11:** the period line is `aria-live="polite"`.
- **F13:** the hidden fold is "{n} finding(s) hidden"; each row inside says "shows again {date}" (`showsAgainText`).
- **F14:** `CoachFindingItem` takes a heading level: h3 for 1d's "what is left", h4 under a list's h3 label, the fold's
  two groups included (each with its own visible h3).
- **Tests:** `apps/mobile/test/coach/whatYourDataSays.test.tsx` ("the review fixes": the switcher's row, the live
  period line and the headline after it, the kind marks, the heading levels, the fold's two groups; nothing today
  and nothing ever; dismissing's snack, no undo, and the focus), `apps/mobile/test/format/coachAnalysisText.test.ts`
  (the hidden fold's words, the controls' names, the headline by subjects, "How clear"),
  `apps/mobile/test/format/foodFindingText.test.ts` and `apps/mobile/test/engine/foodDay.test.ts` (MM-607 and MM-612).
  Existing tests changed for the new words: the fat-week and safeguard tests in `whatYourDataSays.test.tsx` ("Days
  shown", the trade's "Trading Peanut butter for", the headline, "1 finding hidden" opened to "shows again", the
  numbers' name), `coachAnalysisText.test.ts` (the hidden fold, the headline, the food row's label),
  `foodFindingText.test.ts` (N5's sentence, the trade sentence, 1d's trade), `foodDay.test.ts` (what fits: "48 g
  protein"), `foodSignals.test.ts` (the fat line's "on those days") and `insightCard.test.tsx` ("Dashboard and Coach
  agree" opens the hidden fold for its "shows again").
- **Left for the owner:** PD-6 (the section's length) and F13's "show again" action on a hidden row.

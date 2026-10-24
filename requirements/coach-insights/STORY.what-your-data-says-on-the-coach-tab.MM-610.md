---
id: MM-610
status: proposed
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
- **Position:** one section, "What your data says", directly under "One thing to do" and above "Your targets". The safeguards
  (pause, under-eating, training lapse, relief offer) stay above it and outrank it. While the under-eating finding holds, the
  section opens by pointing to that notice.
- **The span switcher (the owner's design, 2026-10-24):**
  - The analysis opens on **1d** (today, MM-612), with an `MmSegmented` switcher `1d | 7d | 2w | 1m | 3m` like Progress's 30d and
    90d.
  - A span appears in the switcher only when the data supports it: the days since the first entry reach the span, and its days
    meet MM-605's coverage rule (≥ 60% eligible). The switcher itself appears only when 7d does.
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

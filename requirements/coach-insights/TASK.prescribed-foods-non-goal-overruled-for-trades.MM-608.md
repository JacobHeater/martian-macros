---
id: MM-608
status: done
component: coach-insights
related: [MM-604, MM-607, MM-144, MM-365, MM-371, MM-141]
---

# Task: The prescribed-foods non-goal and MM-141's single-day and ration rules, overruled for the coach's analysis

## Context
`docs/non-goals.md` lists "No meal plans and no prescribed foods". MM-365's "Plain words" scenario forbids a line that "names a
replacement food". MM-141 says insights never concern a single day, and rations them to one new a day and three a week. On
2026-10-24 the product owner chose, for the coach's analysis (MM-604):
- a trade may name any food (MM-607);
- single days are judged (MM-612);
- the Coach tab shows every finding, ranked (MM-610).

MM-371 is the precedent for overruling a non-goal.

## Decisions
- **Overruled by the product owner, 2026-10-24:**
  - Prescribed foods, for a trade only: a single food offered in place of one the person logs, at about the same calories.
  - MM-141's single-day rule, on the Coach tab.
  - MM-141's ration, on the Coach tab.
- **Still non-goals:** meal plans, prescribed menus or portions, and any food offered other than as a trade for a logged one.
  MM-141's ration still governs the Dashboard card. MM-108's banned words stay banned.

## Description
- `docs/non-goals.md` marks the prescribed-food part of the item overruled for trades, by whom, when and why, naming MM-607 and
  MM-608, and keeps its reasoning. Meal plans stay.
- MM-144 says the same.
- MM-365's "Plain words" scenario is amended: a coach analysis trade (MM-607) may name a replacement food; an inline item line
  still does not.
- MM-141 gains a note that its single-day and ration rules do not apply on the Coach tab (MM-610, MM-612).

## Acceptance Criteria
```gherkin
Scenario: The non-goal says it was overruled
  When docs/non-goals.md is read
  Then the prescribed-foods part of the item says it was overruled for trades by the product owner on 2026-10-24 and names MM-607 and MM-608
  And meal plans are still a non-goal

Scenario: The tickets agree
  When MM-144, MM-365 and MM-141 are read
  Then each says what was overruled, for what, and names MM-608

Scenario: Inline lines unchanged
  Given an inline line under a food (MM-365)
  Then it still names no replacement food
```

## Progress
- Done 2026-10-24: `docs/non-goals.md` and MM-144 mark the prescribed-foods item overruled in part for trades by the product owner on
  2026-10-24, naming MM-607 and MM-608, with the reasoning kept and meal plans still out. MM-365's "Plain words" scenario carries a
  comment that it governs inline lines, and that the analysis may name a trade. MM-141's Decisions open with the amendment for the
  Coach tab. Documentation only; no test.

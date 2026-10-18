---
id: MM-363
status: done
component: coach-insights
related: [MM-361, MM-362, MM-256, MM-286]
---

# Story: What the coach said inline, listed on the Coach tab

## Context
See MM-361. An inline insight lives under its item, so it is gone once the person scrolls past or the day changes. The owner
chose that the Coach tab lists them too (2026-10-17).

## Decisions
The product owner's (2026-10-17): the Coach tab lists inline insights as well as showing them inline.

Choices I made without asking (say if any is wrong):
- **A "Recent insights" section on the Coach tab**, placed in its tiers (MM-256) below the goal and the week's change. It lists the
  inline insights shown in the last 14 days, newest first, grouped by area.
- **Folded to its count by default**, as Monthly reports is (the panel's PD-6), so it never pushes the sections below it down.
- **Each row** shows the area icon, the item it was about ("Peanut butter, snack") as its title, and the day and the insight's line
  beneath. Tapping it opens the item's screen on that day, scrolled to the item, using the destination-state rules (MM-286).
- **An insight whose item was deleted or edited** so the rule no longer holds stays listed as it was said, marked "Item since
  changed", and does not link.
- **One row per rule per item.** A pattern insight that shows for days is listed once, dated the day it first showed, and
  stays one row while it keeps showing.
- **The same safeguards and switches** as MM-362: nothing is listed that the safeguards or switches would hide today.
- **The sibling** is the existing Coach tab section list (`MmSection` with list rows, as in `ReportsCard`).

## Description
The section, fed by the inline insight log from MM-362, with navigation back to the item.

## Acceptance Criteria
```gherkin
Scenario: Listed after it is shown
  Given an inline insight was shown under a food on Tuesday
  When the Coach tab is opened on Thursday
  Then "Recent insights" lists it under Food, with the food, the day and the line

Scenario: Back to the item
  When that row is tapped
  Then the food log for Tuesday opens with that food in view

Scenario: Older than 14 days
  Given an inline insight shown 15 days ago
  Then it is not listed

Scenario: The item changed
  Given the food was deleted after the insight was shown
  Then the row says "Item since changed" and does not navigate

Scenario: The item was edited
  Given the food's amount was edited so the rule no longer holds
  Then the row still shows the line as it was said, marked "Item since changed", and does not navigate

Scenario: A pattern over several days
  Given the same pattern insight showed under the same food on each of 5 days
  Then it is listed once, dated the first of those days

Scenario: A switch turned off
  Given the food area is switched off in Settings > Coach
  Then no food insights are listed

Scenario: Nothing yet
  Given no inline insight in 14 days
  Then the section says the coach will leave notes under the items it has something to say about
```

## UI/UX
- CoachRecentInsightsFolded, CoachRecentInsights, CoachRecentInsightsNone, in
  `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`. The section folded, open with an item since changed, and empty.
  Reviewed by the panel (`docs/agent-runs/mm361-coaching-insights/`).

## Progress
- Built 2026-10-17 for the kinds the app has (training's "volume jump", MM-366). The section shows once the app has a kind
  of inline insight. It reads `inline_insight_log` (MM-362) for the last 14 days, applies today's safeguards and
  switches, and marks an entry "Item since changed" when its item no longer carries that kind (deleted, or edited so it
  no longer holds) (`recentInlineInsights`).
- A lift's entry opens the workout it was said in; a food's entry opens that day on Food (the destination-state rules,
  MM-286); a snoozed line is not listed while it is quiet (MM-378). 2026-10-18: the food, waist and water kinds joined
  (MM-365, MM-367). Scrolling to the food itself is not done: the Food screen has no scroll-to-entry; its day is opened.
- Tests: `test/coach/inlineInsights.test.tsx` (listed under Training once shown, leading back to the workout); the
  story CoachRecentInsightsLogged draws the list from the log.

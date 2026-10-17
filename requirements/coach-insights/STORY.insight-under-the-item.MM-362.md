---
id: MM-362
status: proposed
component: coach-insights
related: [MM-361, MM-141, MM-108, MM-11, MM-118, MM-148, MM-143, MM-92, MM-363, MM-364, MM-365, MM-366, MM-367, MM-368]
---

# Story: An insight under the item it is about

## Context
See MM-361. The dashboard insight (MM-141) is one record type, one catalog, one card and a rationing scheduler. Inline insights
need the same discipline (a named rule, fixed words, viewable evidence) but a different shape: they belong to a line item, not to
the day. There can be many on a screen, and some are about a single item.

## Decisions
The product owner's (2026-10-17): see MM-361. Inline, under the item. A pattern basis or a neutral single-item basis. Every
qualifying item shows. One line, expandable. The same safeguards. Quieted in Settings.

Choices I made without asking (say if any is wrong):
- **A separate record, `ItemInsight`**: the rule, the item it is anchored to (an entry, meal, exercise, set, reading or night,
  by kind and id), its basis (`item` or `pattern`), the figures, and for a pattern the period it rests on. It sits beside
  MM-141's `Insight` and does not replace it. The dashboard card is unchanged.
- **One insight per item at most.** When two rules fire on the same item, the higher priority wins, using MM-141's order
  (safety, data quality, coaching, pattern, education). Each area's catalog lists its rules in priority order, with a
  priority column, so ties are settled by the table. Every qualifying item still shows its one line. A note another ticket
  already shows on the item (MM-142's weight-jump explanation) counts as that item's note, so no inline insight is added.
- **A single-item insight is about the item, never about the day.** "Most of this item's calories come from fat" is allowed.
  "You went over today because of this" is not. MM-141's "not about one day" stays true for days.
- **Words: a fact, then a general direction.** "Most of this item's calories come from fat (62%). A leaner choice or a smaller
  portion leaves more room for protein." No specific replacement food is named, which keeps MM-144's "no prescribed foods". The
  owner answered the "how far can advice go" question with grades (MM-370), so this choice is mine. Say if a named alternative
  is wanted.
- **MM-108 still holds in every inline line**: no "good", "bad", "clean", "junk", "guilt", "earn", "burn off". No praise for eating
  under target or for a low weight. No comparison with other people. No predicted outcomes by a date. A grade letter may be
  quoted (MM-371 lets letters through the banned-word test).
- **Looks like a sibling.** The line reuses the dashboard insight's parts (the `insight` icon, `MmDisclosure` titled "What this
  rests on", `StatRow` evidence) at row scale, under the row, inside the same list group. The sibling that sets the pattern is
  the easy-to-miss line under a completed day (`EasyToMissLine`). No new card on the canvas (MM-291, MM-318).
- **No dismiss button on the line.** The owner put quieting in Settings. The expanded evidence ends with a link, "Coach settings
  for this tip", that opens that rule's switch (MM-364).
- **While coaching is paused (MM-148)**, no inline insight shows. Safety notices keep their own components and are not inline
  insights.
- **When it appears**: insights are worked out from local data each time the screen's data changes. A single-item insight can
  appear as soon as the item is logged. A pattern insight appears once the pattern holds, and leaves when it no longer does.
- **Every rule has an evidence register entry** (MM-143) before it ships. A test fails for a rule without one.

## Description
The `ItemInsight` type and an inline catalog in the engine (pure functions, one per rule). The safeguard filter (eating-disorder
history, hidden weight, under-18, pause, and the switches from MM-364). An `InlineInsight` component under rows on every
loggable surface. A log of inline insights shown, which feeds MM-363. The rules themselves are in MM-365 to MM-368.

## Acceptance Criteria
```gherkin
Scenario: A single-item insight sits under its item
  Given a logged food that a single-item rule fires on
  When the food log is shown
  Then a one-line coach insight is drawn directly under that food's row, inside its meal

Scenario: Every qualifying item shows
  Given three logged foods that each satisfy a rule
  Then each of the three shows its own insight

Scenario: One per item
  Given two rules fire on the same food
  Then only the higher-priority insight is shown under it

Scenario: The evidence is one tap down
  When an inline insight is tapped
  Then "What this rests on" opens with the item's figures, and for a pattern the days it was worked out from

Scenario: Never about the day
  Given every inline rule run against every simulated user
  Then no inline insight text refers to the day's total or blames an item for a day over target

Scenario: Forbidden subjects
  Given every inline rule's words with representative figures
  Then none contains a banned word (MM-108), praises intake below target, or mentions a new lowest weight

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then no inline insight about weight or food composition is shown, and protein, logging, training and sleep insights still can be

Scenario: Under 18
  Given a profile under 18
  Then no inline insight is shown anywhere

Scenario: Hidden weight
  Given weight is hidden (MM-118)
  Then no inline insight mentions weight

Scenario: Paused
  Given coaching is paused
  Then no inline insight is shown anywhere

Scenario: Turned off
  Given a rule is switched off in Settings > Coach
  Then no insight from that rule is shown on any item

Scenario: Every rule has its evidence
  Then every inline rule in the catalog has an entry in the evidence register
```

## UI/UX
- To be drawn: an `InlineInsight` story (collapsed, expanded, long text at large font) and screen stories for each surface with
  and without an insight, in the three palettes (MM-293).

## Notes
- Out of scope: insights generated at run time, insights sent as notifications, and per-insight dismissal.
- Schema: one step for the inline insight log (MM-363 reads it).

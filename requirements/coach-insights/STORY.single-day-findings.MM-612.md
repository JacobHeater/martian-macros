---
id: MM-612
status: proposed
component: coach-insights
related: [MM-604, MM-605, MM-606, MM-607, MM-610, MM-611, MM-608, MM-141, MM-124, MM-114, MM-11]
---

# Story: The 1d analysis: today

## Context
MM-141 says an insight never concerns a single day. One day is noise, and judging a day trains a restrict-after-overeating
cycle (the non-goal "No automatic compensation for an over or under day"). On 2026-10-24 the owner overruled this for the Coach
tab (MM-608): "I want single days", and "analysis should happen even for the day". The owner's design: the analysis opens on
**1d**, with a switcher for longer spans (MM-610). The compensation risk is met by the Refeed and Day off marks (MM-611) and by
the rules below.

## Decisions
By the product owner, 2026-10-24: the Coach tab's analysis defaults to 1d, today, from the first logged entry.

Choices made without asking (say if any is wrong):
- **1d analyses today as logged so far**, and updates with each entry:
  - MM-606's signals applied to the day: protein, fat and protein density, fat share, calories against the band, fiber, and
    sodium if a limit is set. Each is read against the day's targets, with the top contributing food and its trade (MM-607).
  - Example: "Lunch was 780 kcal with 18 g protein; the cheese and crackers were 60% of its fat. Trading them for the cottage
    cheese you log adds 20 g at about the same calories."
  - Single-day margins: fat over its target by ≥ 25% and ≥ 15 g; protein density under 85% of what the targets need, on ≥ 400
    kcal logged; calories over the band (uncertain).
  - Holding-up lines count too ("Protein 152 g, over your 140 g minimum").
- **What is left:** calories and protein against today's targets. When protein is behind, one or two foods the person logs that
  fit the protein left within the calories left: "62 g protein and 610 kcal left today. Your usual chicken and rice (48 g, 520
  kcal) fits."
- **A day marked Refeed or Day off** (MM-611) shows its totals and what is left, with no fixes.
- **Never compensation:**
  - no line moves an over or under day onto another day;
  - 1d never mentions an earlier day;
  - today's targets are never changed by another day (MM-124);
  - it never says to eat less.
- **Safeguards:**
  - Eating-disorder history: protein lines only, no food named, nothing about calories or fat.
  - Under-eating finding, pregnancy, breastfeeding, underweight: no line that lowers intake.
  - Under 18, or paused: nothing.
- **1d findings are not trends.** They are not written to MM-605's announcement log and have no state.

## Description
The 1d view of MM-610's section: MM-606's signal definitions applied to today, with single-day margins and MM-607's trade.

## Acceptance Criteria
```gherkin
Scenario: Today analysed from the first entry
  Given a new user whose only entries are today's lunch, 780 kcal with 18 g protein, mostly cheese and crackers
  When the Coach tab opens
  Then the analysis is on 1d, names the cheese and crackers, and offers a trade when one qualifies
  And nothing waits on days of history

Scenario: What is left
  Given 610 kcal and 62 g of protein left today, and a logged meal of 520 kcal with 48 g protein
  Then 1d states what is left and names that meal

Scenario: Updates with each entry
  When a food is logged
  Then the 1d analysis reflects it on returning to the Coach tab

Scenario: A marked day
  Given today marked "Refeed" with fat at twice its target
  Then 1d shows the day's totals and what is left, and no fix

Scenario: Never compensation
  Given yesterday 800 kcal over target
  Then nothing on 1d mentions yesterday, and today's targets are unchanged

Scenario: Eating-disorder history
  Given an eating-disorder history and a fat-heavy lunch
  Then 1d shows at most protein lines, with no food named

Scenario: Holding up
  Given today at the protein minimum and within the calorie band
  Then 1d says so in numbers
```

---
id: MM-47
status: proposed
component: food-logging
related: [MM-37, MM-39, MM-45, MM-48]
---

# Story: Copy a meal or a whole day

## Context
See MM-37. Many people eat the same breakfast daily and the same lunch most weekdays.

## Description
- From a meal on any day: "Copy to today" (or to the day being viewed).
- From a day: "Copy yesterday" on an empty day, offered prominently, which copies every entry with its meal.
- Copied entries are ordinary entries; they can be edited or removed afterwards.
- The day's completeness mark is **not** copied.

## Acceptance Criteria
```gherkin
Scenario: Copy yesterday
  Given yesterday has six entries and today has none
  When "Copy yesterday" is tapped
  Then today has the same six entries in the same meals, and is unmarked

Scenario: Copy one meal
  Given Monday's breakfast has three entries
  When it is copied to today
  Then today's breakfast has those three entries in addition to anything already there

Scenario: Independent afterwards
  Given a copied entry is edited
  Then the original is unchanged
```

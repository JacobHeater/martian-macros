---
id: MM-324
status: proposed
component: design-system
related: [MM-320, MM-259]
---

# Bug: a list row's words start 4 px further left when it has an action

## Context
Found by the panel's product designer on MM-320 (PD-6, `docs/agent-runs/mm320-health-connect/`). A row with a
trailing action lays out its icon and words with a 12 px gap (`.mm-list-row-main`); a plain row with 16 px
(`.mm-list-row`). On Settings the words of Daily activity, Experience, Nutrition detail, Appearance and Units
start at about 69 px, every other row's at 73 px, so the text column is ragged down the screen.

## Description
Every list row's words start on one column, with an action or without, in `ui.css`, not in screens.

## Acceptance Criteria
```gherkin
Scenario: One text column
  Given a group with a row that has an edit action and a row that has none
  Then their titles start at the same distance from the card's edge
```

---
id: MM-352
status: proposed
component: food-database
related: [MM-346, MM-253]
---

# Bug: the food database's rows carry no icon, and its Light notice has no edge

## Context
Found by the panel's product designer reviewing MM-346 (2026-10-16). On the food database screen,
"Nothing downloaded yet" and each installed pack's row have no leading icon, against rule 2 of the screen
direction (every list row carries one). In Light, the notice in the Download group ("… is on your phone.")
is white on the canvas with no hairline, beside list groups that have one.

## Description
The screen's rows carry icons by meaning, and its notice stands apart from the canvas in Light as its
siblings do.

## Acceptance Criteria
```gherkin
Scenario: The food database screen
  When it is opened
  Then every row of "On this phone" has a leading icon
  And in Light the notice in the Download group is told apart from the canvas
```

## Notes
Not yet guarded. A design fix through Storybook and the panel.

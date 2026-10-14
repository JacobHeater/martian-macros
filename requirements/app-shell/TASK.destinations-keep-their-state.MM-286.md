---
id: MM-286
component: app-shell
status: proposed
related: [MM-253, MM-256, MM-257, MM-99, MM-90]
---

# Task: a destination keeps its state when the person comes back to it

## What the panel found

Each tab switch unmounts the destination (`HomeShell` renders one screen),
so the scroll position, the meal folds, every disclosure and the Progress
range reset (UX-accessibility UX-9, 2026-10-13). With MM-256 and MM-257
folding Recovery, Reports, Waist and Strength to a line, a person who
opened one finds it closed every time they return. `design/ux-architecture.md`
asks that each destination keep its state (MM-99 noted it too).

Also from the walk (UX-19): on Food the floating action is the last focus
stop, so a keyboard or switch user tabs through every entry to reach the
primary action.

## What is built

- The five destinations stay mounted and hidden, or their fold, range and
  scroll state lives in `state/` cells, so a return finds things as they
  were left.
- The Food screen's floating action comes before the list in the document
  order (its position unchanged), so it is the first stop after the bar.

## Acceptance criteria

```gherkin
Scenario: A fold survives a visit elsewhere
  Given the Waist section opened on Progress
  When Food is visited and Progress returned to
  Then Waist is still open and the scroll position kept

Scenario: The range survives
  Given 90 days chosen on the Progress trend
  When Coach is visited and Progress returned to
  Then 90 days is still chosen

Scenario: The primary action is reached first
  Given the Food screen with entries
  When focus moves from the app bar
  Then the floating action is the next stop, before the entries
```

## UI/UX

No new story; the Progress and Food stories as they are.

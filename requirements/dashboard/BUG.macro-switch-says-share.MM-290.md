---
id: MM-290
component: dashboard
status: done
related: [MM-254, MM-253, MM-288]
---

# Bug: the macro switch says "Share" where the word is "split"

## What the owner found

On the phone (2026-10-14) the hero's switch read "Grams | Share". Nobody
calls the macro picture a "share": the word everyone uses, and the one the
code already uses (`MacroSplitChart`, `.food-hero-split`), is the split.
An invented word on the first screen makes the app read like a novice
built it.

## The fix

The switch reads "Grams | Split". The word "Share" names nothing in the
macro pictures.

## Regression test

`test/food/mealCards.test.tsx` presses "Split" and finds no "Share" button
in the hero; it failed before the fix.

## Acceptance criteria

```gherkin
Scenario: The switch says split
  Given the Dashboard
  Then the macro switch reads "Grams" and "Split"
  And no control in the hero says "Share"
```

## UI/UX

Storybook: Screens/Today/Dashboard, Screens/Today/Not Weighed Today.

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm291-weigh-in/`).

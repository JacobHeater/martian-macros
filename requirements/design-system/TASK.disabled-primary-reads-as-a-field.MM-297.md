---
id: MM-297
component: design-system
status: done
related: [MM-291, MM-262, MM-288]
---

# Task: a disabled primary must not read as a second field

## What the panel found

In Light the empty field (`--sunken`) and the disabled Save (`--selected`)
are near-identical grey tiles side by side, so the person must work out
which takes the number; in Martian the disabled Save is the heaviest
object in the row while it does nothing (product-designer PD-3,
UX-accessibility UX-7, 2026-10-14).

## What is built

A disabled primary or secondary has no fill, a faint outline (`--text` at
16%) and its label at 38% of `--text`, the platform convention (Material's
disabled label at 0.38), so it reads neither as a field nor as an enabled
secondary; a disabled text action has no fill and no border. Drawn in the
States story (a disabled cell after Primary, Secondary and Text) and passed
by the panel before it was built (MM-293, `docs/agent-runs/mm298-trend-goal-themes/`).
The field border (`--outline-strong`) meets 3:1 against `--surface`,
`--raised` and `--canvas` in every palette, asserted in `test/tokens.test.ts`.

## Acceptance criteria

```gherkin
Scenario: The field and the inert Save look different
  Given a number entry with nothing typed, in Martian, Light and Dark
  Then the field and the disabled Save differ in fill or outline at a glance
  And the field's border is at least 3:1 against its surface

Scenario: A disabled primary is not an enabled secondary
  Given an enabled secondary and a disabled primary side by side, in each palette
  Then they differ in label tone at a glance, not only in stroke
```

## UI/UX

Storybook: Design system/States, Screens/Today/Not Weighed Today.

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm298-trend-goal-themes/`).

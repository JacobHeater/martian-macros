---
id: MM-297
component: design-system
status: proposed
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

The disabled primary is drawn quieter than the field in every palette (an
outline of the primary's shape with the label in `--text2`, or a fill
clearly apart from `--sunken`), decided in the States story first and
passed by the panel before it is built (MM-293). The field border meets
3:1 against its surface (SC 1.4.11), measured.

## Acceptance criteria

```gherkin
Scenario: The field and the inert Save look different
  Given a number entry with nothing typed, in Martian, Light and Dark
  Then the field and the disabled Save differ in fill or outline at a glance
  And the field's border is at least 3:1 against its surface
```

## UI/UX

Storybook: Design system/States, Screens/Today/Not Weighed Today.

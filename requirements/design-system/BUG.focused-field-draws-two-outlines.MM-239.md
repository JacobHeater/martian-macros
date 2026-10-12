---
id: MM-239
component: design-system
status: done
related: [MM-232, MM-237]
---

# Bug: a focused text field draws two outlines

## What happened

The owner opened Add food on the phone (2026-10-12). The search field,
focused, showed its rounded box with a ring and a second, square ring
drawn inside it around the typing area.

## Why

The field's box marks focus itself (`.mm-field-box:focus-within`), and the
input inside it was meant to draw nothing (`.mm-field-input { outline: 0 }`).
The app-wide rule `:focus-visible { outline: 2px solid }` has exactly the
same specificity as `.mm-field-input`, so whichever stylesheet loaded last
won. In the app `base.css` loads after the components, so the app-wide
ring won and the input drew it inside the box. Storybook loaded them the
other way round, which is why the catalog never showed it.

The dialog and the sheet removed their outline the same way and had the
same weakness.

## What is right

Anything that removes the app-wide focus ring says so for the focused
state (`:focus-visible`), which outranks the app-wide rule wherever it is
loaded. A field shows one mark of focus: its box. The time and date inputs
mark focus the way the field box does.

## Acceptance criteria

```gherkin
Scenario: one mark of focus
  When a text field or a dropdown is focused
  Then its box is ringed and nothing is drawn inside the box

Scenario: load order cannot bring it back
  Then every rule in the app's stylesheets that removes an outline names
  the focused state, so it outranks the app-wide ring in any load order
```

## UI/UX

`src/gallery/Fields.stories.tsx (Story: Focused)` and
`src/gallery/screens/Food.stories.tsx (Story: AddFood)`.

## Regression test

`apps/mobile/test/ui/focusRing.test.ts`: no stylesheet removes an outline
without naming the focused state, and the field's input removes it there.

## Progress

**Fixed (2026-10-12).** Failing first, then passing. Looked at in a browser
in the two stories above, in all three palettes.

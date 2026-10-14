---
id: MM-273
component: design-system
status: done
related: [MM-262, MM-237, MM-253, MM-260]
---

# Bug: most overlays, and most states of most controls, have no story

## What the walk found

No design-system story draws `MmDialog`'s confirm, choice or options,
`MmSheet`, the time and clock dialogs, the snack, an open `MmMenuButton`,
`MmFab`, `MmSwipeToRemove`, `MuscleVolumeRow`, `StrengthTrendCard`,
`MmFooterActions` or `DemoNotice`; focus is shown only for the text field,
disabled only for the primary button, error nowhere, pressed nowhere (all
three reviewers: PD-18, RC-15, UX-26). The stories test requires a story
per screen, sheet and step, not per component. This is exactly how MM-260
slipped: nobody had looked at that dialog on its own.

## The fix

- A **Design system / Overlays** story: each `overlays.*` kind opened by a
  play step, the snack with and without an action, an open menu.
- A **Design system / States** story: every control at rest, focused (play
  step), pressed (a class the stylesheet shares with `:active`), disabled,
  error, selected, in three palettes through the palette global.
- The stories test gains a coverage rule: every exported component of
  `src/ui/*.tsx` is imported by some file under `src/gallery/`.

## Regression test

`test/gallery/stories.test.tsx`, the coverage rule, which fails first on
the twelve names above.

## Acceptance criteria

```gherkin
Scenario: Every component is in the register
  Then every exported component of src/ui is imported by a gallery file, or the suite fails

Scenario: Every overlay can be looked at
  Then confirm, choice, options, date, time, clock, sheet, snack and menu each have a story that opens them

Scenario: Every state can be looked at
  Then rest, focus, pressed, disabled, error and selected are shown for each control that has them
```

## Progress

Built 2026-10-13: Design system/States (`StatesCatalog`: every control at rest, pressed through `.mm-pressed`, disabled, selected, in error; focus by a play step, in a group too) and Design system/Overlays (`OverlaysCatalog`: dialog, confirm, choice, options, date, time, clock, the pickers bare, sheet through the host and bare, snack with and without Undo, the menu bare and from its button). The Components catalog gained the floating action, the swipe row, the footer actions and the demo strip; Charts gained the volume row and the strength card. `test/gallery/stories.test.tsx` fails when a component of `src/ui` is imported by no gallery file.

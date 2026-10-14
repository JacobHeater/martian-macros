---
id: MM-280
component: design-system
status: done
related: [MM-262, MM-104, MM-62]
---

# Bug: every confirm dialog draws the destructive action as the loud Ember button

## What the walk found

`MmOverlays.confirm` renders the destructive label ("Erase", "Delete") as
the Ember primary and Cancel as quiet text; `interaction-and-motion.md`
says the safe exit is visually stronger and the destructive action quieter
(PD-13). The owner decided on 2026-10-13: a quiet destructive kind, with
Cancel the stronger button.

## The fix

`MmButtonKind` gains `destructive`: an outline or text button in
`--danger`. `confirm` renders the destructive action in that kind and
Cancel as `secondary`. Callers (erase all data, delete a workout, the terms
guard's erase, custom foods, the food database, the profile) change their
kind through the one dialog.

## Regression test

`test/ui/confirm.test.tsx`: the confirm dialog's destructive button has no
`mm-button-primary` class and has the destructive class; Cancel is
secondary.

## Acceptance criteria

```gherkin
Scenario: Erase is quiet
  Given the erase-all-data confirmation
  Then Erase is a quiet danger-coloured button and Cancel is the stronger one
```

## Progress

Built 2026-10-13: `MmButtonKind` gains `destructive` (danger as text, no fill); `overlays.confirm` renders the destructive action in it and Cancel as `secondary`, so every erase and delete in the app changed through the one dialog. Tests: `test/ui/confirm.test.tsx`. Looked at in Overlays/Confirm.

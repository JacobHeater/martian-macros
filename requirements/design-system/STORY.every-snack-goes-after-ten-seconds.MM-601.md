---
id: MM-601
status: in-progress
component: design-system
related: [MM-272, MM-302]
---

# Story: Every snack goes by itself after ten seconds, Undo too

## Context
MM-272 made a snack that carries an action (an "Undo") wait until it was pressed, dismissed or replaced,
so it never expired before it could be used; one with nothing to press went after four seconds. The owner
found the Undo snack lingering and ruled (2026-10-24) that snacks in the app, the Undo one included, go by
themselves after ten seconds. This replaces MM-272's waiting snack.

## Decisions
Made with the product owner (2026-10-24):
- **Every snack goes after ten seconds**, with an action or without.

Choices I made without asking (say if any is wrong):
- **The same ten seconds for a snack with nothing to press**, which went after four. The owner's rule names
  snacks in general, the Undo one as an example.
- **A snack still stays while it is focused or pointed at**, and its ten seconds start again when it is
  left, so it never goes while someone is reading or pressing it (WCAG 2.2.1, timing adjustable).
- **Before then it goes by its action, its Dismiss, the back button or the next snack**, as before.

## Acceptance Criteria
```gherkin
Scenario: An Undo snack goes by itself
  Given a snack with Undo is shown
  When ten seconds pass without it being pressed
  Then the snack is gone, and nothing was undone

Scenario: A plain snack goes after ten seconds
  Given a snack with nothing to press is shown
  Then it is still shown at 9.9 seconds and gone after ten

Scenario: Held while used
  Given a snack is focused
  Then it stays however long it is focused
  And it goes ten seconds after it is left

Scenario: Sooner by the person
  Given a snack with Undo is shown
  When the person presses Dismiss or the back button
  Then it is gone at once
```

## UI/UX
- apps/mobile/src/gallery/Overlays.stories.tsx (the snack stories). Dictated by the owner, so the panel pass
  is skipped (`apps/mobile/AGENTS.md`).

## Notes
- Where: `apps/mobile/src/ui/MmOverlays.tsx` (`snackMs`), `apps/mobile/src/ui/Overlays.ts`.
- Tests: `test/ui/snack.test.tsx`. Written for CI; not run locally (owner's rule).

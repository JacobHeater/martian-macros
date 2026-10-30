---
id: MM-700
status: in-progress
component: persistence
related: [MM-698, MM-699, MM-673]
---

# Bug: After "Replace", a move shows nothing while it works, and would fail silently

## Context
The owner's Pixel, 2026-10-29 (see MM-699): after "Replace" on a move from the welcome, the confirmation closed onto the
welcome, which stayed as it was while the records were written for minutes. The owner read it as "nothing happened" and
swiped the app away. Had the restore failed, nothing would have been said either: the welcome starts the move without
waiting on it, and the step after the confirmation caught nothing.

## Description
Once "Replace" is pressed, a sheet says the records are being put in place, with a busy line (MM-673: a wait is shown as a
wait), until they are. It cannot be closed half-way. When it fails, a snack says the records could not be moved and that
nothing changed, and the error is written to the phone's log.

## Acceptance Criteria
```gherkin
Scenario: The wait is shown
  Given a move has arrived and "Replace" is pressed
  While the records are being put in place
  Then a sheet says so with a busy line
  And pressing Escape or Back does not close it

Scenario: A failure is said
  Given the records cannot be put in place
  When "Replace" is pressed
  Then a snack says the records could not be moved and nothing on this phone was changed
  And the welcome is still there
```

## UI/UX
- The wait — apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx (Story: MoveApplying, small phone).

## Notes
- Guarded by the last two tests of `test/settings/move.test.tsx`.

---
id: MM-691
status: in-progress
component: design-system
related: [MM-272, MM-601]
---

# Bug: a snack with nothing to press has no way to dismiss it

## Context
The owner, from the phone (2026-10-28), on "Read from Apple Health. Everything asked for is up to date." standing at the
bottom of Settings: "this toast at the bottom of the screen never dismisses and there's no way to... it needs a dismiss
button" now. Only a snack with an action (Undo) had a Dismiss (MM-272); a plain one had the ten-second
timer (MM-601) and nothing to press. It also took focus itself (`tabIndex` 0), and a snack being focused is held
(MM-601), so a tap on it on the phone held it until something else took focus: the "never dismisses" seen.

## By the product owner
- Every snack has a Dismiss button. No exceptions, no panel.

## Decisions
Choices made without asking (say if any is wrong):
- **The Dismiss is the same icon button** the Undo snack had, after the action when there is one, so the two snacks
  are one shape.
- **A snack no longer takes focus itself**; its Dismiss is the focus stop inside it, and holding while focused or
  pointed at (MM-601) stays, now on the button.

## Acceptance Criteria
```gherkin
Scenario: A plain snack is dismissed
  Given a snack with nothing to press is shown
  When Dismiss is pressed
  Then it is gone at once

Scenario: It still goes by itself
  Given a snack with nothing to press is shown and not touched
  Then it is gone after ten seconds
```

## UI/UX
- The snack stories in apps/mobile/src/gallery/ draw the Dismiss on every snack. Dictated by the owner, so the panel
  pass is skipped.

## Progress
Fixed 2026-10-28 in `MmOverlays.tsx` (every snack renders the Dismiss; no `tabIndex` on the snack); `test/ui/snack.test.tsx`
extended. Not run locally (the owner's rule).

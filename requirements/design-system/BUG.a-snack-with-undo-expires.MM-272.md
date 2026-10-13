---
id: MM-272
component: design-system
status: proposed
related: [MM-262, MM-48, MM-104]
---

# Bug: a snack carrying Undo expires after four seconds

## What the walk found

The snack auto-dismisses in four seconds even when it carries the only
Undo for a delete, with no way to extend or dismiss by hand (UX-8).
`interaction-and-motion.md` says nothing is time-limited; WCAG 2.2.1 asks
for a limit that can be turned off, adjusted or extended. A TalkBack user
needs longer to reach Undo.

## The fix

A snack with an action has no timeout: it stays until its action is
pressed, the next snack replaces it, or it is dismissed by hand (a close
icon button, and the hardware back). A snack without an action keeps the
four seconds and pauses while focused or hovered.

## Regression test

`test/ui/snack.test.tsx`: a snack with an action is still present after
four seconds; one without is gone; a focused snack does not expire.

## Acceptance criteria

```gherkin
Scenario: Undo waits
  Given an entry was deleted
  Then the Undo snack stays until Undo, a replacement or a dismissal

Scenario: Plain snacks still go
  Given a snack with no action
  Then it is gone after four seconds, unless focused
```

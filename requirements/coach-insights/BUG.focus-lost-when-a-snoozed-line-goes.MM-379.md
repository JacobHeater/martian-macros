---
id: MM-379
status: done
component: coach-insights
related: [MM-378, MM-362, MM-364, MM-272]
---

# Bug: Focus was lost when a snoozed line, or a snooze's row, went

## Context
Snoozing an insight (MM-378) removes the line, and "Snooze…" inside it, once the length is chosen; "Turn back on" in
Settings > Coach removes its row. The choice dialog returns the focus to the element focused before it opened, which by then
is detached, so a keyboard, switch-access or screen-reader user was left on the document body with nothing focused. Found by
the UX guard at the build's design review (`docs/agent-runs/mm361-build-design/`, UX-1) from the source; not seen on a phone.
The snack's own Undo and Dismiss leave the focus the same way, since MM-272; that is older and is not fixed here.

## Description
Before a snoozed line or a Snoozed row goes, the focus moves to a stable neighbour: the item the line was under or another line about it (MM-393), or what is
left of the Settings screen.

## Acceptance Criteria
```gherkin
Scenario: Snoozed
  When a length is chosen for a line under a lift
  Then the focus is on a control of that lift's card, not the document body

Scenario: Turned back on
  When "Turn back on" is pressed on a Snoozed row
  Then the focus is on a control of the same screen, not the document body
```

## Notes
Guarded by `apps/mobile/test/coach/inlineInsights.test.tsx` ("the focus stays on the screen", MM-379), which failed before
the fix. Fixed with `ui/focusNeighbourOf`, called by `InlineInsight` before the snooze is saved and by `CoachAreaScreen`
before the snooze is removed.

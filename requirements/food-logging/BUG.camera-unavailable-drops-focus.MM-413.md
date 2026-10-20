---
id: MM-413
status: proposed
component: food-logging
related: [MM-351, MM-43, MM-337]
---

# Bug: A camera that cannot be used replaces the pressed button and announces nothing

## Context
Found by the panel's UX guard reviewing MM-351 (`docs/agent-runs/m2-design-bugs`, F2). On the scan step, when the camera
cannot be used, the pressed "Scan with the camera" button is replaced by a notice that has no live role. The focused
button leaves the page, so a screen reader's focus falls to the body and nothing is said: the same cause as MM-351, in the
same component, on its other recovery path. The state is drawn (`ScanNoCamera`).

## Description
When the camera cannot be used, the person hears why and keeps a place on the sheet: the notice is announced from the
status region that exists before its text (MM-351), and focus moves to the next useful control ("Or type the digits") or
stays on the button, kept in place and disabled.

## Acceptance Criteria
```gherkin
Scenario: No camera
  Given a screen reader is on and the camera cannot be used
  When "Scan with the camera" is pressed
  Then the notice is announced, and focus is on the digits field or still on the button
```

## Notes
Guarded by "MM-413" in `apps/mobile/test/food/scanAnnounced.test.tsx`, skipped with this ticket's ID until the fix lands.

---
id: MM-351
status: done
component: food-logging
related: [MM-337, MM-43]
---

# Bug: what a barcode lookup found is not announced

## Context
Found by the panel's UX guard reviewing MM-337 (2026-10-16). After "Look up", the scan sheet shows a
notice ("This product is not in the food database on this phone…") and new actions, but `Notice` has no
live role, so a person using a screen reader who pressed Look up hears nothing.

## Description
The outcome of a lookup is announced when it appears, politely, without moving focus away from what the
person was doing.

## Acceptance Criteria
```gherkin
Scenario: An unknown code looked up
  Given a screen reader is on
  When an unknown barcode is looked up
  Then the notice saying it is not in the database is announced
```

## Notes
Not yet guarded. A design fix through Storybook and the panel, like MM-337; check what `ReadFailedNotice`
(MM-334) does with `role="alert"` before choosing a polite region here.

## Fix (2026-10-19)
`Notice` takes `live`, which gives it `role="status"` (polite, no focus move; `ReadFailedNotice` keeps `role="alert"` for a failed read, MM-334); the scan step's lookup notice is live. Regression test `apps/mobile/test/food/scanAnnounced.test.tsx`: the notice is found by its status role with the text, and focus has not moved into it. Reviewed in `docs/agent-runs/m2-design-bugs`.

## Decisions after the panel (2026-10-19)
- The status region exists before its text (the UX guard's F1, MDN on live regions): the scan step renders a `role="status"` container from its first paint and places the notice inside it when there is a message. `Notice` carries no live role of its own, since a region inserted together with its text is not reliably announced. The regression test checks the region is there, empty, before the lookup.
- `status`, not `alert`: the result of the person's own lookup is advisory (ARIA 1.2); a failed read stays an alert (MM-334).
- The other recovery path, a camera that cannot be used, has the same defect: MM-413, proposed.

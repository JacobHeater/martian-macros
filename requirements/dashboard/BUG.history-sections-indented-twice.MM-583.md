---
id: MM-583
status: done
component: dashboard
related: [MM-569, MM-579, MM-335, MM-254]
---

# Bug: The Dashboard's History indented its charts twice

## Context
Reported by the owner from a phone screenshot. History is a section whose body is indented under its title, and
its Intake, Protein, Weight trend, Waist, Logging and Coach sections indent their own bodies again. Their icons
stood 36 px in and their charts 72 px in, while "Days shown" above them ran the column's full width.

## Description
History is a flush section (as Food's are, MM-569): the sections in it start at the screen's edge, their icons
under History's, and their charts under their own titles. A list group, surface or notice directly in a flush body
is not pulled back under the icon (MM-579), since the body is not indented; it would hang off the screen.

## Acceptance Criteria
```gherkin
Scenario: History opened
  Given the Dashboard's History is open
  Then the Intake section's icon lines up with History's icon and with "Days shown"
  And its chart is indented once, under the Intake title

Scenario: A list group in a flush section
  Given a list group directly in a flush section's body
  Then it starts at the section's edge, not 36 px before it
```

## Notes
Guarded by `apps/mobile/test/dashboard/historyIndent.test.tsx`, which fails without the fix.

---
id: MM-322
status: done
component: design-system
related: [MM-320, MM-259, MM-104]
---

# Bug: rows placed straight in a list group lost the hairlines between them

## Context
Found by the panel's product designer and UX guard reviewing MM-320 (PD-3, UX-5,
`docs/agent-runs/mm320-health-connect/`). The Settings direction asks for hairline dividers between rows,
and `MmListGroup` says it draws them. `.mm-list-group > * + *` draws the line, but `.mm-list-row { border: 0 }`
has the same weight and comes later, so it won. Only rows wrapped in a `div` (Reminders) kept their lines;
the button and note inside the Data card were the only things in it with lines, which boxed them off.

## Description
A list group draws a hairline between any two of its children, rows included, in every palette.

## Acceptance Criteria
```gherkin
Scenario: Two rows in a group
  Given a list group holding two rows
  Then the second row has a hairline above it
```

## Notes
Regression test: "draws a hairline between two rows" in `test/ui/listGroup.test.tsx`; it failed before the
fix and passes after.

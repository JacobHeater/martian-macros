---
id: MM-284
component: design-system
status: done
related: [MM-253, MM-257, MM-279]
---

# Bug: a field's unit is not part of what a screen reader hears

## What the panel found

The weigh-in field's accessible name was "Today's weigh-in" with "lb" as
an unassociated suffix span, and the waist fields were "1st waist reading"
with the unit only in a caption (UX-accessibility UX-8, 2026-10-13). A
screen-reader user types a number without being told the unit.

## The fix

`MmTextField` describes the field by its suffix (`aria-describedby` to the
suffix, before any helper), so "lb" or "kg" is read with the field. The
waist fields name their unit ("1st waist reading, inches").

## Regression test

`test/ui/fieldErrors.test.tsx`, "a field with a unit says the unit in its
description": fails before the fix. `test/progress/waistEntry.test.tsx`
finds the fields by the name that now carries the unit.

## Acceptance criteria

```gherkin
Scenario: The unit is heard
  Given a number field with a suffix
  Then the field's accessible description contains the suffix

Scenario: The waist fields
  Then each waist field's name says the unit the readings are typed in
```

## Progress

Fixed 2026-10-13 with the hierarchy rebuild (MM-257).

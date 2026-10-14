---
id: MM-295
component: design-system
status: done
related: [MM-291, MM-279]
---

# Bug: a number entry's hint is seen but never heard

## What the panel found

`NumberEntry` drew its hint ("First thing in the morning, after the
bathroom.") as a plain paragraph with no link to the field, so a screen
reader heard "Today's weigh-in, lb" and never how to weigh
(UX-accessibility UX-2, 2026-10-14).

## The fix

The hint stays where it is drawn, across the field and its Save, and its
id goes into the field's `aria-describedby` (`MmTextField describedBy`).

## Regression test

`test/ui/fieldErrors.test.tsx` ("describes the field with its hint"):
the field's accessible description holds the hint; failed before the fix.

## Acceptance criteria

```gherkin
Scenario: The hint is heard with the field
  Given a number entry with a hint
  Then the field's accessible description includes the hint
```

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm291-weigh-in/`).

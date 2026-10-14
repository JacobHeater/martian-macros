---
id: MM-296
component: design-system
status: done
related: [MM-291, MM-279]
---

# Bug: the keyboard's action key does not save a number entry

## What the panel found

Typing the weight and pressing the keypad's action key did nothing; the
person had to find Save (UX-accessibility UX-3, 2026-10-14). It is the
gesture a single-field entry invites, met every morning.

## The fix

`MmTextField` takes `onSubmit`: with it, the key is labelled "done"
(`enterKeyHint`) and Enter calls it. `NumberEntry` passes its save only
while the value can be saved, so Enter on "heavy" does nothing and the
error stays.

## Regression test

`test/ui/fieldErrors.test.tsx` ("saves on the keyboard action key, and only
a number"); failed before the fix.

## Acceptance criteria

```gherkin
Scenario: Enter saves a number
  Given a number entry
  When 181.4 is typed and Enter pressed
  Then 181.4 is saved

Scenario: Enter on not a number saves nothing
  When "heavy" is typed and Enter pressed
  Then nothing is saved and the error stays
```

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm291-weigh-in/`).

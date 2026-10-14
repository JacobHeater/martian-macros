---
id: MM-279
component: design-system
status: done
related: [MM-262, MM-104, MM-106]
---

# Bug: field errors are not adjacent or spoken, and a facts list is mis-ordered

## What the walk found

- `MmTextField` has no error state: no `error` prop, no `aria-invalid`, no
  danger presentation; its warning helper is not a live region; given both
  a label and a `name`, the `aria-label` replaces the visible label (UX-15).
- `NumberEntryCard` sends a validation failure to a four-second snack, not
  beside the field, blurs the field first, and Save is inert for a
  non-number with no explanation (UX-16).
- `MetricFacts` puts `<dd>` before `<dt>` in a `<dl>`, so a screen reader
  may not pair value with label (UX-19).
- The clock dialog's spoken names are "Min" and "Sec" (UX-17).

## The fix

`MmTextField` gains `error` (danger border and caption, `aria-invalid`,
`aria-describedby`, live); `name` composes with the label rather than
replacing it. `NumberEntryCard` shows its message under the field and keeps
focus. `MetricFacts` orders `dt` then `dd`. The clock dialog says "Minute"
and "Second".

## Regression test

`test/ui/fieldErrors.test.tsx`: the error is rendered beside the field,
described to it and marked invalid; the card's message is in the card;
`MetricFacts` renders `dt` before `dd`; the clock fields' accessible names.

## Acceptance criteria

```gherkin
Scenario: An error beside the field
  Given a field with an error
  Then the message is under the field, the field is aria-invalid, and the message is announced

Scenario: The card explains itself
  Given a non-number in the weigh-in card
  Then the reason is under the field and focus stays there
```

## Progress

Built 2026-10-13: `MmTextField` takes `error` (danger box, `aria-invalid`, `aria-describedby`, `role="alert"`), and `name` composes with `label` rather than replacing it; `NumberEntryCard` says "Enter a number above zero." under the field while Save is inert and the refusal under the field, keeping the keyboard there; `MetricFacts` renders `dt` before `dd` (drawn value-over-label by `column-reverse`); the clock dialog's drums are Hour, Minute and Second. Tests: `test/ui/fieldErrors.test.tsx`.

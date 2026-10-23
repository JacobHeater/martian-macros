---
id: MM-593
status: in-progress
component: design-system
related: [MM-262, MM-592]
---

# Bug: A long press selects a control's words as text to copy

## Context
Found by the product owner on their iPhone on 2026-10-22: a long press on the day's name in Food's day
stepper selected "Mon" with the phone's selection handles. A control's words are pressed, never copied; the
WebView offered to select them as it would any text. Nothing native shows (MM-262).

## Description
No button, nor anything with the button role, can be selected or offered to copy by a long press
(`user-select: none`, and `-webkit-touch-callout: none` on iOS), set once in the base stylesheet. The day
stepper as a whole too, since on today its day's name is not a button.

## Acceptance Criteria
```gherkin
Scenario: The day's name
  Given Food shows a day before today
  When the person long-presses the day's name
  Then nothing is selected

Scenario: Any button
  When the person long-presses a button's words
  Then nothing is selected
```

## Notes
- Regression test: `test/ui/controlsNotSelected.test.ts` (the stylesheets' rules; nothing lays out in the
  test browser). Owed on a phone: the long press itself.

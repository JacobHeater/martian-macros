---
id: MM-260
component: design-system
status: done
related: [MM-104, MM-237, MM-239, MM-253]
---

# Bug: the date dialog's chevron hugs the field edge and the dialog is flat

## What the owner saw (2026-10-13)

The "Date of birth" dialog: the phone's date control drawn as a plain box
with the browser's picker chevron flush against its right edge, inside a
dialog that is one more flat surface on the canvas. The owner's words:
"No padding near the chevron. Modal looks dull."

## Why

- The control is the browser's `<input type="date">`. Nothing styled its
  picker indicator, so it sat where the browser put it, against the edge,
  and in the browser's light colors on a dark field.
- `.mm-dialog` had a fill and a radius and nothing else: no outline, no
  shadow, so the scrim did all the lifting.
- The dialog showed the raw value and nothing about it: no reading of the
  day in words, and an out-of-range day silently disabled OK.

## The fix

- `.mm-time-input` sets `color-scheme` to the palette (dark in Martian and
  Dark, light in Light), so the control, its indicator and the native
  picker follow the theme; the indicator gets a margin from the value and
  padding of its own.
- `.mm-dialog` gets a hairline outline and a soft shadow, so a question
  floats over the screen (MM-181's flatness rule is for the floating
  action, not for a dialog).
- `MmDateDialog` says the day back in words under the control ("January 1,
  1996"), and when the day is outside the allowed range says the range
  instead, as an alert, so OK being inert is explained.
- The dialog has a story: Settings, DateOfBirth.

## Regression test

`apps/mobile/test/ui/dateDialog.test.tsx`: the day in words, the range
message with OK inert, and the stylesheet rules (color-scheme per palette,
the indicator's margin, the dialog's shadow). It failed before the fix on
the missing detail line and the missing rules.

## Acceptance criteria

```gherkin
Scenario: The control follows the palette
  Given the Martian or Dark palette
  Then the date control's indicator and native picker are drawn dark, with a margin from the value

Scenario: The day in words
  Given 1996-01-01 chosen
  Then "January 1, 1996" is under the control

Scenario: Out of range
  Given a day after the latest allowed
  Then the range is said as an alert and OK does nothing

Scenario: Looked at
  Then the DateOfBirth story was looked at in a browser in Martian and Light
```

## Progress
**Done (2026-10-13).** The test failed first on the missing detail line and rules, then passed. The DateOfBirth story was looked at in a browser from the static build at phone size in Martian and Light: the indicator sits off the edge and takes the palette, the dialog floats on its outline and shadow, the day reads back in words. The focus mark on the first date segment is the browser's own.

## Seen again on the phone (2026-10-13)
The owner's next screenshot, from the Android build: the chevron still flush against the field's edge, and the field not stretched to the dialog. Android's date control draws its own arrow inside the box and ignores padding and the indicator pseudo-element, so the first fix held only in a desktop browser. **The fix that holds everywhere:** the platform draws nothing. `MmPickerField` wraps the date or time input in the design system's field box with `appearance: none`, the indicator hidden on every engine, the value at the start, full width, and our own chevron (`MmIcon` chevronDown) at the field's inset; pressing anywhere in the field opens the native picker. The time dialog uses it too. The test now checks for the box, the chevron and the rules; it failed before this change on the missing box and chevron.

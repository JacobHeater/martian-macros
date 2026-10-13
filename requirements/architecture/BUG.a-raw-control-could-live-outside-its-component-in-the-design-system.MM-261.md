---
id: MM-261
component: architecture
status: done
related: [MM-246, MM-260, MM-253, MM-159, MM-163]
---

# Bug: a raw control could live outside its component inside the design system

## What happened

The owner found the Date of birth dialog drawn by the platform: a raw
`<input type="date">` inside `MmDateDialog` with a CSS class, its chevron
flush against the field on Android, and no design-system component behind
it (MM-260). It took three prompts to arrive at `MmPickerField`, because
nothing forced it: the architecture check (MM-246) enforces "a screen never
uses a raw control" outside `src/ui/` and exempts everything inside it, so
a dialog, a sheet or the overlay host could write its own `<input>` or
`<button>` and the rule was satisfied in letter. The options dialog in
`MmOverlays` had the same shape: a raw `<button role="option">` written
inline. The owner's words: "Why did it take me, the non-expert, three
prompts to get a design-system component? This can't happen. You're the
panel."

## The rule, made enforceable

Inside `src/ui/`, each kind of native form control lives in the one
component that is it, and nowhere else: text, search and number inputs in
`MmTextField`; date, time and datetime-local in `MmPickerField`; range in
`MmSlider`; checkbox in `MmCheckRow` and `MmSwitchRow`; radio in
`MmSegmented`; `<select>` in `MmDropdown`; `<textarea>` in no file yet. A
composite (`MmOverlays`, `MmDialog`, `MmSheet`, `MmListGroup`,
`MmFooterActions`) writes no control of its own; it composes components.
An input whose `type` is computed may appear only in a control's own
component. A control kind nobody owns fails until it is given a component.
`test/architecture.test.ts` carries the map and the rule, with samples that
fail for each case.

## Fixed with it

- `MmOption`: the row of a list of options inside a dialog, with its check
  and "Chosen" said aloud; `MmOverlays` composes it instead of writing the
  button.

## Why it matters

What the platform draws (indicators, arrows, thumbs, glyphs, focus rings,
pickers) is styled in exactly one place per control, so a defect like
MM-260's is fixed once and cannot reappear in another composite. Rule 8 in
`AGENTS.md` now reads the same inside the design system as outside it.

## Regression test

`test/architecture.test.ts`, "inside the design system, each native control
lives in its one component", over every file of `src/ui/`, with the samples
"a date input in a dialog is reported; in its component it is not", "a
composite that writes a button is reported", and "a control kind nobody
owns is reported". The samples pin the messages; the real-tree check would
have failed on `MmOverlays` before `MmOption` and on `MmDateDialog` before
`MmPickerField`.

## Acceptance criteria

```gherkin
Scenario: A raw input in a dialog
  Given a file under src/ui that is not the control's component and writes <input type="date">
  Then the architecture test names the file and the one component that may

Scenario: A composite writes a button
  Given MmOverlays, MmDialog or MmSheet writing a <button>
  Then the architecture test says a composite composes components

Scenario: An unowned control
  Given <input type="file"> or <textarea> anywhere in src/ui
  Then the test fails until the map names its component

Scenario: The tree as committed
  Then the test passes, with MmOption composed by the overlay host
```

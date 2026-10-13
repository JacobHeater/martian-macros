---
id: MM-271
component: design-system
status: proposed
related: [MM-262, MM-104, MM-242]
---

# Bug: overlays do not trap focus, the options dialog cannot be cancelled, and sheets have no visible way out

## What the walk found

- Tab and Shift+Tab leave `MmDialog` and `MmSheet` into the screen beneath,
  and Escape is handled on the panel, so once focus has left it no longer
  closes (UX-5). `aria-modal` hides the background from screen readers but
  not from the keyboard or switch access; `inert` is used nowhere.
- The options dialog has no Cancel; leaving requires the scrim, Escape or
  hardware back (UX-6).
- `MmSheet` draws a drag handle that drags nothing and guarantees no close
  action; `EditHeightSheet` has only Save, inert outside 100 to 250 cm with
  no helper saying so (UX-7).

## The fix

- While an overlay is up, the app root is `inert`; focus wraps inside the
  panel; Escape closes from anywhere inside.
- The options dialog gets a text Cancel.
- `MmSheet` renders a close action of its own (an icon button "Close" in
  its header or a text Cancel at its foot, the caller choosing which) and
  supports drag-to-dismiss on the handle, or the handle goes.
- `EditHeightSheet` says the allowed range as a helper and has Cancel.

## Regression test

`test/ui/overlays.test.tsx`: Tab from the last control returns to the
first; Escape closes with focus on any control; the options dialog has a
Cancel that resolves undefined; a sheet renders a close action.

## Acceptance criteria

```gherkin
Scenario: Focus stays inside
  Given a dialog is open
  When Tab is pressed on its last control
  Then focus is on its first control

Scenario: A way out
  Then every dialog and sheet has a visible Cancel or Close

Scenario: The height sheet explains itself
  Then the allowed range is a helper under the field and Save's inertness is explained
```

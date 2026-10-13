---
id: MM-278
component: architecture
status: proposed
related: [MM-262, MM-261, MM-246, MM-159]
---

# Bug: composites still write their own buttons, a component takes a colour, and the checker cannot tell a composite from a control

## What the walk found (React-Capacitor RC-5 to RC-9, RC-13)

- `MmSurface` and `MmHeroSurface` write a `<button>` when pressable, though
  `MmPressable` is "the one way"; `MmMenuButton` re-implements
  `MmIconButton`'s markup and writes raw menu items; `StatusRow` is a third
  pressable row beside `MmListRow`.
- `MmProgressBar` takes `color` (a CSS colour) and `height` in px; rule 8
  says components take meaning, never a colour.
- Eleven screens draw the "opens" chevron themselves by passing an icon as
  `trailing`.
- MM-261's rule names five composites by hand and gives `<button>` no
  home, so any other composite may write a button; its tag scanner stops at
  the first `>` inside an arrow function.

## The fix

- Surfaces compose `MmPressable`; `MmMenuButton` composes `MmIconButton`
  and a menu-item row component; `StatusRow` becomes `MmListRow` with
  `leadingIcon` and `opens`; `MmListRow opens` draws the chevron, so no
  screen passes one.
- `MmProgressBar` takes `kind` (energy or a macro) and `weight`, never a
  colour or a size.
- The architecture test: `<button>` gets its homes with a shrinking
  baseline, as the one-declaration rule has; a composite is derived (a
  `src/ui` file that imports another component's value, or renders a
  dialog, listbox or menu role) and may hold no control; the scanner is
  brace-aware; a prop named `color`, `className` or `style` on a ui
  component fails.

## Regression test

`test/architecture.test.ts` samples: a dialog that composes `MmButton` and
writes `<button>` is reported; a `<button>` in an unmapped file is
reported; a colour prop is reported; an input whose first attribute is an
arrow function is classified by its `type`. Component tests: a pressable
surface renders `.mm-pressable`; a row with `opens` renders the chevron.

## Acceptance criteria

```gherkin
Scenario: A composite is known by what it does
  Given a src/ui file that imports another component and writes a <button>
  Then the architecture test names it

Scenario: Meaning, not colour
  Given a ui component prop named color, className or style
  Then the architecture test names it

Scenario: One pressable row
  Then StatusRow is gone and no screen passes a chevron as trailing
```

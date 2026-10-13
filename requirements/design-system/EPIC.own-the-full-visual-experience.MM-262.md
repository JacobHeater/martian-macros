---
id: MM-262
component: design-system
status: proposed
related: [MM-101, MM-104, MM-163, MM-224, MM-253, MM-260, MM-261, MM-109]
---

# Epic: own the full visual experience; every control is drawn by Martian Macros

## The decision

The owner's call (2026-10-13), after the date dialog (MM-260) and the
checker's blind spot (MM-261): "I asked you to create a design system. You
did a half-assed job. Make everything custom and beautiful for Martian
Macros. I want to own the full visual experience. Native controls aren't
even remotely sexy."

So the standing rule is no longer "the platform draws nothing *in the
field*"; it is **nothing native shows, anywhere**: no native date or time
picker, no native select list, no engine-drawn checkbox, slider thumb,
tap highlight or focus ring. The design system draws every control, every
state of it, in every palette, and it is judged in the register before it
ships. A native `<input>` may still exist underneath for the keyboard and
for assistive technology, invisible or wholly restyled; what the person
sees is ours.

## What the component walk found (2026-10-13, three reviewers, 74 findings)

The product-designer, UX-accessibility and React-Capacitor roles walked
every file of `src/ui/` and every design-system story
(`docs/agent-runs/mm253-components/`). Where they agreed: no control has a
pressed state and the platform's tap highlight is removed; the dropdown,
checkbox and slider are engine-drawn; overflow menus are clipped inside
groups and swipe rows and never mark the current value; the time dialog
lacks the read-back the date dialog got; overlays do not trap focus and the
options dialog cannot be cancelled; most overlays have no story; tokens are
bypassed by literal radii, gaps and durations; composites still write
their own buttons.

## The work, as tickets

- **Custom pickers, no native popup:** a date picker (MM-263), a time
  picker (MM-264), a select that opens the options sheet (MM-265).
- **Every control drawn by us:** checkbox and slider (MM-266); pressed
  state and feedback on every control (MM-267); the 48 dp floor (MM-281);
  a quiet destructive button kind (MM-280).
- **Overlays that behave:** menus that are never clipped and mark the
  current value (MM-268); focus trapped, a way out of every overlay, a
  sheet to its spec (MM-271, MM-277); a snack with an action that waits
  (MM-272).
- **The register as proof:** a story for every component and every state,
  with a coverage test (MM-273).
- **The craft underneath:** tokens honoured for radii, gaps and motion
  (MM-274); the focus ring never clipped (MM-275); Ember never a tint, the
  check never a font glyph (MM-276); composites compose and the checker
  knows a composite when it sees one (MM-278); field errors adjacent and
  spoken (MM-279).
- **The written system:** the design-system document rewritten for the
  React library with the control map and the vocabulary (MM-282).

Each bug ticket carries a regression test; each visual change is looked at
in the register in Martian, Dark and Light before it is called done. Custom
icons and illustration still wait for the app mark (MM-109); the control
drawings use the design system's tokens and the Material set.

## What was accepted, and why

Findings the chair accepted without a ticket are listed with their reasons
in `docs/agent-runs/mm253-components/decision.md`. Four need a device or a
render the reviewers did not have (a native picker opening on dialog focus,
200% text in segmented controls and menus, the light palette's field
border contrast) and are the chair's to verify; two of those go away when
the native pickers do.

## Acceptance criteria

```gherkin
Scenario: Nothing native shows
  Given any screen in any palette
  Then no native picker, list, glyph, thumb, highlight or focus ring is visible; every control's look comes from ui.css and MmIcon

Scenario: Every control, every state, in the register
  Then each component has a story showing rest, focus, pressed, disabled, error and selected where it has them, in three palettes

Scenario: The rule is enforced
  Then the architecture test fails a native date, time, select, checkbox or range control that is not wholly restyled by the design system, and a composite that writes a control
```

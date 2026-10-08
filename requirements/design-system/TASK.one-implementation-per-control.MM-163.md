---
id: MM-163
status: proposed
component: design-system
related: [MM-159, MM-160, MM-101, MM-102, MM-103, MM-104, MM-105]
---

# Task: One implementation per control; reusable parts become components

## Context
See MM-159, rules 9 and 10. Screens today write controls inline: `FilledButton`, `SegmentedButton`, `TextField`, `Card`, `ListTile`, `FloatingActionButton`, and private widgets such as `_Macro`, `_DayPicker` and `_EntryCard` that are obviously reusable. Two screens can differ in padding, radius, label style or tap behavior, and over time will.

## Decisions
Made with the product owner: the design system ensures no two views drift on sub-components (buttons, dropdowns and the like); every component within a view that could be reused becomes a design-system component.

Choices I made without asking (say if any is wrong):
- **A screen file may not use a raw Material control.** The list is `FilledButton`, `ElevatedButton`, `OutlinedButton`, `TextButton`, `IconButton`, `FloatingActionButton`, `DropdownButton`, `DropdownMenu`, `SegmentedButton`, `Switch`, `Checkbox`, `Radio`, `TextField`, `TextFormField`, `Card`, `ListTile`, `Chip`, `NavigationBar`, `AlertDialog`, `SnackBar`, `LinearProgressIndicator`, `CircularProgressIndicator`. Screens use design-system components (`MmButton`, `MmTextField`, `MmDropdown`, `MmSurface`, `MacroBar`, …) which wrap them exactly once.
- **Where components live**: `apps/mobile/lib/src/ui/` for now, one component per file (MM-160); MM-104 confirms whether it becomes `packages/ui`.
- **Components take meaning, not styling**: an enum for kind or emphasis (`MmButtonKind.primary`), never a color, radius or padding. A component cannot be given a one-off look.
- **The reuse test** for any widget written inside a view: could another view plausibly show the same thing? If yes, it is a component now, not later. A widget used once and tied to one view's data (a screen's own composition) stays with the view, as its own file.
- **Each component appears in the gallery** (MM-105) in every state and both themes. A component not in the gallery is not finished.
- **`mm arch` enforces it**: a screen file under `apps/mobile/lib/src/` outside `ui/` that names a listed control fails, with a baseline that shrinks to nothing (the same ratchet as MM-160).
- **A control that does not exist yet** is added to the design system first, in its own change, then used.

## Description
The list and the check; the first set of components needed by the existing screens (button, text field, dropdown, switch, surface, progress bar, macro bar, notice, choice card, stat row, section label, nav, FAB); migrating the existing screens onto them. Look and behavior are specified by `design/`.

## Acceptance Criteria
```gherkin
Scenario: A raw control in a screen
  Given a screen file that uses FilledButton directly and is not in the baseline
  When "mm arch" is run
  Then it names the file, the control and the component to use, and exits non-zero

Scenario: One implementation
  Then there is exactly one place in the app that constructs a FilledButton, and it is MmButton

Scenario: No drift
  Given the same kind of button on Today and on Settings
  Then they have identical size, radius, label style and press behavior, because they are the same component

Scenario: No styling arguments
  Then no component accepts a Color, a radius or an EdgeInsets from a screen

Scenario: In the gallery
  Then every component is shown in each state, in light and dark

Scenario: A reusable part
  Given a macro bar written inside the Today screen
  Then it is a MacroBar component and Today uses it
```

## Notes
- This is what MM-104 was always meant to do; this ticket adds the enforcement and the "components take meaning" rule. Build them together.
- Dropdown, date picker and number-entry components will be needed by onboarding and settings; define them from the existing uses, not speculatively.

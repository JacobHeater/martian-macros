---
id: MM-282
component: design-system
status: proposed
related: [MM-262, MM-261, MM-236, MM-101]
---

# Task: the design-system document written for the React library

## Why

`design/design-system-implementation.md` is the Flutter plan (ThemeData,
pubspec). Nothing documents the React library: which component owns which
control, what a composite is, the prop vocabulary (`label` visible, `name`
spoken, `valueText`; `selected`, `chosen`, `current`; `onPress`,
`onSelect`), or the owner's rule that nothing native shows (React-Capacitor
RC-16). `visual-language.md` still says selected nav destinations use the
filled icon variant, which MM-236 decided against (PD-23).

## What to write

- Rewrite `design-system-implementation.md` for the React library: the
  control map (`controlHomes`) as its table; the definition of a composite;
  the vocabulary; "nothing native shows" with what may still exist
  underneath for the keyboard and assistive technology; the state set every
  control draws; how a component gets its story and its tests.
- Amend `visual-language.md`'s icon sentence to the Outlined-only decision.
- Mark the Flutter text historical or remove it.

## Acceptance criteria

```gherkin
Scenario: One document for the library
  Then design/design-system-implementation.md describes the React library and names every control's home

Scenario: The icon sentence matches MM-236
  Then visual-language.md says the Outlined set is the one family, selected or not
```

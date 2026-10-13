---
id: MM-277
component: design-system
status: proposed
related: [MM-262, MM-260, MM-102]
---

# Bug: the sheet and the cards do not match their written spec

## What the walk found

`--radius-sheet-top: 24px` is declared and used nowhere; `.mm-sheet` uses
the group radius, sits on `--overlay` where both design docs say sheets
are `raised`, and has no shadow where the visual language gives Light
sheets one (PD-10). The dialog was lifted in MM-260; the sheet still floats
on the scrim alone. Cards lack the per-theme elevation the docs specify:
Light cards a hairline and soft shadow, Dark cards a 1 dp top highlight;
only the hero has them (PD-11).

## The fix

`.mm-sheet`: top radius from `--radius-sheet-top`, background `--raised`,
the Light shadow. `.mm-surface` and `.mm-list-group`: the hero's per-theme
elevation rules. Looked at in the register in all three palettes.

## Regression test

`test/ui/elevation.test.ts` reads the stylesheet for the sheet's radius
token and background, and the Light shadow and Dark highlight on surface,
list group and sheet.

## Acceptance criteria

```gherkin
Scenario: The sheet to spec
  Then .mm-sheet uses --radius-sheet-top and --raised, and has the Light shadow

Scenario: Cards to spec
  Then surfaces and list groups carry the Light shadow and the Dark highlight
```

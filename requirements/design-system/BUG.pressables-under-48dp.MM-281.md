---
id: MM-281
component: design-system
status: proposed
related: [MM-262, MM-106, MM-104]
---

# Bug: action chips and compact segments are under the 48 dp floor

## What the walk found

`MmActionChip` on `.mm-chip` is 32 dp tall (recents in Add food, the
easy-to-miss line) and compact segments are 40 dp (PD-9, UX-12). The
repository's rule is 48 dp for anything pressable. The owner decided on
2026-10-13: 48 dp for everything pressable.

## The fix

Action chips get a 48 dp hit area (a 40 dp look is allowed with padding
making up the target); compact segments become 48 dp with tighter
padding; spacing between targets stays 8 dp.

## Regression test

`test/ui/targets.test.ts` reads the stylesheet: no rule with `cursor:
pointer` sets `min-height` under 48px, and pressable chips declare the
hit-area padding.

## Acceptance criteria

```gherkin
Scenario: Every pressable is 48 dp
  Then no pressable rule sets a min-height under 48px
```

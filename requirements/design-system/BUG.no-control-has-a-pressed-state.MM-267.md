---
id: MM-267
component: design-system
status: done
related: [MM-262, MM-104, MM-181]
---

# Bug: no control has a pressed state, and the platform's tap feedback is removed

## What the walk found

`ui.css` has one `:active` rule, the add icon button's plate; `base.css`
sets `-webkit-tap-highlight-color: transparent`. So on Android a tap on any
button, chip, segment, row, option, menu item, nav destination, choice
card, pressable surface, status row or disclosure gives no visual sign it
landed until state changes (product-designer PD-3, UX-14).
`interaction-and-motion.md` requires an immediate pressed state on every
control and the primary button depressing to 98% in the fast duration.

## The fix

One pressed-state family in `ui.css`: the primary and floating action
scale to 98% over `--motion-fast`; every other pressable fills with
`--selected` (or `--text` at 8%) while pressed; under reduced motion the
fill stays and the scale goes. Tap highlight stays off because ours
replaces it.

## Regression test

`test/ui/pressedStates.test.ts` reads the stylesheet: every rule that sets
`cursor: pointer` has a matching `:active` rule, and the reduced-motion
block keeps a non-moving change.

## Acceptance criteria

```gherkin
Scenario: Every pressable presses
  Then every class with cursor: pointer has an :active rule

Scenario: The primary depresses
  Then .mm-button-primary:active and .mm-fab:active scale to 0.98 over --motion-fast

Scenario: Reduced motion
  Then under prefers-reduced-motion the fill remains and the scale is removed
```

## Progress

Built 2026-10-13: one pressed family at the foot of `ui.css`. Every selector with `cursor: pointer` has an `:active` rule and a `.mm-pressed` twin (the States story uses it); the primary button and the floating action depress to 98% over `--motion-fast`, every other pressable fills `--selected`, the switch and check box gain a `--selected` halo, the slider's thumb grows; under reduced motion the scale goes and an opacity change stays. Tests: `test/ui/pressedStates.test.ts`.

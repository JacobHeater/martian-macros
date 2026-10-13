---
id: MM-275
component: design-system
status: proposed
related: [MM-262, MM-239, MM-106]
---

# Bug: the focus ring is clipped inside groups that hide overflow

## What the walk found

The app-wide focus ring is 2 px outside the element. Rows fill
`MmListGroup`, segments fill `.mm-segmented`, content fills the flush
surface, the hero and the swipe row, all `overflow: hidden`; the ring's
sides, and the first and last row's top and bottom, fall outside the clip
(product-designer PD-6; UX asked to challenge, and agrees the ring must
never be partly hidden). `interaction-and-motion.md`: the focus ring is
never removed.

## The fix

Focusables inside a clipping container draw an inset ring
(`outline-offset: -2px`, or a box-shadow inset) so the whole mark is
visible, in every palette.

## Regression test

`test/ui/focusRing.test.ts` gains a rule: every container rule with
`overflow: hidden` has a matching inset focus rule for its interactive
children.

## Acceptance criteria

```gherkin
Scenario: Whole ring in a group
  Given a row in a list group is focused by keyboard
  Then the entire focus mark is visible

Scenario: Whole ring in a segmented control
  Given a segment is focused
  Then the entire focus mark is visible
```

---
id: MM-187
status: done
component: design-system
related: [MM-101, MM-107, MM-148, MM-163, MM-176, MM-184]
---

# Story: One calorie visual, the arc, everywhere a day's calories are shown

## Context
The horizon arc is the app's signature graphic (MM-107): calories eaten as a body travelling along a shallow arc, inside the calorie
hero. Two screens had drifted from it. The Dashboard used the hero in a "compact" form with the arc left out, and the Coach screen drew
its own hero card with a big number and no arc. The same information looked different on three screens.

The product owner's rule: **the only visual for a day's calories is the arc, and its component is the only one in the app.**

## Decisions
- **`CalorieHero` is the one component** for a day's calories. It has no compact variant: the arc is always drawn.
- **The Dashboard, the Food screen and the Coach screen all use it.** The Coach screen shows today's calories against the targets in
  force (the maintenance guide during a pause, MM-148), then a card of what is particular to targets: the protein minimum, the
  intended pace, the next check-in, confidence and any flags.
- **The architecture check enforces it**: `MmHeroSurface` and `HorizonArc` can be named only in the design-system folder, the calorie
  hero, and the welcome step's brand art. A screen that builds its own calorie hero fails `mm arch`.
- **Charts over time are not this component.** The history lines on the Dashboard (calories against target over a range) are a trend,
  not a day's calories, and are unchanged. Say if the owner wants them held to the same rule.

## Description
`CalorieHero` loses `compact`; the Dashboard and Coach screens use it; an identifier rule guards it.

## Acceptance Criteria
```gherkin
Scenario: The arc on every screen that shows a day's calories
  Given the Dashboard, the Food screen or the Coach screen
  Then each shows exactly one horizon arc

Scenario: The Coach screen
  Given targets are in force
  Then the Coach screen shows the calorie hero for today against them
  And does not draw a second calorie figure of its own

Scenario: A paused day
  Given a pause is running
  Then the Coach screen's hero shows the maintenance guide and never calls the day over

Scenario: No second hero
  Given a screen that builds its own calorie hero
  Then mm arch fails
```

## Notes
- Regression tests: `apps/mobile/test/one_calorie_visual_test.dart` (one arc on each of the three screens, none doubled; a pause on
  the Coach screen) and `tool/test/arch_rules_test.dart` (the rule is in the default set). Both fail with the old code.
- Screenshots of the Dashboard and Coach screens change; they are regenerated in CI and reviewed in the pull request.

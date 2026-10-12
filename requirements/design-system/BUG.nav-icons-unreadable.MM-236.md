---
id: MM-236
component: design-system
status: done
related: [MM-104, MM-237]
---

# Bug: the hand-drawn icons are unreadable, so the set becomes Material

## What happened

The owner looked at the navigation bar and could not read two of the five
icons: "The food icon looks like a fork with a spoon turned sideways, and
the Train icon looks like hammers fucking each other." The icons were
hand-drawn stroke paths carried over from the Flutter app, and the two
worst were the two most used.

## The decision

The owner's call (2026-10-12): icons use a standard SVG icon set — Material
(the MUI icon library). No more hand-drawn glyphs.

## What is right

Every `MmIcon` name maps to an icon from `@mui/icons-material`'s Outlined
set, chosen for meaning: `food` is Restaurant (upright fork and knife),
`train` is FitnessCenter (one dumbbell). Screens keep using `MmIcon` by
name; nothing outside `src/ui/` imports the vendor package, which the
layers test enforces.

## Acceptance criteria

```gherkin
Scenario: food and train read at a glance
  When the navigation bar is drawn
  Then the Food icon is Material's Restaurant and Train is FitnessCenter

Scenario: the set is the standard one
  When any MmIcon name is drawn
  Then its shape is the Material Outlined icon mapped in src/ui/mmIcons.tsx,
  And only src/ui/ imports @mui/icons-material

Scenario: every name still renders
  When each MmIcon name is rendered
  Then an svg appears, hidden from the accessibility tree
```

## Regression test

`apps/mobile/test/ui/mmIcon.test.tsx`: every name renders, and `food` and
`train` are exactly Material's Restaurant and FitnessCenter shapes.

## Progress

**Fixed (2026-10-12).** `MmIcon` draws Material Outlined icons through the
`mmIcons` map; the icon strokes CSS became fill-based. Looked at in the
browser in Storybook's icon catalog and on the app's navigation bar
(MM-237 is the catalog's ticket).

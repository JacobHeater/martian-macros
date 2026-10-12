---
id: MM-89
status: in-progress
component: app-shell
related: [MM-90, MM-91, MM-92, MM-93, MM-41, MM-17, MM-22, MM-80, MM-97, MM-99, MM-101]
---

# Epic: The app shell

## Context
The parts of the app that belong to no single feature: how the user moves between screens, how the app looks, how it rewards them, and how
well the screens are tested.

## Narrative
Three tabs (Today, Progress, Coach) with Settings behind a gear, and a calendar day that rolls over while the app stays open (MM-90). A
light and a dark theme, of which only the light one has been looked at (MM-91). No rewards yet, and firm rules about what may and may not
be rewarded when there are (MM-92). And a list of screens and behaviors that shipped without a test or a look on a device (MM-93).

The navigation is about to change: the app will start on a dashboard, with Food, Progress and Coach as the other destinations and Train
joining with the training log (MM-97, MM-99). The look of every screen moves onto a shared design system (MM-101).

## Acceptance Criteria (narrative)
The Epic is done when every screen has been seen in both themes on a small and a large phone, every interactive behavior listed in MM-93 is
covered by a test, and what the app celebrates follows the rules in MM-92.

## UI/UX Assets

- [First launch and gates](../ui-ux-assets/views/onboarding.html#app-loading)
  — Current. Draws AppRoot as built on 2026-10-11: loading, data error, theme
  error. Drawn from the source alone; not compared with the running app. Which
  gate is shown first is described on the flows sheet, not drawn as one frame.
  It shows what exists and approves nothing.

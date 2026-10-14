---
id: MM-292
component: design-system
status: done
related: [MM-237, MM-291, MM-293]
---

# Bug: the Dashboard on a morning before the weigh-in had no story

## What the owner found

The phone showed a Dashboard Storybook never drew (2026-10-14): both
Today stories have a weigh-in saved for the story's day, so the
weigh-in field (MM-291) was never in the register and its layout was
never looked at. Storybook and the app disagreed, which means the screen
was not designed in Storybook.

## The fix

`Screens/Today/Not Weighed Today` (`notWeighedTodayScenario`: onboarded
yesterday, weighed yesterday, nothing today) draws the state a person sees
most mornings. The Dashboard's three states each have a story: first day,
not weighed today, and the demo.

## Regression test

`test/gallery/stories.test.tsx` draws and walks every story; the new
story's `shows` is the weigh-in hint, so the story fails if it stops
drawing the weigh-in.

## Acceptance criteria

```gherkin
Scenario: The morning before the weigh-in is in the register
  Given the Storybook
  Then Screens/Today has a story with no weigh-in today
  And it shows the weigh-in field
```

## UI/UX

Storybook: Screens/Today/Not Weighed Today.

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm291-weigh-in/`).

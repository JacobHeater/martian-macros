---
id: MM-356
status: done
component: developer-tooling
related: [MM-237, MM-321, MM-326]
---

# Task: Storybook says who each story's person is

## Context
The product owner, 2026-10-16, looking at the story "Entry Menu": its Water section had no bar, while the
water stories had one. The reason, that the demo person has no water goal and the water stories give theirs
one, was only in the stories' code: "Is there some way in storybook you could have made that clearer?" The
owner chose a panel of facts beside every story.

## Description
Storybook has a "Person" panel. For a screen story it lists, from what the story's scenario stored: who the
person is, when they started, their goal, units, detail level, macro picture, water goal, sodium limit, health
check answers, weigh-ins, food logged in the last 30 days, water today, workouts, a pause today, targets, and
whether the story alters storage or gives a device. A story that is not a screen says it draws no person. The
facts are read when the story is drawn, so they cannot go stale, and nothing is drawn on the phone frame.

## Acceptance Criteria
```gherkin
Scenario: A screen story
  When a screen story is opened in Storybook
  Then the "Person" panel lists its person's facts, read from what its scenario stored

Scenario: No water goal
  Given the demo person, with no water goal
  Then the panel says "Water goal: Off"

Scenario: Not a screen
  When a component story is opened
  Then the panel says no person is drawn
```

## Notes
`src/gallery/screens/storyFacts.ts` works the facts out; `StoryApp` sends them over Storybook's channel
(`announceStoryFacts`, `storyFactsEvent`), and `.storybook/manager.tsx` draws the panel. Guarded by
`apps/mobile/test/gallery/storyFacts.test.ts`. An audit of all 249 screen stories with these facts found the
discrepancies ticketed as MM-357.

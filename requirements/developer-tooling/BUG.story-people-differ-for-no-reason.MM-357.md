---
id: MM-357
status: done
component: developer-tooling
related: [MM-356, MM-313, MM-326]
---

# Bug: the stories' people differ in ways their stories are not about

## Context
The product owner, 2026-10-16: "you must bring all views in to compliance with each other. Please inspect the
storybook for other such discrepancies." An audit of the facts of all 249 screen stories (MM-356) found:

- **Water goal**: off for 226 stories, so the Water section has no bar except in the water stories. To be
  settled by the goal being on by default (MM-358).
- **Units**: 223 stories are imperial; 12 are metric (nine water stories, two Coach recomp stories, one height
  story) though most are not about units, so their screens read differently from the rest for no reason.
- **Water goal amounts**: the stories that set one use six different amounts (2.5 L, 128 fl oz, 1.5 L, 2 L,
  68 fl oz, 5 L); only "Water Goal High" is about its amount.

What does vary for a reason (detail level and macro picture in the micros stories, a minor in "Adults Only",
health answers in the care-team stories) is each story's subject.

## Description
Every screen story's person is the demo person, imperial, with the default water goal, except in what the
story is about; a story about something else changes nothing else.

## Acceptance Criteria
```gherkin
Scenario: A story about something else
  Given a screen story not about units or the water goal
  Then its person's units and water goal are the demo person's

Scenario: A story about the amount
  Given a story about a high water goal
  Then only its water goal differs from the demo person's
```

## Progress (2026-10-20, feat/m2)
MM-358 was done, so this was buildable. Built:

- `screenStory` takes `about: ('units' | 'waterGoal')[]` (`StorySubject.ts`): what a story's person differs in
  from the demo person, being what the story is about. The scenario and the subject travel in the story's
  parameters.
- The twelve stories brought back to the demo person: the nine water stories (`Screens/Food` Water Goal
  Reached, Water Other Refused, Water Goal Set None, Water Goal Partway, Water Edit, Water Bar, Water Bar
  Folded, Water Bar Nearly There; `Screens/Today` Water Glass Added), the two Coach recomp stories
  (`recompScenario` is imperial now) and `Screens/Settings` Water Goal High, which keeps its 5 L (169 fl oz)
  goal and nothing else. The bar stories use the goal suggested for the first-day person (12 glasses) and
  vary the drinks instead of the goal; Water Goal Reached adds a bottle to the demo's day instead of
  lowering the goal.
- Declared subjects: Water Other Amount and Change Height Metric (`units`); Nutrition Goals, Water Goal Own
  Amount, Water Goal Back To Suggested and Water Goal High (`waterGoal`, an amount of their own).
- Guard: `apps/mobile/test/gallery/storyPeople.test.ts` runs every screen story's scenario and checks its
  person's units and water goal against the demo person's outside its declared subjects, and that a declared
  subject is one the person differs in. It failed on the twelve before the fix.
- Found in passing: the Person panel's water goal before the coach's first targets, MM-422.

Decided here (say if wrong): a goal withheld by the health check (kidney disease, a clinician's limit) is
not a difference the guard counts, since the health check is those stories' subject and the goal follows it.

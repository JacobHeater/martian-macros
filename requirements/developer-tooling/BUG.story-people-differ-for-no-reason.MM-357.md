---
id: MM-357
status: proposed
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

## Notes
Not yet guarded: the test lands with the fix, checking every screen story's facts against the demo person's
outside each story's declared subject. Waits for MM-358, which sets the default goal.

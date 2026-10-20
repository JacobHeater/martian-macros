---
id: MM-422
status: done
component: developer-tooling
related: [MM-356, MM-357, MM-358]
---

# Bug: the "Person" panel's water goal is wrong before the coach's first targets

## Context
Found closing MM-357 (2026-10-20). The Storybook "Person" panel (MM-356) works a story's suggested water goal
out from the targets its scenario stored. A first-day person has none stored: the coach issues the first
targets when the app opens, and the suggestion (MM-358) follows the protein target in them. So the panel
said "72 fl oz, suggested" for the first-day stories while the Food screen's Water section said 96 fl oz
and 12 glasses.

## Description
When no targets are stored, the panel says the goal is suggested from the targets the coach issues on
opening, and names no amount. With targets stored it names the amount, as before.

## Acceptance Criteria
```gherkin
Scenario: No targets stored yet
  Given a person set up today with no targets record
  Then the "Water goal" fact is "Suggested, from the targets the coach issues on opening"

Scenario: Targets stored
  Given a person with a targets record
  Then the "Water goal" fact names the amount and says "suggested"
```

## Progress (2026-10-20, feat/m2)
Built in `apps/mobile/src/gallery/screens/storyFacts.ts`. Guarded by `apps/mobile/test/gallery/storyFacts.test.ts`
("with no targets stored, the suggested goal names no amount the screen would contradict"), which failed before
the fix (it said "72 fl oz, suggested"). Decided here (say if wrong): the panel names no amount rather than
working the coach's first targets out itself, so it never disagrees with the screen.

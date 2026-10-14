---
id: MM-293
component: developer-tooling
status: done
related: [MM-237, MM-253, MM-291, MM-292]
---

# Task: every design goes through Storybook and the panel before it is built

## The owner's rule (2026-10-14)

"I demand all designs to first be in Storybook, you inspect your design
there, have the panel debate its merits, and then build for the spec if
it passes the UX guard." Storybook is not optional, and a screen state
the phone can show without a story is a defect (MM-292).

## What is built

`AGENTS.md`'s delivery workflow states the order: (1) the design is drawn
in a story, in every state the screen can be in; (2) it is looked at in
the browser in the three palettes; (3) the panel's product-designer and
UX-accessibility roles review it, and every finding gets an outcome in
`docs/agent-runs/`; (4) the spec is built only once the UX guard (the
UX-accessibility role) has no open blocking finding. Words are the
domain's own ("split", not "share").

## Acceptance criteria

```gherkin
Scenario: The order is written down
  Given AGENTS.md
  Then its delivery workflow lists story, inspect, panel, build in that order
  And says a phone state with no story is a defect

Scenario: The first change under the rule
  Given MM-290 and MM-291
  Then their run folder holds the before story, the panel's findings and outcomes, and the after story
```

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm291-weigh-in/`).

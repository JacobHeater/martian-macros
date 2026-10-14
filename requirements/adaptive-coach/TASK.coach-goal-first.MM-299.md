---
id: MM-299
component: adaptive-coach
status: done
related: [MM-256, MM-253]
---

# Task: the goal is the first section of Coach, under the figures and the warnings

## The owner's decision (2026-10-14)

"Goal should be the first thing on the Coach tab underneath the metrics
and warnings." It sat near the bottom, after the metabolism and the
confidence sections.

## What is built

On Coach, in order: the safeguards, the hero and its target flags, then
the Goal section (with "Change goal", so the action names its object,
UX-7), then the one thing to do and the rest as before. Story:
`Screens/Coach/Check In Due` draws the goal with the one thing to do.

## Acceptance criteria

```gherkin
Scenario: The goal comes first
  Given the Coach tab with targets
  Then the first section after the hero and its warnings is the goal
  And the one thing to do follows it
```

## UI/UX

Storybook: Screens/Coach/Coach.

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm298-trend-goal-themes/`).

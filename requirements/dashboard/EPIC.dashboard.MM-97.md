---
id: MM-97
status: proposed
component: dashboard
related: [MM-98, MM-99, MM-100, MM-89, MM-90, MM-41, MM-17, MM-22, MM-101]
---

# Epic: The dashboard

## Context
The app currently opens on the Today tab, which is the food log. That answers "what have I eaten?" and nothing else. To see whether they
are on track a user has to visit three tabs: Today for intake, Progress for the trend, Coach for targets and the next check-in.

## Decisions (made with the product owner)
- **The app starts on a dashboard: a landing page.** The other views (Food, Coach, and so on) are separate icons on the navigation bar.

## Narrative
The dashboard is the answer to "how am I doing?" in one screen, and the place the most common actions start from. It summarizes; it does
not replace. Each summary leads to the screen that has the detail.

- What it shows, and in what order (MM-98).
- The navigation bar that goes with it: Dashboard first, then Food, Progress and Coach, with Train joining when the training log exists
  (MM-99).
- The actions it offers directly: log a food, record a weigh-in (MM-100).

It is built from the design system's components (MM-101), and is the first screen designed with that system rather than before it.

## Acceptance Criteria (narrative)
The Epic is done when the app opens on the dashboard; a user can tell from it, without scrolling on a typical phone, how today's eating
compares with their targets, where their weight trend is heading, and what the coach is doing; and the two most frequent actions (logging
a food, recording a weigh-in) each start with one tap from it.

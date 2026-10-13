---
id: MM-256
component: coach-insights
status: proposed
related: [MM-253, MM-224, MM-138, MM-139, MM-141, MM-149, MM-116, MM-33]
---

# Story: the Coach screen in tiers

## What is built

- **The hero**: this week's targets with the pace on one line, the next
  check-in, and the confidence word, as the top of the screen today, with
  the arc drawn small as the signature.
- **One thing to do**: the single most useful action (the check-in due, the
  recovery questions, an offer, an insight) as one row under the hero with
  its icon; everything else waits its turn (MM-141's rationing already
  decides the order).
- **Sections with icons**: Last change, Adherence, Recovery, Reports, Goal
  and body, each a header with a leading icon and rows beneath, not a
  card; the ones with nothing new are collapsed with a one-line summary.
- **Tertiary**: "What this rests on" (the four confidence parts), the
  metabolism range and the evidence lines stay one tap down.
- **Cautions** keep their notice style and gain their icon.

## Acceptance criteria

```gherkin
Scenario: One thing to do
  Given a check-in summary unseen and an insight due
  Then one row under the hero names the check-in, and the insight is in its section

Scenario: Collapsed when quiet
  Given no recovery check-in due and no report ready
  Then Recovery and Reports are one-line summaries that open on press

Scenario: Nothing lost
  Then every card the old screen showed is reachable within one tap
```

## UI/UX

`apps/mobile/src/gallery/screens/Coach.stories.tsx` (Coach), before and
after.

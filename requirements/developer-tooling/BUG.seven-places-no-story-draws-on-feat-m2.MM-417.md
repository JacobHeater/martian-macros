---
id: MM-417
status: proposed
component: developer-tooling
related: [MM-321, MM-292, MM-134, MM-130, MM-158]
---

# Bug: seven places on feat/m2 that no story draws

## Context
Found in passing by the sleep workstream on 2026-10-20 while running
`npm run unseen` (MM-321) on `wt/sleep`. The check names seven places of
markup no story reaches. None is in a file the sleep lane touched; running the
Train and Coach stories under coverage on an export of `feat/m2` at 24130ec,
before any sleep change, gave the same counts for each, so the branch the
sleep lane started from already fails the check. The register
(`apps/mobile/test/gallery/unseen.json`) does not name them, and must not be
made to (AGENTS.md: draw the state).

The places, as the check names them:
- `src/coach/CoachScreen.tsx: {notTraining ? <p className="app-caption">{trainingMeaning}</p> : null}` (the goal sheet for someone who does not train, MM-134)
- `src/coach/MaintenanceCard.tsx: <p className="app-text">` and its second instance (MM-130)
- `src/coach/TargetChangeSheet.tsx: {leftDeficit ? <p className="app-text">{reboundText(new Fmt(units))}</p> : null}` (the rebound note on leaving a deficit, MM-130)
- `src/onboarding/GoalStep.tsx: <>` and `{notTraining ? <p className="app-caption">{trainingMeaning}</p> : null}` (MM-134)
- `src/train/TrainScreen.tsx: <p className="app-lead train-intro">` (Train with no finished workout; no Train story opens the screen with none)

## Description
Each place is drawn by a story in the state it shows, so `npm run unseen`
passes on `feat/m2` without a register entry. Which lane drew them first is
for the integrator: they arrived with other workstreams' merges.

## Acceptance Criteria
```gherkin
Scenario: Every part drawn
  Given feat/m2 with this ticket's stories
  When npm run unseen runs
  Then it passes, and test/gallery/unseen.json names none of the seven places
```

## Notes
The guard is the existing check itself (`scripts/check-unseen.mjs` over
`test/gallery/stories.test.tsx` under coverage), which fails today with
exactly these seven lines; no other test is needed. Not fixed by the sleep
lane: the screens belong to other workstreams in flight on feat/m2.

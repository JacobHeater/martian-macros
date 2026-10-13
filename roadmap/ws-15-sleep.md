# WS-15: Sleep

**Order** 15 · **Group** C · **State** not started · **Risk** medium

## Summary
Sleep as a first-class signal: a nightly record from a wearable or by hand,
sleep disorders in the health check, and a coach that reads it (MM-249).

## Why this is a workstream
The owner decided on 2026-10-13 that sleep is a first-class citizen of fat
loss in this app, overruling the earlier placement as one weekly question.
The work spans the health platforms (WS-11), the screening answers (WS-05)
and the coach's rules (WS-09), so it has a lane of its own rather than three
tails. The evidence that moved it is in MM-249.

## Capability it unlocks
The coach can say, with sources, when short sleep is working against a
deficit, and offer the gentler pace; the person can see their sleep beside
their other records without a score.

## Included
- A `sleep_nights` table, one migration, a reader with both implementations
  under one contract (MM-250).
- Health Connect and HealthKit sleep sessions as a granted type; a typed
  "last night" card (MM-250).
- A diagnosed sleep disorder in the health check and the re-check,
  refer-only (MM-251).
- The check-in pre-fill, the relief signal, explanations, the offer, the
  Coach line and one insight (MM-252).

## Excluded or deferred
- Sleep stages, device "quality" scores, and any screening questionnaire.
- A target change on sleep alone: the owner's decision after the panel.
- Treating a diagnosed disorder as a reason to change the numbers: after
  MM-29's reviewer and the panel.

## Prerequisites
The health-source interface and fake (MM-67, done); the relief rule
(MM-117, built); the schema lane free.

## Enables
Nothing else blocks on it.

## Packages and surfaces
- `apps/mobile/src/domain/` (the record, the reader, the screening answer)
- `apps/mobile/src/healthIngest/` and the `MmHealth` plugin (`sleep`)
- `apps/mobile/src/data/` (one migration)
- `apps/mobile/src/engine/` (the relief signal, explanation lines, the insight rule)
- `apps/mobile/src/progress/`, `coach/`, `onboarding/HealthStep.tsx`, `settings/`
- `docs/evidence.md`

## Risks
- **Health Connect sleep sessions are fragmented** (several per night, from
  several apps): sum per night, first source wins, as MM-71 does for
  weight.
- **The claims**: sleep attracts marketing language; MM-108's voice test
  and MM-96's review apply to every sentence.
- **The schema lane**: one change in flight at a time.

## Sequence
1. **The record, imported and typed (MM-250).** M2.
2. **The health-check item, refer-only (MM-251).** M2. Beside step 1; no
   shared files but the setup answers.
3. **The coach reads it (MM-252).** M2. After step 1; after the panel pass
   MM-249 asks for, in grading mode.

## Done enough to unblock others
Nothing waits on it.

## Do not start before this
Step 3 before the panel pass: the thresholds need evidence rows first.

## Parallel with
WS-09 and WS-11, with the coordination in `coordinationHotspots`.

## Requirement sources
- Remaining: MM-250, MM-251, MM-252. Epic: MM-249.

## Notes for whoever builds it
- The night belongs to the day it ends on.
- Hours and minutes, never a score, never a colour.
- The relief rule gains a signal, it does not gain a line (MM-117 today
  appends a sentence; MM-252 replaces that).

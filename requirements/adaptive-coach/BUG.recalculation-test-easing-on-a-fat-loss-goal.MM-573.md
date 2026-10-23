---
id: MM-573
status: done
component: adaptive-coach
related: [MM-559, MM-130]
---

# Bug: MM-559's tests and story set up states the app does not reach

## Context
Found when main's CI went red after MM-559 merged (PR #298). The test "leaves a day that already has new targets, a running
break and the first step out of a deficit as they are" in `apps/mobile/test/engine/recalculation.test.ts` gave its
first-step-out-of-a-deficit case (an `easingIn` record at maintenance) a person whose goal was still fat loss. That is a goal
change waiting to apply, and a goal change applies at once in `nextTargets` (MM-130), before the recalculation is considered,
with or without a recalculation. So the test got a `goalChange` record where it expected none. The engine was right; the
fixture was not a state the app reaches, since easing in only happens on the way to a maintenance goal.

The same PR's `CheckInNowOff` story (`apps/mobile/src/gallery/screens/Coach.stories.tsx`) failed the same way: its scenario
(`checkInNowScenario`) recorded nothing at all for the last nine days, weigh-ins or food. That is a gap away from the app, so
the welcome-back screen (MM-147) rightly took the first opening and the Coach's notice was never drawn. The app was right; the
scenario described someone who had been away, not someone who logs every day and has not weighed in for a week.

## Description
The first step out of a deficit is tested with the goal it belongs to, maintenance, and a recalculation then changes nothing.
A goal changed back during that step still applies at once, as it does without a recalculation, and it is not counted as a
recalculation.

The "Check in now" stories draw a person who logs food every day, so a weigh-in more than seven days old shows the Coach with
the button off and its notice, not the welcome-back screen.

## Acceptance Criteria
```gherkin
Scenario: Checking in during the first step out of a deficit
  Given a maintenance goal and the first of two steps out of a deficit, three days old
  When the person asks for a recalculation
  Then no new targets are made

Scenario: The off story shows its notice
  Given food logged every day and the last weigh-in nine days ago
  When the Coach opens
  Then "Check in now" is off and the notice says the last weigh-in is more than 7 days old

Scenario: A goal changed back during the first step out of a deficit
  Given the first of two steps out of a deficit, three days old, and a fat-loss goal chosen since
  When targets are worked out, with or without a recalculation
  Then new targets effective today are made for the goal change, not as a recalculation
```

## Notes
- Fixed in `apps/mobile/test/engine/recalculation.test.ts` (the easing case now uses a maintenance goal); no engine change.
  Regression tests: "leaves a day that already has new targets, a running break and the first step out of a deficit as they
  are" and "a goal changed back during the first step out of a deficit applies at once, as without a recalculation (MM-573)"
  in `apps/mobile/test/engine/recalculation.test.ts`. Not run locally; CI validates.
- Story fixed in `apps/mobile/src/gallery/screens/checkInNowScenario.ts` (food logged every day to today); no app change.
  Guarded by the `CheckInNowOff` story (`shows: /your last weigh-in is more than 7 days old/`) in
  `apps/mobile/src/gallery/screens/Coach.stories.tsx`, run by "every story > draws, and shows what it says it shows" in
  `apps/mobile/test/gallery/stories.test.tsx`. Not run locally; CI validates.

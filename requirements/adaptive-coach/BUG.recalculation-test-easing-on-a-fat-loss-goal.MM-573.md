---
id: MM-573
status: done
component: adaptive-coach
related: [MM-559, MM-130]
---

# Bug: The recalculation test eased into maintenance on a fat-loss goal

## Context
Found when main's CI went red after MM-559 merged (PR #298). The test "leaves a day that already has new targets, a running
break and the first step out of a deficit as they are" in `apps/mobile/test/engine/recalculation.test.ts` gave its
first-step-out-of-a-deficit case (an `easingIn` record at maintenance) a person whose goal was still fat loss. That is a goal
change waiting to apply, and a goal change applies at once in `nextTargets` (MM-130), before the recalculation is considered,
with or without a recalculation. So the test got a `goalChange` record where it expected none. The engine was right; the
fixture was not a state the app reaches, since easing in only happens on the way to a maintenance goal.

## Description
The first step out of a deficit is tested with the goal it belongs to, maintenance, and a recalculation then changes nothing.
A goal changed back during that step still applies at once, as it does without a recalculation, and it is not counted as a
recalculation.

## Acceptance Criteria
```gherkin
Scenario: Checking in during the first step out of a deficit
  Given a maintenance goal and the first of two steps out of a deficit, three days old
  When the person asks for a recalculation
  Then no new targets are made

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

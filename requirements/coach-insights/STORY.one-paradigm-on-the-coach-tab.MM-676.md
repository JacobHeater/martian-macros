---
id: MM-676
status: done
component: coach-insights
related: [MM-667, MM-299, MM-553, MM-583, MM-402, MM-253]
---

# Story: one paradigm on the Coach tab, in the owner's order

## Context
The owner (2026-10-28), after the Coach and Progress tabs were consolidated (MM-667): "now the paradigm is
inconsistent. we have cards and collapsibles. i want all collapsibles with the only cards being the hero and the
executive summary at the top. heads up is collapsible but i like the design of the others. the ordering shall be:
Hero section, executive summary, goal, coach's feedback, body measurements and weigh in, targets, heads up, etc."

## Decisions
- Two cards: the calorie hero and the Executive summary (framed). Every other section is an `MmSection` on the
  canvas, collapsible, with a line under its title read while folded, as Weight events, Sleep and Waist already
  were: Goal (the goal mode; "Change goal" beside it), Coach's feedback (how many worth changing and holding up),
  Body measurements and weigh-in (the trend, or the pace in words with the weight hidden), Your targets (the
  calories and protein), Heads up (as it was, unframed), Last change (the date), Maintaining, Progress has slowed
  (the window), Recomp review and Lean gain (the week stays in the title), Your last 7 days (its first line), the
  recovery check-in and Monthly reports (as they were, unframed), Your metabolism (the daily burn), Coach confidence
  (the level stays in the title), Body (the body fat range).
- The order: the safeguards' banners, the hero, the Executive summary, Goal, the one thing to do (under the goal,
  MM-299), Coach's feedback, Body measurements and weigh-in, Your targets, Heads up with the rebound and training
  notes, then the rest in the order they had.
- Body measurements and weigh-in is one fold (`flush`) holding what Progress drew: the weigh-in field and the trend
  chart on their surface, as the waist chart has its own (a field never sits bare on the canvas, MM-291), then the
  weight events, sleep, waist, more measurements, strength trends and photos sections as they were, each its own fold.
- Every fold starts closed (the owner, the same day: "all collapsibles on the coach tab start collapsed"), the
  recovery check-in's and the Sleep and Strength trends folds inside the body too; each remembers its fold (MM-286).
  The one-thing row stays the way into a due check-in (MM-391).
- "Change goal" and "History" stand inside their folds, at the end of what they change, not beside the title (the
  owner: "History link moves inside of the collapsible … Same with Change Goal").
- The register draws what is inside the folds: a story opens the tab with `unfolded(state, tab)`, which sets
  `foldsAllOpen` so every fold starts open there (`MmFolds.allOpen`, never set by the app); the Coach and
  CoachSmallPhone stories open it plainly, as first seen. A test reads inside a fold through `openCoach()`.

## Choices made without asking
- Each fold's summary line (above): the owner named the sections and the order, not the lines.
- The one thing to do stays under the goal, as MM-299 placed it; the owner's list did not name it.

## Acceptance Criteria
```gherkin
Scenario: The order
  When the Coach tab draws
  Then the section titles run Executive summary, Goal, Coach's feedback, Body measurements and weigh-in, Your targets, and the rest after

Scenario: Two cards
  Then the hero and the Executive summary are the only cards on the body
  And every other section folds, with a line under its title, and starts closed

Scenario: The ways on
  When the Goal fold is opened
  Then "Change goal" is at its end; and "History" at the end of Last change

Scenario: The weigh-in
  Then "Today's weigh-in" and the trend stand inside the body fold
```

## UI/UX
- Coach and CoachSmallPhone — apps/mobile/src/gallery/screens/Coach.stories.tsx: the tab in the new order at the
  phone's width and at 360 px.

## Notes
- Tests: `test/coach/coachTabOrder.test.tsx`; `test/coach/coachFlows.test.tsx` and `test/coach/paceSheet.test.tsx`
  read the goal as the fold's title and summary now.
- The owner's ask: no panel. Not run locally; CI validates. Not yet seen on a phone.

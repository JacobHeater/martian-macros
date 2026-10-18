---
id: MM-394
status: done
component: developer-tooling
related: [MM-237, MM-321]
---

# Bug: story walks timed out under coverage

## Context
Found while verifying MM-393. `npm run unseen` (the story suite with coverage, part of `mm check`)
failed three workout stories (`WorkoutEditingASet`, `WorkoutOpensSuggestions`, `SetStartTime`) on main
itself, twice in two runs, on the owner's machine: each walk waited the testing library's default
second for "Set 1" or "Suggestions use…", and a covered run takes about 1.3 s to draw a workout.
Nothing was wrong with the stories; the wait was too short. The sibling `pressNamed` in the same file
already waits five seconds.

## Description
In the story suite every walk waits up to five seconds for what it finds, set once in
`test/gallery/stories.test.tsx`, so no walk's own wait decides whether a slower machine passes.

## Acceptance Criteria
```gherkin
Scenario: A covered run on a slower machine
  When the story suite runs with coverage
  Then a walk that finds its control within five seconds passes
```

## Notes
Evidence: on a clean worktree of main (1bf9ccd), two covered runs each failed the three stories; with
the wait set, they pass. Guard test: "a story walk waits at least five seconds for what it presses".

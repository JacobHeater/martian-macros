---
id: MM-580
status: done
component: design-system
related: [MM-577]
---

# Bug: the UFO is left in the page after it flies off

## Context
Found by the owner on a phone (2026-10-22): after tapping the alien, the UFO flies up above the app bar, and scrolling
back up finds it stuck there. Its flight (`mm-ufo-leave`, MM-577) ended fully drawn, 100vh above the ridge, and
`forwards` held that last frame for the five seconds the alien is away, so the UFO stayed painted wherever the flight
stopped. Under reduced motion, where the flight jumps straight to its end, the same frame was the only one shown.

## Decisions
- The owner: the UFO fades. It is fully drawn while it takes the alien and starts to climb, then fades over the
  second half of the climb and is gone at the end of the flight. The path, the timing and the five seconds away are
  unchanged.

## Description
At the end of its flight the UFO is fully transparent, so nothing of it is left in the page while the alien is away,
whether the person scrolls or not, with or without reduced motion.

## Acceptance Criteria
```gherkin
Scenario: The UFO is gone once it has flown
  Given the alien was tapped
  When the UFO's flight ends
  Then the UFO is not visible anywhere on the page until the alien comes back
```

## Notes
- Test: `test/ui/martianRidge.test.tsx` ("MM-580: the UFO has faded out by the end of its flight").
- Not run locally; CI validates. Not yet seen on a phone.

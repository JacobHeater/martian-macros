---
id: MM-577
status: done
component: design-system
related: [MM-558, MM-106]
---

# Story: Tap the alien and a UFO takes it away

## Context
MM-558 ends every Martian page on a ridge with a green alien peeking over its tallest peak. It was a stylesheet
drawing that nothing could touch. The owner, 2026-10-22: "Touching the alien causes a UFO to fly up and off screen.
The alien comes back 5 seconds later."

## Decisions
- The ridge is a design-system component, `MartianRidge`, written last in every page's body (the home destinations,
  every `Screen`, onboarding), in place of the body's `::after`. It draws only in Martian and goes under more contrast
  and forced colours, as before.
- Tapping the alien (a hit area a little larger than its 28 × 26 px) brings a UFO over the peak, a pale cone of light
  under it (owner); the alien rises up the beam into the dome, the beam goes out, and the UFO flies up and off the top
  of the page (`--motion-abduct`, 1.6 s). Five seconds after the tap the alien is back, rising from behind the peak
  on its usual loop.
- It stays decoration: hidden from a screen reader, no focus, no sound, no haptic, nothing recorded. Only the alien
  takes a tap; the ridge and the UFO let presses through.
- The ridge meets the navigation bar with no canvas between (owner, 2026-10-22, on the iPhone): in Martian the body
  has no bottom padding and the ridge no negative bottom margin; with more contrast, where the ridge is not drawn,
  the padding is back.
- Under reduced motion the alien simply goes and comes back five seconds later; nothing flies.

## Acceptance Criteria
- [x] Tapping the alien sends it away with the UFO, and it is back five seconds later (`test/ui/martianRidge.test.tsx`).
- [x] The ridge is hidden from assistive technology, and every page body ends with it (`test/ui/martianRidge.test.tsx`).
- [x] Nothing follows the ridge: the Martian body has no bottom padding (`test/ui/martianRidge.test.tsx`).
- [x] The UFO's flight takes its duration from a motion token zeroed under reduced motion (`test/ui/reducedMotion.test.ts`).

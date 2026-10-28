---
id: MM-675
status: done
component: design-system
related: [MM-271, MM-277, MM-566, MM-582, MM-666]
---

# Bug: the sheet's head scrolls away, and its drag runs through React

## Context
The owner (2026-10-28), on Food's coach breakdown with long words: "is the correct behavior of a sheet in mobile
os to have the draggable/closeable components disappear when scrolling?" It is not: on iOS the grabber is the
sheet's chrome and stays put while the content scrolls under it; Material's bottom sheet keeps its drag handle as
a fixed header. Ours scrolled away: the whole `.mm-sheet` is the scroll container and the head was an ordinary child
of it. And: "is there any way to use hardware acceleration with animation in css3 … to get the dragging close
animation to match the performance of native apps?" The drag set a React state on every pointer move, re-rendering
the sheet and everything in it per frame, and letting go past the threshold unmounted the sheet at once.

## Decisions
- The head (`.mm-sheet-head`) is `position: sticky; top: 0` on the sheet's own background, so the grip and Close
  stay at the top while the content scrolls under them; nothing else of the sheet's structure changes.
- The drag moves the panel by a `translate3d` set on the element itself, never through React, under
  `will-change: transform` with no transition (`.mm-sheet-dragging`), so each frame is the compositor's alone. Let
  go short, it springs back on a transform transition (`.mm-sheet-settling`, `--motion-base`); let go past 80 px,
  or past 24 px moving at 0.5 px/ms or faster (a flick), it slides off the bottom (`.mm-sheet-leaving`,
  `--motion-slow`) while the scrim fades (`.mm-scrim-leaving`), and `onDismiss` is called once it is off the screen
  (on `transitionend`, or at once where the token is 0 ms: reduced motion, the tests). Close, Escape and a press
  on the scrim leave the same way. The rise-in keeps its transform-and-opacity animation, compositor-friendly
  already.
- Risen once, the sheet never rises in again (`.mm-sheet-risen`, set when the rise-in ends or at the first drag):
  the drag classes carry `animation: none`, and taking them off when let go replayed the rise-in from nothing,
  which the owner saw as the sheet flashing and reloading after a drag down and back up. The sheet is on its own
  layer from the start (`will-change: transform` on `.mm-sheet`), so the first drag promotes nothing and
  re-rasterises nothing. The end of a transition counts only when it is the panel's own transform: a button's
  transition inside the sheet ends too, and bubbles.

## Acceptance Criteria
```gherkin
Scenario: A long sheet scrolled
  Given the coach breakdown on a 360 px phone, scrolled down
  Then the grip and Close stay at the top of the sheet, the words passing under them

Scenario: Dragged
  When the grip is dragged 60 px
  Then the sheet follows by a 3D transform on the element, with no React render per move
  When let go there, or dragged back up and let go
  Then it springs back on a transition, the same sheet, with no rise-in replayed
  When dragged past 80 px, or flicked, and let go
  Then it slides off the bottom and the scrim fades, and only then is it dismissed
```

## UI/UX
- MealCoachBreakdownScrolled — apps/mobile/src/gallery/screens/Food.stories.tsx: the breakdown at 360 px, scrolled.

## Notes
- Tests: `test/ui/sheetHead.test.ts` (the sticky head, the compositor rules on motion tokens),
  `test/ui/overlays.test.tsx` (the drag's transform on the element, the close).
- The owner's call-out: no panel. Not run locally; CI validates. Not yet seen on a phone.

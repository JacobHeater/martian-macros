---
id: MM-578
status: done
component: app-shell
related: [MM-90, MM-232, MM-286]
---

# Story: Swipe in from a side of the screen

## Context
The owner, 2026-10-22: "add swipe navigation to all platforms from the screen sides." Android with gesture
navigation already goes back on a swipe in from either edge, through the phone's back (MM-232). The iPhone has no
such gesture for the app's own screens, and nothing anywhere moves between the five destinations by swiping.

## Decisions
Made with the owner (2026-10-22):
- **On a pushed screen, a swipe in from the left or the right side goes back**, as the back button and the phone's
  back do. The question on top is not swiped: an open sheet or dialog covers the screen, so a swipe never starts.
- **On the five destinations, a swipe in from the right side goes to the next destination** in the bar's order, and
  one in from the left side to the one before. Nothing wraps: no swipe goes before Dashboard or after Coach.
- **What is swiped follows the finger**: the pushed screen, or the destination's page under the app bar. Let go past
  a third of the width, or a quick flick past 48 px, and it goes through; otherwise it springs back. Under reduced
  motion it comes back at once.

Choices I made without asking (say if any is wrong):
- A swipe starts only within 24 px of a side, about the width of the iPhone's own back gesture, so drags and scrolls
  elsewhere are untouched. Movement that turns out mostly up or down is a scroll and the swipe lets go.
- A control that drags sideways itself (a slider, a text field, a row swiped to remove) keeps its drag, even at
  the edge. Those carry `data-drags-sideways` or are fields.
- A mouse never swipes; touch and pen do. The web is not a product.
- The screen underneath is not shown while a pushed screen is dragged: the covered screen stays hidden, so its
  layout and scroll are not disturbed (MM-286). The canvas shows behind.
- On Android with gesture navigation, the phone's own back gesture takes the outermost strip of each side before
  the app sees it. There a swipe in still goes back (MM-232), and from a destination it leaves the app, as before;
  the destinations are swiped with button navigation, or by starting a little further in.

## Acceptance Criteria
- [x] A swipe in from either side past a third of the width closes a pushed screen; a short one leaves it
  (`test/app/edgeSwipe.test.tsx`).
- [x] A swipe that starts away from a side, turns into a scroll, or starts on a control that drags sideways does
  nothing (`test/app/edgeSwipe.test.tsx`).
- [x] On the destinations, a swipe in from the right goes to the next destination and one from the left to the one
  before, and nothing goes before Dashboard (`test/app/edgeSwipe.test.tsx`).
- [x] What springs back takes its duration from a motion token zeroed under reduced motion
  (`test/ui/reducedMotion.test.ts`).

## Owed on a phone
- The feel on the iPhone and on Android with button and gesture navigation.

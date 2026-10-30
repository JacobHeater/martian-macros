---
id: MM-711
status: in-progress
component: app-shell
related: [MM-99, MM-302, MM-373, MM-558, MM-577, MM-582, MM-703, MM-704]
---

# Bug: Two navigations: the bottom bar stayed beside the drawer

## Context
MM-704 put a drawer beside the bottom bar: the drawer held the four destinations, Profile, Library and Settings, and
the bar held the four destinations again. The owner, 2026-10-30, on the first build: "if we have a menu why do we also
have a bottom nav bar. I don't want both." The round-4 recommendation that kept the bar ("drawer, bar stays for the
daily four") was the agent's, and wrong: the owner moved to a drawer because the bar had become a liability, so the
drawer replaces it.

## Decisions
The owner's: one navigation. The bottom bar goes; the drawer is the way between destinations.

Choices made without asking (say if any is wrong):
- **`MmNavigationBar` is deleted** with its rules; `MmNavDestination` stays as the shape of a place the drawer goes to,
  and `destinations` keeps the order. The `Design system/Bars` story shows the app bar alone.
- **The edge swipes stay** (MM-582): a swipe in from a side still moves between destinations, an accelerator with the
  drawer as the visible way. The app bar's heading names the destination (on Food, the day shown, MM-390).
- **The snack and the floating action stand on the phone's safe area** (MM-302), no longer on a bar's published height;
  the body's last words clear the safe area too. In Martian the ridge meets the bottom of the screen (MM-577).
- **The stripe set** that the bar's top edge drew (MM-558) is gone from the frame: the lettering at the drawer's head
  carries its own stripes, as the brand art draws them. The violet hairline stays on the hero's edge.
- **MM-373's large-text rule for the bar's labels** goes with the bar; the drawer's rows wrap as list rows do.

## Description
No bottom bar. The menu button and the drawer are the one way between Dashboard, Food, Train and Coach.

## Acceptance Criteria
```gherkin
Scenario: No bar
  Given any destination
  Then there is no navigation landmark and no bottom bar below the body

Scenario: The drawer moves between destinations
  Given Dashboard
  When the person opens the drawer and presses "Coach"
  Then Coach is the destination, named in the app bar, and the drawer marks it current when opened again

Scenario: The snack stands on the safe area
  Then the snack host's bottom is measured from the safe area inset, not a bar's height
```

## UI/UX
- The shell without the bar — every screen story draws it; the drawer's stories are MM-704's (Drawer.stories.tsx).

## Notes
- Tests: `test/app/drawer.test.tsx` (no bar; a destination chosen), `test/app.test.tsx` (the destinations are in the
  drawer), `test/ui/snackAboveSafeArea.test.tsx` (replaces `snackAboveNavigationBar.test.tsx`), `test/app/edgeSwipe.test.tsx`
  (the current destination read from the heading); `openTab` goes through the drawer.
- Not run locally; CI validates. Owed on the phone: the body's end and the snack above the home indicator on the iPhone;
  the ridge meeting the screen's bottom in Martian.
- Supersedes MM-704's "the bar stays with its four" and MM-703's "the bottom bar keeps Dashboard, Food, Train and Coach".

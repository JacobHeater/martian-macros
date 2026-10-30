---
id: MM-704
status: in-progress
component: app-shell
related: [MM-90, MM-99, MM-232, MM-262, MM-271, MM-286, MM-373, MM-558, MM-582, MM-675, MM-703, MM-705, MM-706]
---

# Story: A side drawer beside the bar

## Context
The bottom bar holds Dashboard, Food, Train and Coach, and Settings hides behind a gear in the app bar. The person's
own foods, their profile and their settings have no place of their own; the owner (MM-703, 2026-10-30): "the nav bar is
becoming a liability. We may consider moving to a proper menu (with animations hardware accelerated)."

## Decisions
The owner's (MM-703): a drawer from the left; the bar stays with its four (*superseded the same day by MM-711: the bar goes, the drawer is the one navigation*); a menu button at the left of the app bar
opens it; a tap on the scrim or a drag back closes it; no edge swipe opens it; its head is the Martian Macros lettering;
its rows are the four destinations, Profile, Library and Settings; the last three open as pushed screens; the gear
leaves the app bar.

Choices made without asking (say if any is wrong):
- **`MmDrawer` is the sibling of `MmSheet`** (MM-271, MM-675): a panel over a scrim, labelled for a screen reader, focus
  held inside it, Escape and the phone's back (MM-232) close it, and its drag follows the finger by a transform set on
  the element itself, never through React; let go past a third of its width or on a flick, it leaves on a transition,
  otherwise it springs back. The transition takes `--motion-base`, 0 under reduced motion. It comes in from the left,
  320 px wide at most and never more than 85% of the screen.
- **The lettering** is `apps/mobile/src/assets/brand/lettering.png`, the owner's art (`design/brand/lettering-art.png`,
  1774 × 887) scaled to 1200 px wide for the bundle, drawn across the drawer's width inside the 16 px gutters, on the
  canvas colour. It is decoration: the drawer's heading "Menu" is what a screen reader hears, and the image is hidden
  from it.
- **The rows are pressed as a whole** (`MmPressable`, MM-281's 48 dp), with the destination's icon and label as the bar
  draws them, in three groups separated by a hairline: the destinations, then Profile and Library, then Settings. The
  current destination is marked as the bar marks it (`aria-current`, weight, the indicator).
- **Choosing a destination** closes the drawer and selects it in the bar (the same `select` as the bar's, so the scroll
  of the destination left is kept, MM-286). **Choosing Profile, Library or Settings** closes the drawer, then pushes the
  screen (`navigator.push`), so back returns to the destination the person was on.
- **The menu button** is an `MmIconButton` with the icon `menu`, labelled "Menu", `opens="dialog"`, in the app bar's
  `leading` slot. Focus returns to it when the drawer closes.
- **The Library row** is wired to `LibraryScreen` (MM-706); if that screen is not yet on `main` when this merges, the row
  is added in the PR that brings it. Nothing is stubbed.
- **The Progress id stays** in `DestinationId` and `HomeDestination` (it is folded into Coach today, MM-667); the drawer
  lists `destinations`, which has four.

## Description
A menu button at the left of the app bar opens a drawer from the left with the Martian Macros lettering at its head
and rows for Dashboard, Food, Train, Coach, Profile, Library and Settings. The settings gear is gone from the app bar.

## Acceptance Criteria
```gherkin
Scenario: The drawer opens from the menu button
  Given any destination
  When the person presses "Menu"
  Then a drawer labelled "Menu" is open with the lettering at its head
  And it lists Dashboard, Food, Train, Coach, Profile, Library and Settings, with the current destination marked

Scenario: A destination from the drawer
  Given the drawer is open on Dashboard
  When the person presses "Food"
  Then the drawer is closed and Food is the current destination

Scenario: A pushed screen from the drawer
  Given the drawer is open on Dashboard
  When the person presses "Settings"
  Then the drawer is closed and Settings is open with a back button
  And back returns to Dashboard

Scenario: Closing
  Given the drawer is open
  When the person presses the scrim, or Escape, or drags the drawer back past a third of its width
  Then it is closed and focus is on "Menu"

Scenario: The gear is gone
  Then no screen has a "Settings" button in its app bar

Scenario: Reduced motion
  Given reduced motion
  Then the drawer's transition takes 0 ms
```

## UI/UX
- The drawer — apps/mobile/src/gallery/screens/Drawer.stories.tsx (Stories: DrawerOpen, DrawerOpenOnFood,
  DrawerDragged). The owner dictated the feature, so the panel pass is skipped; siblings followed: `MmSheet` for the
  overlay, the bar's destinations for the rows.
- At phone width — the same file (Story: DrawerOpenSmallPhone, `viewport: 'smallPhone'`), with the lettering and every
  row at the largest text size the app offers.

## Notes
- Tests: `test/app/drawer.test.tsx` (every scenario above), `test/ui/reducedMotion.test.ts` (the drawer's token),
  `test/architecture.test.ts` (the `<button>` homes gain `MmDrawer` only if it draws one; prefer `MmPressable`).
- Where: `apps/mobile/src/ui/MmDrawer.tsx` and its rules in `ui.css`; `HomeShell.tsx` holds the open state and the
  rows; `destinations.ts` unchanged.
- The owner reads it on both phones: the motion, the drag, the Android back.

## Progress
Built 2026-10-30 (PR A of MM-703, not run locally; CI validates): `MmDrawer` (`ui/`), the sibling of `MmSheet`: a panel
from the left over the scrim, focus held, Escape, the scrim and the host's dismissal (the phone's back) close it, a
sideways drag follows the finger on a transform set on the element and leaves past a third of the width or on a flick,
an up-or-down finger scrolls instead; `MmDrawerGroup`, `MmDrawerRow` (over `MmPressable`, which gained `current` for
`aria-current`) and `MmLettering` (the owner's art, `design/brand/lettering-art.png`, scaled to 960 px wide as
`assets/brand/lettering.png`); `Overlays.drawer` on the host; `DrawerMenu` and `DrawerChoice` in `app/`; the menu button
in the app bar's leading slot and the gear gone (`HomeShell`); the `menu` icon. Stories: `Drawer.stories.tsx`
(DrawerOpen, DrawerOpenOnFood, DrawerDragged, DrawerOpensSettings, DrawerOpenSmallPhone at 360 px and twice the text
size) and the Overlays catalog's Drawer and DrawerBare. Tests: `test/app/drawer.test.tsx` (every scenario, and the motion
token rule), `test/support/openSettings.ts` reaches Settings through the drawer.

**The Library row** was wired in MM-706's PR, which landed after this one: a row beside Profile (the `library` icon),
pushing `LibraryScreen` (`DrawerChoice` gained `library`; `test/app/drawer.test.tsx`, story `DrawerOpensLibrary`).

Owed on the phone: the slide-in and the drag on both phones, Android's back closing it, the lettering at the drawer's
width in each palette.

---
id: MM-302
component: design-system
status: done
related: [MM-272, MM-99, MM-301]
---

# Bug: a snack covers the navigation bar

## What the owner found (2026-10-14)

"Toasts should always display above the nav bar." The snack host is fixed
16 dp above the bottom of the window (`.mm-snack-host`), and the overlays
sit above the home shell, so on every destination the snack is drawn over
the bottom bar and hides its destinations. A snack with an action waits
until it is pressed or dismissed (MM-272), so the bar stays covered until
then; MM-301 adds such a snack to every save on the Dashboard.

## The fix

While the navigation bar is shown it says how tall it is, safe area
included, as `--mm-navigation-bar-height` on the document, and the snack
host stands that far up plus its own margin. With no bar (onboarding, a
pushed screen, a sheet) the snack keeps its place above the safe area.

Lifting the snack put it where Food's floating "Add food" hangs, so while
a snack shows the overlays say how much room it takes
(`--mm-snack-clearance`) and the floating action rises above it, as
Material lifts its FAB over a snackbar.

## Regression test

`apps/mobile/test/ui/snackAboveNavigationBar.test.tsx`: the bar publishes
its height while it is shown and withdraws it when it goes, the snack
host's bottom is measured from it, and a floating action rises by the
snack's room while one shows. Each failed before its fix.

## Acceptance criteria

```gherkin
Scenario: A snack stands above the navigation bar
  Given a destination with the navigation bar
  When a snack is shown
  Then the snack sits above the bar and every destination stays visible and pressable

Scenario: A floating action rises above a snack
  Given Food, with Add food floating above the navigation bar
  When an entry is deleted and its Undo snack shows
  Then Add food stands above the snack, and both can be pressed

Scenario: With no navigation bar the snack keeps its place
  Given a screen without the navigation bar
  When a snack is shown
  Then the snack sits above the bottom safe area
```

## UI/UX

- Overlays — apps/mobile/src/gallery/OverlaysCatalog.tsx. The snack.
- Not Weighed Today — apps/mobile/src/gallery/screens/Today.stories.tsx
  (Story: Weigh In Saved, Waist Saved). The snack after a save, above the bar.
- Entry Removed — apps/mobile/src/gallery/screens/Food.stories.tsx. The
  Undo snack above the bar, Add food above the snack.

---
id: MM-109
status: in-progress
component: design-system
related: [MM-101, MM-102, MM-103, MM-94, MM-375, MM-8, MM-474]
---

# Task: The app icon, name treatment and launch screen

## Context
See MM-101. The app is a React app in a Capacitor shell (MM-228, MM-403). On 2026-10-20 the shells took the owner's
illustrations (`apps/mobile/design/app-icon.png` and the two loading screens: a saucer carrying a plate of food over a
Martian landscape, a ringed planet, the name in lettering) as the launcher icon and the launch screen. As an icon that art
fails this ticket's requirements: it has text in it, its detail is lost at 48 px, and its launch screen's near-black sky
(#02010d) is not the app's first frame, so the start flashes. The name "Martian Macros" has a character that nothing in
the shell's marks reflected.

## Decisions
The product owner's: the warmer Martian palette, a royal 90s violet with lime as the action and tangerine as the warm
voice (MM-375, 2026-10-17). The owner's illustration names the motifs it wants: a ringed planet, the 90s neon colours.

Choices I made without asking (say if any is wrong; the owner judges the icon on the phone):
- **The direction is the planet** (direction 2 of the three proposed: *instrument*, *planet*, *monogram*), drawn from the
  owner's own illustration's ringed planet and from `design/visual-language.md`'s signature, the horizon arc with a small
  body travelling on it (`design/design-map.json`: "MM-109: icon should be built from the arc motif"). A tangerine Mars
  with a darker limb, the lime arc as its ring (its back half passing behind the planet, its front half cut into it), and
  an aqua body on the ring where the ring breaks. Flat colours, no gradient, no glow, no text; it imitates no brand.
- **Colours are Martian's tokens**: the ground is the overlay violet #342a78 (lighter than the canvas, so the icon does
  not sink into a black or dark wallpaper), the planet carbs' tangerine #ff9a3d with a #e0662a limb, the ring the action
  lime #c4ff48, the body ion's aqua #43f5e0.
- **The owner's illustrations replace nothing they are good at**: they stay in `apps/mobile/design/` as art (for the store
  listing's screenshots or marketing, if wanted), but no platform icon or launch screen is generated from them now. The
  generated splash and launcher PNGs from them are deleted; git history has them, and reverting this ticket's commit
  brings them back.
- **The launch screen is the mark on Martian's canvas #110c35**, both themes, because Martian is the default palette
  for a new install and the native launch screen cannot read the in-app choice. The web view starts on the same colour
  (`capacitor.config.ts` `backgroundColor`). Someone who chose Light, Dark or System sees the violet launch screen, then
  their palette: accepted, written in the scenario below.
- **Android is vector only.** minSdk is 26, so the adaptive icon in `mipmap-anydpi-v26` is the only one any supported
  phone reads; the density PNGs are deleted. The mark sits in a 62-unit circle of the 108-unit canvas, under the 66-unit
  safe zone, so no mask shape clips it. The themed (monochrome) layer is the same drawing in one colour, with a real gap
  between ring and planet.
- **iOS has light, dark and tinted icons** (iOS 18's appearances in the asset catalog; earlier iOS shows the light one):
  dark is the mark on the canvas, tinted the mark in greys on black. The launch storyboard shows the mark at 192 pt,
  centred, the size Android 12's splash gives it (two thirds of 288 dp).
- **Rasters come from the SVG masters** through macOS's Quick Look (`scripts/app-icons.py`), so nothing is installed.
- **The dev and demo builds share the icon.** A marker for them is MM-474, not this ticket.
- The name is written "Martian Macros", two words, both capitalized. The short name under the icon is "Macros" if the
  full name is truncated (unchanged from the proposal; not built: the shells' labels are MM-8's).

## Description
The chosen mark as the icon on both platforms, the themed icon, the launch screen on both platforms and the store
listing's icon.

## Acceptance Criteria
```gherkin
Scenario: A direction is chosen
  Then this ticket records which direction was built and why
  And the owner, seeing it on the phone, accepts it or names another

Scenario: No text, recognizable small
  Then the icon has no text in it
  And it is recognizable at 48 px, on a light and a dark wallpaper

Scenario: Android adaptive and themed icons
  Then the icon is a vector adaptive icon with a foreground, a background and a monochrome layer
  And nothing in the foreground lies outside the 66 dp safe zone, so no launcher mask shape clips it
  And with themed icons on (Android 13+), the launcher tints the monochrome layer

Scenario: iOS icons
  Then the asset catalog has a 1024 px opaque icon, and dark and tinted variants
  And every file the catalog names exists

Scenario: No flash at launch
  Given the Martian palette, the default for a new install
  When the app is launched, in light or dark mode
  Then the launch screen, the web view before the page paints, and the first frame have the same background colour
  And the launch screen shows the mark, centred, and no text

Scenario: Store listing
  Then a 512 px icon for the Play listing is in the repository, from the same master
```

Guarded by `apps/mobile/test/shell/launchScreen.test.ts` (the launch colour equals Martian's `--canvas` in the Android
theme, the web view and the iOS storyboard; the adaptive icons' monochrome layer; the catalogs' files; no text in the
masters).

## Notes
- Needed before store submission (MM-94).
- If a brand typeface is wanted for headings and figures (MM-103), choose it with the icon so they belong together, and
  check its license allows embedding in an app.

### Progress (2026-10-21)
Built:
- Masters: `apps/mobile/design/icon.svg`, `icon-dark.svg`, `icon-tinted.svg`, `launch-mark.svg`.
- Android: `res/drawable/ic_launcher_foreground.xml`, `ic_launcher_monochrome.xml`, `launch_screen.xml`;
  `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` with the monochrome layer;
  `values/ic_launcher_background.xml` (#342a78) and `values/launch_canvas.xml` (#110c35); the launch theme's
  `windowSplashScreenBackground`, `windowSplashScreenAnimatedIcon` and `postSplashScreenTheme`.
- iOS: `AppIcon.appiconset` (light, dark, tinted, 1024 px), `LaunchMark.imageset` (1x to 3x), the launch storyboard on
  the canvas; the old `Splash.imageset` is gone.
- `capacitor.config.ts` `backgroundColor`, the web favicon, `design/store/play-icon-512.png`, `scripts/app-icons.py`.

Not run locally; CI validates (the test and the Android build). CI builds no iOS app.

Owed, on the owner's phone (why this ticket stays in progress):
- The icon on a light and a dark wallpaper, at the launcher's size; the owner's verdict on the direction.
- Android: circle, squircle and rounded-square masks (no clipping), themed icons on (Android 13+), the Android 12+
  splash and the launch on Android 8 to 11 if a device is at hand; no white flash between the splash and the first
  frame.
- iOS: the icon in light, dark and tinted home screens (iOS 18+), the launch storyboard (a launch screen is cached:
  delete the app before checking), no flash; Xcode accepts the catalog's dark and tinted entries.

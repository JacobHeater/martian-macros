---
id: MM-229
status: in-progress
component: architecture
related: [MM-228, MM-102, MM-103, MM-104, MM-159, MM-99, MM-7]
---

# Task: A walking skeleton of the React app

## Context
First part of MM-228. Before any feature is rebuilt, the new app has to
exist end to end in its thinnest form: it builds, it runs where it will be
developed (a browser) and where it will ship (a phone), it is tested, and the
repository's checks know about it. Everything after this adds to something
that already works.

## Decisions
Choices I made without asking (say if any is wrong):
- **`apps/web/`**, built with Vite, written in TypeScript in strict mode,
  React for the views.
- **The design tokens are CSS variables** in one file, copied from
  `apps/mobile/lib/src/theme/` (colors for Martian, Dark and Light; type
  roles; radii; spacing), with the app's two fonts bundled. No UI kit.
- **Components are ours, one per file**, taking meaning and never a color or
  a size, as MM-104 and MM-163 require. A screen uses components and no raw
  form control.
- **Tests:** Vitest for logic and components. Screenshots of real screens at
  360 by 800 in the three themes come next, taken in one pinned environment
  so that every machine gets the same images (browsers draw text slightly
  differently on each operating system, as Flutter did).
- **`mm check` runs the new app's checks** beside the existing ones until the
  switch, so one command still answers "is the repository sound".
- **The Android shell is Capacitor, installed under the demo app ID only**
  (`com.martianmacros.martian_macros.demo`) until the switch. The owner's
  normal app and its data are not touched.
- **Nothing is fetched at run time.** The build output is self-contained;
  a check fails if the built page or a stylesheet loads anything from a
  network address.

## Description
- The app opens on five destinations in a bottom bar, Dashboard first, with
  Settings behind the gear (MM-99). Each destination is a titled empty
  screen: structure only, no features.
- The theme follows a stored choice of Martian, Light, Dark or System, with
  Martian the default for a new installation (MM-184).
- Text follows the phone's text-size setting.
- The seeds of the component library: app bar, navigation bar, button,
  surface, and the type roles.
- A page listing every token and component as built, which is the start of
  the honest "what is" library.

## Acceptance Criteria
```gherkin
Scenario: It builds and runs offline
  When the app is built
  Then the built page and stylesheets load nothing from a network address
  And every path in them is relative, so it runs from files inside a shell

Scenario: The five destinations
  Given the app is open
  Then Dashboard, Food, Train, Progress and Coach are in a bottom bar, Dashboard first and current
  When another destination is chosen
  Then its screen is shown and it is marked current, in words and not by color alone

Scenario: Tokens match the reference
  Then every color, radius, spacing step and type role equals its value in the Flutter theme for each of the three themes

Scenario: One command
  When "mm check" is run
  Then the new app's type check, tests and build run with the existing checks
  And a failure in them fails the command

Scenario: On a phone
  Given an Android phone
  When the demo build is installed
  Then it opens to the Dashboard destination with no network
  And the normal app and its data are unchanged

Scenario: Screenshots anywhere
  When the screenshot tests are run from Windows, macOS or Linux
  Then they produce the same images, because they are taken in one pinned environment
```

## Progress
**Built and verified (the web half):**
- `apps/web/`: Vite 8, React 19, TypeScript 7 in strict mode, every version
  exact in `package.json` and locked. `npm run check` runs the type check, 13
  tests, the build and the offline check.
- Tokens in `src/theme/tokens.css`. `test/tokens.test.ts` reads the Flutter
  theme files and fails if any of the 75 colors, the radii, the six spacing
  steps or the seven type roles differ. Type sizes are in rem, so text
  follows the phone's text size.
- Components, one per file in `src/ui/`: `MmAppBar`, `MmNavigationBar`,
  `MmButton`, `MmIconButton`, `MmSurface`, `MmIcon`.
- The shell: five destinations, Dashboard first, the current one given as
  `aria-current` and shown by weight and an indicator; Settings behind the
  gear with the four theme choices; Martian by default; System follows the
  phone. The theme choice is held in memory: nothing is written to browser
  storage, and it is not kept between launches until the data layer exists.
- `?gallery` shows every token and component as built, in the three
  palettes. Opened in headless Edge and looked at: correct in all three.
- `mm check` runs it (`mm web` alone does too); `mm bootstrap` installs it;
  CI sets up Node 22.
- The built app is 225 kB of script (71 kB compressed) plus the two fonts.

**Built and verified (the Android shell):**
- `apps/web/android/`: a Capacitor 8.5.3 project with the demo app ID and
  the name "Martian Macros DEMO". Cloud backup is off. `npm run android`
  builds the app and copies it in.
- Built with Gradle and installed on the Android emulator (a Pixel 10 Pro XL
  image) with Wi-Fi and mobile data turned off: it opens to Dashboard in the
  Martian palette with the bundled fonts, the destinations and the gear
  respond to touch, and choosing Light in Settings changes the app at once.
- The app draws behind the phone's bars and keeps clear of them. The bars'
  icons follow the palette through `src/platform/SystemBars.ts` (ours) and
  its Capacitor adapter; before that they were dark on the dark background.
- The emulator's normal app was not touched. The owner's phone was connected
  throughout and nothing was installed on it.

**Not built yet:**
- Screenshot tests.
- CI does not build the Android shell.
- Rules that enforce the engineering principles in TypeScript (one
  declaration per file is followed by hand so far; no vendor import outside
  its adapter and no raw control in a screen have nothing to check yet).

**Not verified:** a physical phone. The shell has run on the emulator only.
Typing, the keyboard and sheets have nothing to be judged on yet.

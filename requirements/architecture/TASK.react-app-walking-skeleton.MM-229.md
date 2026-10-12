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
- **Tests:** Vitest for logic and components; Playwright for screenshots of
  real screens at 360 by 800 in the three themes, runnable on any operating
  system.
- **`mm check` runs the new app's checks** beside the existing ones until the
  switch, so one command still answers "is the repository sound".
- **The Android shell is Capacitor, installed under the demo app ID only**
  (`com.martianmacros.martian_macros.demo`) until the switch. The owner's
  normal app and its data are not touched.
- **Nothing is fetched at run time.** The build output is self-contained;
  a test fails if a built file refers to a network address.

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
  Then the output contains no reference to a network address
  And it opens in a browser from the built files with the network off

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
  When the screenshot tests run on Windows, macOS or Linux
  Then they produce the same images
```

## Notes
- How each engineering principle is enforced in TypeScript (one declaration
  per file, no vendor import outside its adapter, no raw control in a screen)
  is recorded here as it is built.

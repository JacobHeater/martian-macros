---
id: MM-8
status: done
component: developer-tooling
related: [MM-1, MM-2, MM-177, MM-403, MM-228, MM-94, MM-87]
---

# Task: Separate dev and prod app ids

## Context
`--env dev|prod` only changes compile-time defines. Both builds have the same app id, so a development build replaces the real app (and
its data) on a phone. That is fine on an emulator and unacceptable on the developer's own phone once they use the app for real.

Until 2026-10-19 the shells built only as the demo identity (MM-228), and the
iOS half waited for the Mac. The owner, about to live with the app on an
iPhone, asked for the real ids.

## Decisions (made with the product owner, 2026-10-19)
- **Three identities**: the real app, a development twin beside it, and the
  seeded demo of MM-177, each its own app id, name and sandbox.
- **One id on both platforms**: `com.martianmacros`, with `.dev` and
  `.demo`. Apple's bundle ids allow no underscore and Android's packages no
  hyphen, so the segment that could not be shared (`martian_macros`) is
  gone. Names: "Martian Macros", "Martian Macros Dev", "Martian Macros DEMO".
- **The owner's iPhone gets the real identity, fresh**; what the demo
  install holds stays there.

Choices I made without asking (say if any is wrong):
- **Android: product flavors** `prod`, `dev`, `demo` on the one namespace
  `com.martianmacros` (the Kotlin package moved there). A flavor sets only
  `applicationIdSuffix` and the four strings (name, title, package, URL
  scheme); nothing else differs.
- **iOS: two build settings**, `MM_IDENTITY_SUFFIX` and `MM_DISPLAY_NAME`,
  with `PRODUCT_BUNDLE_IDENTIFIER = com.martianmacros$(MM_IDENTITY_SUFFIX)`
  and the display name in `Info.plist`. The project's own values are the
  real app, so Xcode's Run is what the owner lives with; `mm` overrides
  them for the twins. No schemes or configurations were added.
- **The web bundle learns its identity at build time** (`MM_IDENTITY`,
  `__MM_IDENTITY__`): the demo keeps its database name
  `martian_macros_demo`, the other two share `martian_macros` (different
  sandboxes). The build refuses `MM_DEMO_SEED` for any identity but the
  demo, and the app refuses it again at launch. `DemoConfiguration`, the
  Dart-era class nothing in the app called, is retired for
  `AppIdentity` and `databaseNameFor`.
- **`mm run` and `mm build` are the dev twin unless `--env prod`**;
  `--env phone` still only chooses the device (MM-234), so the real app on
  the phone is `mm run --env prod -d <id>`. `mm demo` is the demo flavor;
  `mm run --ios --env prod|dev|demo` on the simulator. Live reload is the
  dev twin (`cap run --flavor dev`).
- **CI keeps building the dev twin** (debug). A release build with the real
  id is MM-7's.

## Description
Three native identities, `prod`, `dev` and `demo`, that give the builds different app ids and display names, so all three install side by
side. Everything else stays in `config/<env>.json`. `mm run` and `mm build` pass the identity that matches `--env`.

## Acceptance Criteria
```gherkin
Scenario: Both installed
  Given the prod app is installed with logged data
  When the dev build is installed on the same device
  Then both apps are present and the prod app's data is untouched

Scenario: The identity follows the environment
  When "mm run --env prod" is run
  Then the prod identity is built with config/prod.json

Scenario: One id on both platforms
  Then the Android package and the iOS bundle id of each identity are the same string

Scenario: Only the demo seeds
  When a build is asked to seed under any identity but the demo
  Then the build refuses
```

## Notes
- Health platform permissions and the in-app purchase product (MM-87) are tied to the app id; check both when they land.
- The demo and dev installs made before this ticket, under the old ids, stay on the devices until removed.

## Progress (2026-10-19)
Built on the owner's Mac. Verified: the three identities installed side by
side on the Android emulator and on the iPhone simulator, each launching by
its own id with its own name; `mm check`. Not verified: a phone; a release
build of the real id (MM-7).

## Amended 2026-10-19 (the owner): `--prod`
`mm run --prod`, `mm run --ios --prod`, `mm run --ios --phone --prod`, `mm build android --prod` and `mm build ios --prod` are the real app, the short way to `--env prod`, on both platforms. `--prod` beside an `--env` that says otherwise is a usage error. Tested in `tool/test/identity.test.ts`.

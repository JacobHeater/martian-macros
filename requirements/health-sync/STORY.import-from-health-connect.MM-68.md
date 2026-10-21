---
id: MM-68
status: in-progress
component: health-sync
related: [MM-66, MM-67, MM-16, MM-19, MM-20, MM-34, MM-71, MM-72, MM-73, MM-188, MM-189, MM-498]
---

# Story: Import weigh-ins and more from Health Connect

## Context
See MM-66.

## Decisions
Choices I made without asking (say if any is wrong):
- **Connecting is offered, never required**: at the end of onboarding and in Settings.
- **Permissions are requested per data type**, with a sentence for each saying what it is used for. Refusing one does not block the others.
- **Each imported weigh-in shows where it came from**, and the user can type a value for a day to overrule it.
- **Menstruation data is requested only for female profiles.**
- **Height from the platform is offered as a suggestion** if it differs from the profile; it never overwrites silently.
- (2026-10-21, the builder) **Where the height is offered**: the newest height read, when it shows differently from the
  profile's in the person's units, is said under the Height row of Settings' You section ("Health Connect says 5′ 9″",
  built like the Date of birth row's subtitle, rule 9) and offered in the Height sheet with "Use 5′ 9″", which fills the
  fields; only Save keeps it.
- (2026-10-21, the builder) **Imported days of flow join the marked ones** wherever period days are used (the trend's
  noise, the chart's shading, a weight jump's explanation, the missed-period question). The Period days card still marks
  only what was marked in the app, since an imported day cannot be unmarked there.

## Description
On Android, the user connects Health Connect and grants read access to any of: weight, body fat, lean mass, height, exercise sessions,
menstruation periods, steps. Granted types are imported and kept up to date (MM-72). Weight feeds the trend; menstruation feeds the trend's
noise (MM-19); body fat and lean mass are stored for the body-fat estimate (MM-34); sessions are stored for the training log (MM-75).

## Acceptance Criteria
```gherkin
Scenario: A scale's readings arrive
  Given a scale app writing weight to Health Connect and permission granted
  When the user steps on the scale and later opens the app
  Then today's weigh-in is that reading and the trend includes it

Scenario: Partial permission
  Given weight is granted and body fat refused
  Then weight is imported and nothing about body fat is requested again until the user asks

Scenario: Overruling an import
  Given an imported weigh-in for today
  When the user types a different value
  Then the typed value is used and the import is kept but not used

Scenario: Permission withdrawn
  Given permission is later removed in system settings
  Then the app notices, stops importing, keeps what it has, and says how to reconnect

Scenario: Health Connect is absent
  Given a device without Health Connect
  Then the app says so and offers nothing that needs it
```

## Progress
Built (2026-10-11):
- **`HealthConnectSource`**, Android's Health Connect behind `HealthSource` (MM-67), over the `health` plugin (13.3.2, the one new
  dependency), using the platform's own change tokens. `mm arch` keeps the plugin out of every file but the adapter.
- **Read only.** The manifest declares the seven read permissions and no write permission. Nothing is written to the user's health
  data.
- **A Health Connect group in Settings**: each kind of reading with what it is for, allowed one at a time; refusing one leaves the
  others alone and says how to allow it later. Allowed kinds show how many readings were read and from which sources. "Read from
  Health Connect now" reads again. A phone without Health Connect says so and offers nothing. Menstruation is offered to female
  profiles only. A permission taken away in the phone's settings is noticed the next time the group is shown or read, and what was
  read is kept.
- **An unreadable platform is an error, never "nothing"** (`HealthReadFailure`). Found on the phone: Health Connect refuses to be
  read while the app is not on screen, and the plugin reports a refused read as no readings. Left alone, an import in that state
  would have emptied what was kept. Every read is now checked by asking for changes straight after it, and a refused read changes
  nothing and says so.

On a Pixel 9 Pro XL (Android SDK 37), as the separate demo app, 2026-10-11:
- `healthSourceContract` (MM-67) passes against Health Connect with the screen unlocked and six kinds allowed (allowed over adb;
  menstruation left unallowed): `apps/mobile/integration_test/health_connect_test.dart`.
- With the screen locked the same run fails with `HealthReadFailure`, as it should.
- **Health Connect on that phone held no readings of any kind**, so importing a real reading, its source name and its units has
  not been seen on a device. Nothing was written to find out.

Built next (2026-10-11), on the rule of MM-71:
- **Imported weight feeds everything that uses weigh-ins**: today's weigh-in, the trend, the coach. One weigh-in counts per day,
  and a value the user types for a day is used instead, with the import kept.
- **What is allowed is read when the app opens and whenever it comes back to the front**, and from Settings on request. If it
  cannot be read, what was kept is still used. Screens reload only when an import changed something.
- The weigh-in card says where today's weigh-in came from and that typing overrules it.

Built (2026-10-21), not run locally; CI validates:
- **Menstruation feeds the trend's noise**: `mergeFlowDays` joins the platform's days of flow to the marked ones in the
  app's `flowDays` (`test/state/mergeFlowDays.test.ts`, `test/state/importedFlowDays.test.ts`).
- **The height suggestion** (`test/settings/heightFromHealthPlatform.test.tsx`, story `HeightFromHealthConnect`).

Closed or another ticket's:
- Keeping up to date in the background: never, by the owner's decision of 2026-10-21 (MM-72, MM-516 closed). Reading back
  further than Health Connect's first month is MM-73; a re-read after an expired token keeps it (MM-498).
- Sessions in the training log: MM-490 (importing a platform's workouts needs a stored platform id, a schema change).

Not built:
- The offer at the end of onboarding.
- The permission screen itself was not seen: permissions were granted over adb.
- Google Play's health-permission declaration (MM-95), and the privacy-policy screen Health Connect links to: the rationale intent
  opens the app's main screen for now.

- Integrations review fix 2026-10-21 (`fix/health-plugins-review`): `height` is one of `HealthBackfill.types`, so a
  height recorded more than thirty days ago (up to a year) is read and offered. Granting height now asks for the
  history permission too, as weight does. Test: `test/healthIngest/healthBackfill.test.ts`.

## Owed on a phone
- A cycle app that writes only `MenstruationPeriodRecord` (no flow records): Android reads flow records only, so check
  what Settings and the cycle-aware trend show; nothing is expected to be read today.

## Notes
- Health Connect has no biological-sex record, so nothing here touches MM-14.
- Google Play requires a declaration of each health permission and why it is needed (MM-95).

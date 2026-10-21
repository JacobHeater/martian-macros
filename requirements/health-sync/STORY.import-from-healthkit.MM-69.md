---
id: MM-69
status: done
component: health-sync
related: [MM-66, MM-67, MM-14, MM-68, MM-71, MM-72, MM-188, MM-189, MM-403, MM-395]
---

# Story: Import from Apple Health

## Context
See MM-66 and MM-68. The same behavior on iOS, behind the same interface.

## Decisions (made with the product owner)
- **HealthKit's biological sex may pre-fill the onboarding question, and nothing more.** Its values are female, male, other and not set.
  Only female and male are used; with other or not set the question is simply not pre-filled. The user always confirms (MM-14).

Choices I made without asking (say if any is wrong):
- **Everything in MM-68 applies**, with HealthKit's types: body mass, body fat percentage, lean body mass, height, workouts, menstrual
  flow, step count.
- **HealthKit never tells an app that read permission was refused** (a refusal looks like "no data"). The app says "No weight data found
  in Health" and how to check permissions, rather than claiming a refusal.
- **Date of birth and height may also be pre-filled** from HealthKit at onboarding, each shown for confirmation.

## Decisions (made with the product owner, 2026-10-19)
- **The platform is called by its own name.** On iOS the app says "Apple
  Health" wherever it says "Health Connect" on Android: the Settings
  section, the imported weigh-in's source when the platform named none
  (MM-395), and the terms of use. One neutral name for both was declined.
- **What HealthKit cannot say is not pretended.** HealthKit never tells an
  app that reading a kind was refused: a refusal looks like no data. So on
  iOS a kind the person has been asked about counts as connected; its row
  says what was read, or that nothing was found in Apple Health yet and
  where to allow it or check: the route Apple documents, Settings, Health,
  Data Access & Devices, in the same words in the row, the snack and the
  caption (the panel's F1 and PD-2). "Not allowed" is never claimed.
- **The Settings section's iOS variant goes through Storybook and the panel
  first** (MM-293), in every state: not on this device, nothing asked yet,
  some asked with readings, asked with nothing found, read failed.

Choices I made without asking (say if any is wrong):
- **The same plugin interface** (`MmHealthApi`) and the same adapter
  (`NativeHealthSource`): the Swift plugin hands each reading over in Health
  Connect's units (kilograms, percent, meters, a count), so
  `healthConnectSample` serves both platforms and the shared contract holds.
- **An anchored query's anchor is the change token**, serialized as
  base64; `changes` runs the query from it and gives what was added and the
  ids of what was deleted, as Health Connect's change log does.
- **`permitted` on iOS is the set of kinds asked for**, kept by the plugin
  in the app's preferences on the device; `requestPermission` shows
  HealthKit's sheet for the kinds asked and records them.
- **Reading only.** The app asks to read, never to share; the Info.plist
  carries the read purpose string only.

Choices I made without asking, building the pre-fill (2026-10-21; say if any is wrong):
- **Asked for, not read on arrival.** The first step offers "Fill in from Apple Health" on an iPhone only; nothing
  is read, and no Apple Health sheet appears, until it is pressed. It asks for sex, date of birth and height alone,
  apart from Settings' kinds, and fills sex on that step, the date of birth and the height on theirs. Each is still
  confirmed with Next. A sex other than female or male, a date after today, or a height outside the 100 to 250 cm
  onboarding takes, fills nothing.
- **Built like its siblings (MM-318).** A secondary `MmButton` below the choice cards and a `Notice` for the outcome,
  as `BirthDateStep` tells its own outcome with a `Notice`; the words for where to allow reading are the Settings
  section's ("Settings, Health, Data Access & Devices"). No new component, so no panel pass (the proportional rule).
- **Android offers nothing.** Health Connect keeps no sex or date of birth; its height suggestion is MM-68's.
- **The terms already cover it**: the app reads only the kinds the person allows, and what it reads is copied into
  the app on this phone (section 9). No terms change.

## UI/UX
- Apple Health in Settings — apps/mobile/src/gallery/screens/Settings.stories.tsx
  (Stories: AppleHealthNotOnThisPhone, AppleHealthNoneAsked,
  AppleHealthSomeAsked, AppleHealthNothingFound, AppleHealthReadFailed,
  AppleHealthAsking, AppleHealthReadDone). Apple's permission sheet itself
  is the platform's and no story can draw it; both of its outcomes are
  drawn (the panel's F7). Reviewed by the product designer and the UX guard
  (pass): docs/agent-runs/mm403-ios-shell.
- Filling onboarding in from Apple Health — apps/mobile/src/gallery/screens/FirstRun.stories.tsx
  (Stories: BiologicalSexOnIos, BiologicalSexFilledFromHealth, BiologicalSexNothingInHealth,
  BiologicalSexHealthUnreadable, DateOfBirthFromHealth).

## Description
On iOS, the user connects Apple Health; the flow, storage and behavior match MM-68.

## Acceptance Criteria
```gherkin
Scenario: Pre-filling sex
  Given Apple Health reports biological sex as female
  Then the onboarding question has Female selected and the user must still continue past it

Scenario: Not pre-filling
  Given Apple Health reports other or not set
  Then the question has nothing selected and cannot be skipped

Scenario: The same behavior as Android
  Then the shared health-source test suite passes against HealthKit on a device

Scenario: No data, or no permission
  Given no weight samples are returned
  Then the app says none were found and how to check Health permissions
```

## Notes
- Needs the Mac, a paid developer account for the HealthKit entitlement, and a real device (the simulator's Health data is limited).
- App Review requires the purpose strings to say clearly why each type is read and written.

## Progress
Done 2026-10-21. Not run locally; CI validates the TypeScript tests. CI builds no iOS app, so the Swift is
uncompiled until it is built on the Mac.
- Built 2026-10-19 (MM-403): `MmHealthPlugin.swift` behind `MmHealthApi` and `NativeHealthSource`, each reading in
  Health Connect's units; anchored queries as change tokens; `permitted` as the kinds asked; Apple Health named in
  Settings, the imported weigh-in's source and the terms; the Settings section's iOS states, reviewed by the panel.
  "Nothing found in Apple Health yet" and where to check, never "not allowed" (Stories AppleHealthNothingFound,
  AppleHealthReadFailed).
- Built 2026-10-21, the pre-fill: `HealthProfileReader` (`src/domain/integration/`), `NativeHealthProfile` over the
  plugin's new `profile` method (sex, date of birth, latest height; asks to read those three), `NoHealthProfile`
  (a browser, Android) and `InMemoryHealthProfile`, chosen in `openAppServices.ts`. Onboarding's first step offers it
  on an iPhone. Tests: `test/platform/nativeHealthProfile.test.ts` (the contract suite
  `test/contracts/healthProfileReaderContract.ts` against all three, and the mapping) and
  `test/app/onboardingFromAppleHealth.test.tsx` (female selected and still confirmed; other or not set selects
  nothing and cannot be skipped; a failed read; the date of birth and height on their steps; Android not offered).
- What MM-68 itself has not built (the offer at the end of onboarding, sessions in the training log, background
  reading, which the owner ruled out) is MM-68's for both platforms, not this ticket's.

## Owed on a phone
- The shared health-source suite (MM-67) against HealthKit on the iPhone, with readings of each kind.
- "Fill in from Apple Health": the sheet asks for sex, date of birth and height; with them set in the Health app,
  Female or Male is selected, and the date of birth and height are filled on their steps; with sex set to Other, or
  reading refused, nothing is selected and the step waits.
- No weight in Apple Health: Settings says none was found and where to check.
- The first iOS build of `profile` in `MmHealthPlugin.swift`.

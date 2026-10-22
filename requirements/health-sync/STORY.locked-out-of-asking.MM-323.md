---
id: MM-323
status: done
component: health-sync
related: [MM-68, MM-320, MM-73, MM-523]
---

# Story: after Health Connect stops asking, say where to allow a kind

## Context
The panel's UX guard on MM-320 (UX-4): Health Connect stops showing an app's request once a permission is
refused more than twice ("your app gets locked out… permission requests will no longer appear", the
Health Connect codelab, read 2026-10-14). The refusal snack then says "You can allow it here", which sends
the person round in a circle.

## Decisions
Choices I made without asking (say if any is wrong):
- **"Stopped asking" is told by time (builder, 2026-10-21).** Health Connect gives no sign that it showed nothing; the
  plugin times the request, and a refusal that comes back in under 0.8 s is counted as never shown. Nobody reads the
  question and answers that fast; a slow phone that takes longer to come back is told the usual refusal, which is no worse
  than before. The answer is kept only while the app runs, so after a restart the first press tries again.
- **What opens.** On Android 14 and later, the app's own page of Health Connect's permissions
  (`MANAGE_HEALTH_PERMISSIONS` with the app's package); before, Health Connect's settings. Where neither opens, a snack says
  to allow it in Health Connect from the phone's settings. Back from it, what is allowed is read at once, and a
  snack says whether what the person went there for is allowed now ("Weight allowed.") or "Nothing changed." (panel, UX-10).
- **A refusal that was shown keeps its words** ("You can allow it here, or in Health Connect"): asking again still works
  then. Only the locked-out snack offers "Open Health Connect".
- **The same way in serves MM-523.** The history permission (MM-73) is asked for once, so its line on Coach opens the same
  page. An iPhone has no such page: its plugin answers that nothing opened, and its words stay MM-69's route.

## Description
When a request comes back unchanged without the platform's dialog having been shown, the app says to allow
it in Health Connect, and, where the platform allows it, offers to open Health Connect's permissions for
the app. Needs the answer to: can the MmHealth plugin tell a refusal from a request never shown, and open
Health Connect's permission screen? (react-capacitor.)

## Acceptance Criteria
```gherkin
Scenario: Locked out
  Given Health Connect no longer shows the app's request for weight
  When the Weight row is pressed
  Then the app says to allow it in Health Connect, and offers to open it

Scenario: Health Connect cannot be opened
  Given Health Connect no longer shows the app's request for weight
  And its permissions cannot be opened from the app
  When "Open Health Connect" is pressed
  Then the app says to allow it in Health Connect from the phone's settings
```

## UI/UX
- HealthConnectStoppedAsking, HealthConnectStoppedAskingCannotOpen — apps/mobile/src/gallery/screens/Settings.stories.tsx.
- HealthConnectStoppedAskingAllowedThere, HealthConnectStoppedAskingNothingChanged —
  apps/mobile/src/gallery/screens/Settings.stories.tsx. Back from Health Connect: "Weight allowed." with the row read, or
  "Nothing changed.".

## Notes
- The question above, answered: the plugin cannot be told outright; it times the request (Decisions). It can open Health
  Connect's permissions for the app.
- Built 2026-10-21: `HealthPermissionsPlace` (`stoppedAsking`, `openPermissions`) beside `HealthSource`, in the fake, the
  adapter and the platform that is not there, held to `healthPermissionsPlaceContract`; `MmHealthPlugin.kt` says `shown`
  and has `openPermissions`; the Swift plugin answers `opened: false`; `settings/useOpenHealthPermissions.ts` is the one way
  in. Tests: `test/settings/healthConnect.test.tsx`, `test/platform/nativeHealthSource.test.ts`,
  `test/native/mmHealthPermissions.test.ts`. Not run locally; CI validates.
- Panel review of PR #283: the test of opening Health Connect now has weight allowed there and shows it read on coming
  back; the plugin's 0.8 s threshold and its comparison are asserted from source; coming back says what changed.

## Progress
Done 2026-10-21. Built and merged in PR #233 (see Notes); both scenarios above are held by
`test/settings/healthConnect.test.tsx`, `test/platform/nativeHealthSource.test.ts` and
`test/native/mmHealthPermissions.test.ts` and drawn in the stories under UI/UX, validated by CI. What only a phone can
show is listed below.

## Owed on a phone
- Refuse Weight three times on the owner's phone: the third press says Health Connect no longer asks and offers to open it.
- "Open Health Connect" opens the app's own page there, and Weight allowed there is read on coming back to the app, with
  "Weight allowed." said; nothing allowed there, "Nothing changed.".
- The phone's own label for the platform reads "Health Connect", as the snack and button call it, so "allow it in Health
  Connect, from your phone's settings" can be followed.
- A refusal made at a person's normal speed (reading the question first) is told as a refusal, not as a lockout (the
  0.8 s threshold in Decisions).

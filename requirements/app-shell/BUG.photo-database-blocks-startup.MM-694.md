---
id: MM-694
status: in-progress
component: app-shell
related: [MM-157, MM-333, MM-679]
---

# Bug: the app dies at the door when the photo database cannot be opened

## Context
The owner, 2026-10-29, on the phone, unplugged: the app had been in use, the phone slept a long while with the
app resident, and on unlock the screen read "Could not open your data. Nothing you logged has been changed. Close
the app and open it again." Read off the phone over USB the same afternoon: the database is sound (schema 31,
integrity ok, written at 13:59), and the same build opened to the Dashboard when started again with the phone
unlocked. The phone kept no jetsam or crash record of it.

What the code does: the shell starts the web app again whenever iOS drops the web view's process (Capacitor's
`webViewWebContentProcessDidTerminate` resets the bridge and reloads the page), and that start opened the
progress-photo database. On iOS that file is `.completeUnlessOpen` (MM-157): it cannot be opened while the phone is
locked unless the app already holds it open, and a start holds nothing. A start made while the phone is locked
therefore fails at the photos, and `main.tsx` took the whole app down with it: the error's own text went to the
console only, and the screen offered nothing but closing the app. MM-157's own phone checks foresaw this: "if a
launch in the background while locked fails to open it, the protection must move to opening the photo database
lazily." That the owner's start was one made behind the lock screen is inferred from the above, not observed.

## Description
The photo database is opened on first use, never when the app starts: a start that could not open it still opens
the app, and the photo surfaces say the photos could not be read, with Try again, until they can. A start whose data
cannot be opened for any other reason says so in the app's own notice, with Try again that opens the data again; the
error's text stays in the console (MM-333).

## Acceptance Criteria
```gherkin
Scenario: The photo database cannot be opened when the app starts
  Given the photo database cannot be opened, as on a locked iPhone
  When the app starts
  Then the app opens as usual
  And the photo database is asked for only when a photo surface first needs it
  And that surface says the photos could not be read, with Try again

Scenario: The photo database opens later
  Given the photos could not be read because their database could not be opened
  When Try again is pressed once the phone is unlocked
  Then the photos are read

Scenario: The data cannot be opened when the app starts
  When the app starts and its data cannot be opened
  Then it says the data could not be opened and that nothing logged has been changed, in a notice with Try again
  And no error text from storage is shown
  And Try again opens the data again, and the app is drawn when that succeeds
```

## Notes
Built 2026-10-29. `LazyProgressPhotoRepository` (`src/data/`) opens the repository it is given on the first call and
forgets an opening that failed, so the next call tries again; `openAppServices` opens the photo database through it.
`startApp` (`src/app/startApp.ts`) opens the services and draws the app, and draws `OpeningFailed` (the app's
`ReadFailedNotice`, "Could not open your data", Try again) when that fails; `main.tsx` only wires it. Guarded by
`test/data/lazyProgressPhotos.test.ts` (nothing opened until asked; a failed opening told to the subscriber and tried
again; the contract suite over the lazy repository), `test/app/photosOpenedLazily.test.ts` (the photo database is
opened inside the lazy repository in `openAppServices`, which failed before the fix) and `test/app/startApp.test.tsx`
(the notice, the error's words off the screen, Try again opening again and drawing the app). Story
`OpeningFailedAtStart` in `Today.stories.tsx`. Not run locally; CI validates. **Owed: the owner's phone**, the app
opening after a long sleep with it resident, and a photo surface saying Try again rather than the app dying if the
start ever lands while locked. The native plugin keeps the handles a dropped web view opened; not changed here.

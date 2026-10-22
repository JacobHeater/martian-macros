---
id: MM-560
status: done
component: body-measurements
related: [MM-157, MM-557]
---

# Bug: The photo camera blamed the phone's settings for every failure

## Context
The owner, 2026-10-22, on their iPhone in a live-reload session (`mm run --ios --phone --live`, MM-557): "Take photos"
said "The camera could not be opened. Allow the camera for Martian Macros in your phone's settings", though the camera
was allowed there.

The cause: progress photos are taken through the web view's `getUserMedia` (MM-157), which a web view gives only to a
secure page. The live session loads the app from the Vite dev server over the local network in plain http
(`http://192.168.x.x:5173`), which is not secure, so `navigator.mediaDevices` is absent. `PhotoCamera.start` returned
undefined for that, for a refusal, for no camera and for a busy one alike, and the screen put every case down to the
settings. The installed app (`capacitor://localhost`) and Android's live reload (`http://localhost` through adb reverse)
are secure pages.

## Decisions
Choices I made without asking (say if any is wrong):
- **`PhotoCamera.start` says why it did not start**: `notAllowed`, `noCamera`, `busy` or `insecurePage`
  (`PhotoCameraProblem`). The web view's adapter reads the error's name (`NotAllowedError`; `SecurityError` as an
  insecure page; `NotReadableError` and `AbortError` as busy; anything else as no camera), and a missing
  `mediaDevices` on a page that is not secure as `insecurePage`.
- **The notice keeps its title, "Try again" and the retry on coming back**, and its words follow the reason.
- **The live session itself is not changed here.** Serving it over https with a certificate the phone trusts would give
  it the camera; that is its own change to MM-557's tooling, if wanted.

## Description
A camera that does not open says why, and sends the person to their settings only when the camera was not allowed.

## Acceptance Criteria
```gherkin
Scenario: A page that may use no camera
  Given the app is loaded from a page that is not secure (the iPhone's live reload)
  When the person opens "Take photos"
  Then the notice says this copy of the app is loaded from a development server and their settings are not the cause
  And it does not tell them to allow the camera in settings

Scenario: Not allowed
  Given the person did not allow the camera
  Then the notice says to allow it in the phone's settings, as before

Scenario: Busy
  Given another app or a call holds the camera
  Then the notice says to close it and try again

Scenario: Each refusal told apart
  Given getUserMedia refuses with NotAllowedError, SecurityError, NotReadableError, AbortError, NotFoundError or OverconstrainedError
  Then the camera gives notAllowed, insecurePage, busy, busy, noCamera and noCamera
```

## UI/UX
- PhotoCameraInsecurePage — apps/mobile/src/gallery/screens/Progress.stories.tsx (Story: PhotoCameraInsecurePage).
  The same notice as `PhotoCameraUnavailable`, with the reason's own words.

## Notes
Regression tests: `test/platform/photoPrivacySeams.test.ts` ("a page that is not secure gets no camera, and says so
rather than that it was not allowed", "a refusal is told apart by its name") and `test/progress/progressPhotos.test.tsx`
("a camera that cannot open for another reason than permission says so, not to change the settings"). The contract
(`test/contracts/photoCameraContract.ts`) now holds every camera to giving one of the reasons.

Not run locally (owner's rule); CI validates. Owed on a phone: the installed app opens the camera on the iPhone
(`mm run --ios --phone`, not `--live`).

---
id: MM-157
status: done
component: body-measurements
related: [MM-154, MM-10, MM-11, MM-33, MM-44, MM-62, MM-63, MM-65, MM-95, MM-118, MM-144, MM-155]
---

# Story: Progress photos that stay on my phone and are taken the same way each time

## Context
See MM-154. Photos were in the original plan for onboarding baselines and the monthly report and were deferred (MM-10, MM-33). The
physique-assessment view is that for recomposition they are the most informative record a user can keep: a body that weighs the same and
looks different is the product's whole promise, and only a picture shows it.

They are also the most sensitive data the app could hold, and the measure most affected by how it is taken. Lighting, distance, time of
day, a recent meal and posture change how a body looks by more than a month of progress does.

Evidence: there is no trial literature on progress photos and outcomes worth citing (**judgement** throughout). Body-image research
gives reason for caution: frequent body checking is associated with worse body image and eating-disorder symptoms (**moderate**).

## Decisions
Choices I made without asking (say if any is wrong):
- **A future phase.** Nothing here is needed for the coach to work.
- **Photos never leave the device by the app's doing.** They are stored in the app's private storage, are not added to the phone's
  gallery, are excluded from the operating system's cloud backup (MM-65), and are included in the app's own encrypted backup only if the
  user turns that on, with a size warning (MM-63). Erasing all data erases them (MM-62).
- **No analysis of any kind.** No body-fat estimate from a photo, no comparison scoring, no detection, no upload (MM-144). The app stores
  and displays; the user looks.
- **A standard set**: front, side, back, relaxed. Each is optional.
- **Consistency is the feature.** The camera screen shows the previous photo of the same pose as a faint overlay to match distance and
  framing, and a checklist the first times: same place, same light, same time of day (morning, with the weigh-in), same clothing.
- **Every two to four weeks**, with a reminder if wanted. The app does not invite more often, and a second set within seven days is
  stored and gently noted as more often than is useful.
- **Comparison is side by side, same pose**, between any two dates, with the dates, trend weights and waist under each. No slider that
  morphs one into the other; no "before and after" export template (MM-96).
- **Hidden from the app switcher and screenshots while on screen**, and behind the device lock (biometric or passcode) each time the
  photo section is opened.
- **Off, and not offered, for a user with an eating-disorder history** (MM-11), who may enable it in Settings.
- **Respects the weight-display setting** (MM-118): no weight under the photos when numbers are hidden.

Where the experts disagreed:
- The bodybuilding coach and the physique expert consider photos essential and wanted them in the first release. The research and safety
  experts consider them the feature with the highest ratio of privacy and body-image risk to coaching value, since the coach cannot use
  them. Deferred, with the privacy rules fixed now so that it is built correctly when it is built.
- The product strategist wanted a shareable comparison image for word-of-mouth. Declined: it turns a private record into a public
  performance, and before-and-after imagery is excluded from the app's own marketing (MM-96).

## Description
A private photo store, a guided camera with overlay, a comparison view, and backup and erase integration.

## Acceptance Criteria
```gherkin
Scenario: Private
  When a photo set is taken
  Then the photos do not appear in the phone's gallery and are not included in the operating system's backup

Scenario: Matching the last one
  Given a previous front photo
  When the camera is opened for a front photo
  Then the previous one is shown as a faint overlay

Scenario: Comparing
  When two dates are chosen
  Then the same pose from each is shown side by side with its date

Scenario: Locked
  When the photo section is opened
  Then the device lock is required, and the screen is blanked in the app switcher

Scenario: Never analyzed
  Then no code path sends a photo anywhere or computes anything from its contents

Scenario: Backup
  Given encrypted backup is on and photo backup is off
  Then a backup contains no photos

Scenario: Erased
  When all data is erased
  Then no photo remains in the app's storage

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then the photo feature is not offered anywhere until enabled in Settings
```

## Notes
- Priority: future phase.
- Camera permission and its purpose string join the privacy documents (MM-95) when this is built.
- Photos can be large: a set every two weeks at full resolution is several hundred megabytes a year. Store a reduced size (about 2
  megapixels is ample for comparison).

## Decisions (made while building, 2026-10-21; say if any is wrong)
- **Built now**, not as a future phase: the owner asked for every feature.
- **The standard set is three poses, front, side and back, each standing relaxed**; "relaxed" is how each is taken,
  not a fourth pose. Each is optional.
- **The photos are a database file of their own** (`<user database>-photos`, `progressPhotoSchema`, its own version
  1), not tables of the user's database. So the database's snapshot, which is the backup, never holds a photo, and
  the user's schema is unchanged. Named databases are already outside the phone's own backup
  (`android:allowBackup="false"`; iOS `isExcludedFromBackup`, MM-65).
- **The app's backup carries the photos only when "Back up photos" is on** (Settings, Backup), which says what they
  add to the file's size. Such a backup is format 2 (the database's length, the database, then the photo archive,
  all sealed); without photos it stays format 1. Restoring a backup with photos replaces this phone's photos;
  restoring one without leaves them as they are.
- **Photos are taken inside the app, through the web view's own camera** (`MediaDevicesPhotoCamera`), reduced to
  about 2 megapixels on a canvas and kept as JPEG. Nothing passes through the phone's camera app, so nothing reaches
  the gallery. The back camera first, with a switch to the front one.
- **The lock and the private screen are on the `MmBackup` plugin** (`MmPrivacyApi`), so no plugin is registered:
  Android asks the phone's own credential screen (`KeyguardManager`) and sets `FLAG_SECURE` while a photo shows
  (out of the switcher and screenshots); iOS asks `LocalAuthentication` (Face ID, Touch ID or passcode) and covers
  the app with a blank view while it is in the switcher. iOS cannot block a screenshot. A phone with no lock set
  opens the photos as it opens the rest of the app.
- **"Offered" is a Settings switch ("Progress photos", Data)**, on by default and off by default with an
  eating-disorder history; the photos are reachable only from Progress.
- **The checklist is drawn for the first three sets**; a set within seven days of the last is kept and noted in the
  message that confirms it.
- **The comparison says the trend weight, never a raw reading**, and the waist measured within a week of each day;
  `PhotoCompareScreen` takes `showWeight` for the weight display setting (MM-118).
- **Privacy text**: the camera sections of the terms and the privacy policy, and the policy's first summary line,
  now name progress photos. The terms' version is not raised here; that is the legal gate's (MM-453, release).
- **No reminder of its own yet**: the reminders (MM-146) have no photo kind; the screen says every two to four
  weeks is enough.

## Progress
Built 2026-10-21. Not run locally; CI validates.
- Domain: `PhotoPose`, `ProgressPhoto`, `NewProgressPhoto`, `PhotoSettings`, `photoSets`, `tooSoonForPhotos`,
  `photosOffered`, the archive (`encodePhotoArchive`, `decodePhotoArchive`); `ProgressPhotoRepository` (reader,
  writer, archive); `PhotoCamera`, `CameraPreview`, `DeviceLock`, `PrivateScreen`.
- `SqlProgressPhotoRepository` over its own database, `InMemoryProgressPhotoRepository`; `EraserWithPhotos` so
  erasing all data erases the photos; the in-memory set's eraser too.
- Screens: the Progress line (`ProgressPhotosCard`), `ProgressPhotosScreen` (the lock each opening, the sets,
  deleting a set), `PhotoCameraScreen` (overlay, checklist, poses in turn, the seven-day note, no camera),
  `PhotoCompareScreen`; design-system `MmPhoto` and `MmCameraPreview`; Settings switches (offered; Back up
  photos with its size).
- Native: `unlock` and `protectScreen` on `MmBackupPlugin` (Kotlin and Swift); `NSFaceIDUsageDescription`, and the
  camera's purpose string names progress photos.
- Guarding tests: `progressPhotoRepositoryContract` (in memory and SQLite) and `test/data/progressPhotos.test.ts`
  (reopened, a newer file refused, erasing leaves no picture bytes in the file); `test/domain/progressPhotos.test.ts`;
  `test/backup/backupFile.test.ts` (format 2 with photos, format 1 without); `test/settings/backupPhotos.test.tsx`
  (Backup: no photos with photo backup off; with it on, they are in it; restore with and without photos);
  `test/progress/progressPhotos.test.tsx` (Locked, Matching the last one, the seven-day note, no camera, the camera
  off when left, Comparing, deleting, Eating-disorder history, Erased, Never analyzed).
- Stories: `ProgressWithPhotos`, `ProgressPhotosNone`, `ProgressPhotosSets`, `ProgressPhotosLocked`,
  `PhotoCameraFirstTime`, `PhotoCameraOverlay`, `PhotoCameraUnavailable`, `PhotoCompare`, `PhotoCompareOneDay`,
  `SettingsBackupPhotos`; the catalog draws `MmPhoto` and `MmCameraPreview`.

## Owed on a phone
- Android: the camera opens in the app (the web view asks for the camera permission), a photo is kept, and it is not
  in the gallery; the credential screen is asked each time the photos open; the app switcher shows the photos
  blank and a screenshot is refused while they show.
- iOS: the same with Face ID or the passcode; the switcher snapshot is blank while the photos show.
- The photo database survives an app update and is gone after Erase all data; a backup with Back up photos on
  restores the photos on another phone.
- The Android and iOS builds compile the plugin additions (written without a local build).


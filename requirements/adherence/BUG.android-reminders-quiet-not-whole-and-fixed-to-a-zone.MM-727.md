---
id: MM-727
status: in-progress
component: adherence
related: [MM-146, MM-248, MM-405]
---

# Bug: Android's reminders differ from iOS's: silent over an open app, a plan half set, and fixed to the old time zone

## Context
Read from the sources on 2026-11-05, a parity pass over the Android app. Three differences from the iOS
reminders (MM-405), which MM-146 and MM-405 say match:
- the channel was made with `IMPORTANCE_DEFAULT`, so a reminder due while the app is open makes a sound and
  a status-bar icon and shows nothing over the app; iOS shows a banner (`AppDelegate.swift`,
  `[.banner, .sound]`);
- `replaceAll` cancelled every alarm and persisted the new plan before reading each entry, so a plan with a
  fault in it was half set and the faulty plan kept for the boot receiver; iOS reads the whole array first
  and refuses it untouched;
- each alarm is an instant (`atMs`, `RTC_WAKEUP`); after the phone's time zone changes a 7:00 weigh-in
  fires at the old zone's 7:00 until the app is next opened, where iOS's calendar trigger follows the wall
  clock.

## Description
The channel is of high importance (Android keeps a channel's importance as first made, so the quiet one is
deleted and a new one made), and a reminder due while the app is open is shown over it, as on iOS. A plan is
read whole before anything scheduled is touched, and refused whole with "A reminder needs a title and a
time." After the phone's time zone changes, each reminder keeps its wall-clock time: the plugin keeps the
zone the plan was made in, and the boot receiver, told of the change, moves each instant to the same local
time in the new zone and sets the alarms again.

## Acceptance Criteria
```gherkin
Scenario: Due while the app is open
  Given a reminder is due now
  When the app is open
  Then the reminder is shown over it, as on iOS

Scenario: A plan with a fault
  Given a reminder plan with an entry missing its time
  When the app schedules it
  Then nothing scheduled changes, and the plan is refused

Scenario: The phone travels
  Given a weigh-in reminder at 7:00
  When the phone's time zone changes
  Then the reminder is at 7:00 where the phone now is
```

## Notes
- Regression test: `test/android/remindersOnAndroid.test.ts`.
- Where: `MmRemindersPlugin.kt` (`Reminders.planned`, `replaceAll`, `rezoned`, `ensureChannel`),
  `ReminderBootReceiver.kt`, the manifest's `TIMEZONE_CHANGED` filter.
- The app re-plans reminders whenever it is open (`keepRemindersScheduled`, MM-146), so the zone's drift
  lasted until the next open; the receiver closes that gap.
- Owed on the owner's Pixel, on a build of main: a reminder due with the app open shown over it. Not run
  locally; CI validates.

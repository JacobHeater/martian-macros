---
id: MM-405
status: done
component: adherence
related: [MM-146, MM-248, MM-403]
---

# Task: Reminders on iOS

## Context
MM-146 built the reminders: what to send and when is worked out in the
engine (`planReminders`), and the phone only shows a prompt at an instant.
On Android the `MmReminders` plugin takes the whole plan (`replaceAll`),
cancels what was scheduled before, sets an alarm for each reminder still to
come, and sets them again after a restart, because Android forgets alarms
when the phone turns off. The prompt is the whole notification: no weight,
calories, target or streak ever appears on a lock screen.

## Decisions
Choices I made without asking (say if any is wrong):
- **`UNUserNotificationCenter`, local notifications only.** No push service
  and no token, as on Android; nothing leaves the device.
- **`replaceAll` removes every pending request and adds one per reminder**,
  with a calendar trigger at the reminder's local wall-clock time. iOS keeps
  pending requests across a restart, so there is no boot receiver.
- **Within iOS's limit.** iOS keeps at most 64 pending requests per app; the
  plan is at most `ReminderRule.ignoredLimit` (7) per reminder kind, so it
  always fits.
- **Permission is asked once, for alerts and sound**, and `granted` answers
  from the notification settings afterwards, so a person who refused in
  Settings is told the truth.
- **A reminder whose time has passed is not scheduled**, as on Android.

## Description
`MmReminders` in Swift, in the iOS shell: the plan the app hands over is
exactly what is pending, a reminder shows its prompt at its time, and
refusing permission is reported as refused.

## Acceptance Criteria
```gherkin
Scenario: The plan is what is pending
  Given the weigh-in reminder on for 7:00 am
  When the app schedules
  Then the pending notification requests are the plan's reminders, each at its day and time, and nothing else

Scenario: A reminder shows its prompt and nothing more
  Given a reminder due
  When its time comes
  Then a notification shows the prompt as its title, with no body

Scenario: Permission refused
  Given notifications refused for the app
  When the app asks for permission
  Then it is told the permission was not granted

Scenario: Replaced, not added to
  Given three reminders pending
  When the plan becomes one reminder
  Then one request is pending
```

## Notes
- The simulator shows local notifications and lists what is pending through
  the plugin; a reminder at its time on a phone is on the owner's checklist.

## Progress
Done 2026-10-21. Not run locally; CI validates the TypeScript tests. CI builds no iOS app, so the Swift is held by
`test/ios/remindersOnIos.test.ts`, which reads it, until it is built on the Mac.
- `ios/App/App/Plugins/MmRemindersPlugin.swift`: every method of the Android plugin. `replaceAll` reads the whole
  plan first (a malformed plan leaves what was pending alone), then removes every pending request and adds one per
  reminder still to come, with a calendar trigger at its local wall-clock time, the prompt as the title and no body.
  `requestPermission` asks for alerts and sound and answers from the notification settings. MM-248's exact-alarm
  calls answer "on the minute", which a calendar trigger already is.
- `ios/App/App/AppDelegate.swift` is the notification centre's delegate and shows a reminder due while the app is
  open as a banner with its sound, as Android does.
- Fixed while finishing: the scheduling callbacks wrote their failure from several threads at once; it is now
  locked.
- Review fix 2026-10-21 (`fix/privacy-housekeeping`): iOS keeps only the soonest 64 pending notifications and drops
  the rest unsaid, so `planReminders` caps the plan at `ReminderRule.mostPending` (64), the soonest first, on every
  platform. Today's rules plan at most 21 (three kinds, seven each), so the cap is a guard. Test:
  `test/engine/reminders.test.ts` ("the most pending at once").

## Owed on a phone
- With the weigh-in reminder on for 7:00 am, the pending requests are the plan's reminders and nothing else (the
  simulator lists them; on Android the plan is the same code).
- A reminder shows its prompt as the title with no body at its time, with the app closed and with it open.
- Notifications refused in Settings: turning a reminder on is told the permission was not granted.
- Three reminders pending, then a plan of one: one is pending.
- The first iOS build of the plugin.

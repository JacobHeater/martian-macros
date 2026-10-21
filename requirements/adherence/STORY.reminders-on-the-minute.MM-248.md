---
id: MM-248
component: adherence
status: in-progress
related: [MM-146, MM-95]
---

# Story: reminders arrive on the minute

## The decision

The owner's call (2026-10-13): request Android's exact-alarm permission so a
weigh-in or logging reminder arrives at the time set, not within an hour of
it (MM-146 schedules them inexactly today).

## Decisions

Choices made while building it (say if any is wrong):

- **The question is the app's two-answer dialog** (`overlays.choice`,
  not the destructive confirm): title "Reminders on the minute", the one
  line of reason, "Open phone settings" and "Not now"; closing it is "Not
  now". Android 12 and later have no
  dialog for this permission, only a page in the phone's settings, so the
  dialog is the reason and the phone's page is the "system prompt".
- **"Not now" is an answer**: it is not asked again.
- **The row sits under the reminders, built like the "At 7:00 AM" time
  row** (a dense `MmListRow`), and shows only while a reminder is on.
  "Within an hour" opens: before the question was answered (a reminder
  turned on in onboarding), it asks; after a "no", it goes straight to the
  phone's page, without the question.
- **Whether the person was asked is kept by the phone**, in the plugin's
  own preferences beside what is scheduled, not in the database: it is a
  fact about this phone's permission, and needs no schema change.
- **Allowed later in the phone's settings**: Android tells the app, and
  what is scheduled is set again on the minute at once (the boot
  receiver listens for it); so does coming back from the phone's page.
  Withdrawn: Android cancels the exact alarms, and the plan the app
  replaces on its next opening is scheduled inexactly.
- **iOS has nothing to ask**: a calendar trigger is on the minute, so its
  plugin answers "On the minute".

## What to build

- `MmReminders` schedules with an exact alarm when the permission is held
  and falls back to the inexact one when it is not, with the same plan.
- The app asks once, from the reminder settings, with one line of reason:
  "So a reminder arrives at the time you set." It never asks on first run
  and never blocks anything on the answer.
- Settings shows which it is: "On the minute" or "Within an hour", and a
  way to the system setting when the permission was declined.
- The permission is declared with its reason for Play's form (MM-95).

## Acceptance criteria

```gherkin
Scenario: Granted
  Given the exact-alarm permission is held
  When a reminder is scheduled for 7:00
  Then the alarm is exact and the row says "On the minute"

Scenario: Declined
  Given the permission was declined
  Then reminders are scheduled inexactly, the row says "Within an hour", and nothing else changes

Scenario: Asked once, with a reason
  When reminders are first turned on
  Then the reason is shown before the system prompt, and the prompt is not shown again after an answer

Scenario: Never on first run
  Given a new installation
  Then no permission prompt appears before the person opens reminders

Scenario: Declined, and changed their mind
  Given the permission was declined
  When the "Within an hour" row is pressed
  Then the phone's setting opens without the question
  And once it is allowed, what is scheduled is set again on the minute
```

## UI/UX

- ReminderOn — apps/mobile/src/gallery/screens/Settings.stories.tsx
  (Story: ReminderOn). The "On the minute" row under a reminder that is on.
- ReminderWithinAnHour — apps/mobile/src/gallery/screens/Settings.stories.tsx
  (Story: ReminderWithinAnHour). Declined: "Within an hour", leading to
  the phone's setting.
- ReminderOnTheMinuteAsked — apps/mobile/src/gallery/screens/Settings.stories.tsx
  (Story: ReminderOnTheMinuteAsked). The one line of reason, before the
  phone's own page.

## Notes

- Android 12 and later: `SCHEDULE_EXACT_ALARM` needs the person's consent in
  system settings; Android 13 and later offers `USE_EXACT_ALARM` to apps
  whose core function is alarms, which this app's is not, so the first is
  the one to request. Verify on a device; the emulator's behaviour differs
  by image.

## Progress

Built (2026-10-21):

- **The permission**: `SCHEDULE_EXACT_ALARM` in the Android manifest, with
  its reason beside it, and not `USE_EXACT_ALARM`.
- **Scheduling** (`MmRemindersPlugin.kt`): every reminder is scheduled with
  an exact alarm when the phone allows it (always before Android 12) and
  with the inexact one otherwise, from the same plan. If the permission is
  withdrawn between the check and the call, the inexact one.
- **The interface**: `ExactAlarms` (timing, open the phone's setting,
  "Not now"), answering a `ReminderTiming`: on the minute, not asked, or
  within an hour. `NativeExactAlarms` over the plugin, `InMemoryExactAlarms`
  for tests and the gallery, `NoExactAlarmPermission` in a browser; the
  Swift plugin answers "On the minute".
- **Settings, Reminders**: turning a reminder on, once notifications are
  allowed, asks the question if it has not been asked; the row says "On
  the minute" or "Within an hour". Nothing is asked on first run or in
  onboarding.
- Tests: `exactAlarmsContract` against the in-memory one in four states,
  the plugin stood in for in three, and the browser's
  (`seamFixtures.test.ts`, `nativeExactAlarms.test.ts`); the scenarios in
  `test/settings/reminders.test.tsx` ("on the minute"). Not run locally;
  CI validates.

Not verified (needs the phone):

- On Android 14 or later (where the permission starts off): the question,
  the phone's "Alarms & reminders" page opening for this app, and the row
  turning to "On the minute" on return.
- A reminder at 7:00 arriving at 7:00 with the permission, and within the
  hour without it; and alarms set again on the minute when the permission
  is allowed from the phone's settings directly.
- On Android 12 or 13 the permission may already be held: the row says
  "On the minute" and nothing is asked.

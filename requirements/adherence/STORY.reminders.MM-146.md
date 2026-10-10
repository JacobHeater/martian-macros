---
id: MM-146
status: in-progress
component: adherence
related: [MM-145, MM-16, MM-24, MM-80, MM-92, MM-95, MM-108, MM-116, MM-118, MM-138, MM-144, MM-147, MM-148, MM-155]
---

# Story: Reminders I choose, that give up politely

## Context
See MM-145. The app has no notifications. The two habits the coach depends on, a morning weigh-in and a logged day, are exactly the kind
that a well-timed prompt helps form. They are also the kind of notification people come to resent.

Constraints from elsewhere: the app is offline-only (notifications must be scheduled on the device, with no server); MM-92 says no
notifications unless the user turns them on; health data must not appear on a lock screen.

## Decisions
Choices I made without asking (say if any is wrong):
- **Every reminder is off until the user turns it on**, individually. Onboarding offers the weigh-in reminder once, after the plan screen,
  and takes no for an answer. The system permission is requested only when the first reminder is switched on.
- **The reminders**:

| reminder | default time | sent when |
|---|---|---|
| weigh-in | 7:00 am | no weigh-in yet today |
| log food | 8:00 pm | nothing logged today |
| check-in summary ready | on opening is enough; optional notification at 9:00 am | a check-in changed the targets (MM-138) |
| weekly measurement | Sunday 8:00 am | waist not measured in 7 days (MM-155) |
| weekly recovery check-in | with the check-in | not yet answered this week (MM-116) |

- **Each has its own time**, and all respect a quiet period (default 9 pm to 7 am).
- **At most two notifications in a day**, whatever is enabled.
- **A reminder that is ignored stops.** After a reminder has been sent on 7 consecutive days with no matching action, it pauses itself
  and the next time the app is opened a single line asks: "Weigh-in reminders are paused. Keep them or turn them off?" It never
  escalates, repeats within a day, or changes tone.
- **Wording is a plain prompt** (MM-108): "Morning weigh-in?" "Log today's food?" Never a streak at risk, a count of missed days, or a
  statement about the user.
- **No health data in a notification**: no weight, no calories, no target, no change. "Your weekly check-in is ready" and nothing more.
  Obeys the weight-display setting trivially (MM-118).
- **No engagement notifications**: nothing is ever sent because the user has been away (MM-144). A user who stops opening the app stops
  hearing from it, by the rule above.
- **A pause silences everything** for its duration (MM-148).
- **Scheduled locally**; no push service, no token, nothing leaves the device (MM-95 lists every network request and gains none).

Where the experts disagreed:
- The product strategist wanted a win-back notification after seven days of absence, citing retention practice. The behavior-change and
  safety experts: a diet app that pings a lapsed user is delivering shame on schedule, and for the user who left because tracking was
  hurting them it is worse than that. The app's answer to absence is the welcome back (MM-147), which happens only when they choose to
  return.
- The adherence expert wanted the evening food reminder to fire when the day looks *incomplete* (under half of usual intake). Rejected:
  it requires the app to judge the user's eating in a notification.

## Description
Local scheduled notifications with a settings screen; an ignored-reminder counter per type.

## Acceptance Criteria
```gherkin
Scenario: Off by default
  Given a new user who declined the offer in onboarding
  Then no notification is ever sent and no permission was requested

Scenario: A weigh-in reminder
  Given the weigh-in reminder is on for 7:00 am
  And no weigh-in today
  Then a notification reading only a prompt to weigh in is shown at 7:00 am

Scenario: Already done
  Given a weigh-in was saved at 6:40 am
  Then no weigh-in reminder is sent that day

Scenario: Ignored for a week
  Given the weigh-in reminder was sent on 7 consecutive days with no weigh-in on any
  Then it is not sent on the eighth day
  And on next opening the app asks once whether to keep it

Scenario: No health data
  Then no notification contains a weight, a calorie figure, a target or a streak

Scenario: A cap
  Given four reminders are enabled and all four conditions hold
  Then at most two notifications are shown that day

Scenario: Absent users are left alone
  Given a user who has not opened the app for 30 days
  Then no notification has been sent since their reminders paused

Scenario: No network
  Then enabling reminders causes no network request
```

## Notes
- Priority: should-have.
- Android's exact-alarm and notification permissions, and iOS's limit on pending local notifications, need checking against the pinned
  Flutter version; a small spike if either is awkward.
- Time-zone changes: reminders follow local time (the same choice as the calendar day, MM-16).

## Progress
Built:
- **Three reminders**, each off until turned on in Settings, "Reminders": weigh-in (7:00 am, on days with no weigh-in yet), log food
  (8:00 pm, on days with nothing logged yet) and weekly measurement (Sunday 8:00 am, when the waist has not been measured in 7 days).
  Each has its own time, chosen with a time picker.
- **Permission** is asked of the phone only when a reminder is switched on. If it is refused the reminder stays off and a line says
  why. Starting the app asks for nothing.
- **Scheduled on the device** (`ReminderScheduler`, implemented over the phone's own scheduled notifications; an in-memory one for
  tests). No push service and no token; the plugin makes no network request. On Android they are scheduled inexactly, so no
  exact-alarm permission is needed and a reminder can be up to an hour late.
- **The plan** (`planReminders`, a pure function): whenever the app is opened or anything changes, what the phone has scheduled is
  replaced by the plan. A weigh-in at 6:40 removes that morning's reminder; logging food removes that evening's.
- **Ignored for a week, it stops.** Nothing is recorded when a reminder fires. The count is the run of days since the reminder was
  turned on (or last kept) on which it was due and the thing was not done (`reminderIgnoredStreak`). Each reminder is only ever
  scheduled as far as seven sends, so a user who stops opening the app hears seven and then nothing: nothing is sent because someone
  is away. On next opening the dashboard shows one line, "Weigh-in reminders are paused. Keep them or turn them off?".
- **At most two a day.** When three fall on a Sunday the weekly one is kept and the evening food reminder is dropped, because a daily
  one comes round again tomorrow.
- **Quiet from 9 pm to 7 am**: a time in that period cannot be chosen, and none is planned in it.
- **A pause silences its days** (MM-148), and paused days do not count as ignored.
- **Wording**: the prompt is the whole notification ("Morning weigh-in?", "Log today's food?", "Time for this week's
  measurement?"). A test forbids digits, weight, calories, targets, streaks, "missed" and "you" in every one.
- Rules are in `ReminderRule`. Schema version 21 stores the settings. Tests: `reminders_test.dart` (engine), `reminders_test.dart`
  (app), the reminder repository contract against both implementations, and the migration test.

Not built:
- The check-in-ready notification: a check-in runs when the app is opened, so there is nothing to announce beforehand without
  predicting whether the targets will change. The summary on opening (MM-138) is what exists.
- The weekly recovery check-in reminder: MM-116 is not built.
- The offer of the weigh-in reminder at the end of onboarding.
- A quiet period the user can change: it is fixed at 9 pm to 7 am.
- Doing the thing restarts a reminder that had paused itself, without the question being asked.
- Checked on the Android emulator: the Reminders group, the permission prompt appearing only when a reminder is switched on, seven
  alarms held by Android for 8:00 pm on the next seven days, and all of them gone when it is switched off. Android gives each a
  one-hour window, so a reminder can be up to an hour late. A reminder actually appearing was not seen (it was night, inside the
  quiet period).
- iOS: untried. The app delegate has not been changed to show a reminder while the app is in the foreground.
- A phone restart: Android forgets scheduled notifications; the plugin's boot receiver is declared so they are set again, which has not
  been tested.

---
id: MM-146
status: proposed
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

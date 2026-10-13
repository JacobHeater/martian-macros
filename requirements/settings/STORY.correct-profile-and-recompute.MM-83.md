---
id: MM-83
status: done
component: settings
related: [MM-80, MM-11, MM-14, MM-24, MM-62]
---

# Story: Correct my profile or health check without losing my data

## Context
Sex, date of birth and height are shown in Settings but cannot be changed, and the health check cannot even be seen. The only fix for a
mis-tap is erasing everything (MM-62). The health check is not a one-time fact either: someone becomes pregnant, stops breastfeeding, or
is diagnosed with something.

## Decisions (made with the product owner)
- **A user may correct a mis-tapped sex.** When they do, everything is recomputed from stored history, since the engine is a pure function
  of it.

Choices I made without asking (say if any is wrong):
- **Changing sex needs a deliberate confirmation**, explaining that energy needs and limits will be recalculated. Female-only health
  answers are cleared when changing to male.
- **Changing sex, date of birth or height issues new targets immediately**, without the weekly step limit, like a change of goal. The old
  targets were computed for someone else.
- **Changing a health-check answer takes effect immediately** as well: a goal that is no longer allowed falls back to maintenance at once,
  and the user is told why.
- **Past targets in the history are left as they were** (they are a record of what the app said at the time); only current and future
  targets change.

## Description
Settings lets the user edit sex, date of birth and height, and revisit the health check with the same questions as onboarding.

## Acceptance Criteria
```gherkin
Scenario: Correcting sex
  Given a profile entered as male by mistake
  When it is changed to female and confirmed
  Then resting energy, body-fat estimate, calorie floor and targets are recalculated for a female profile at once
  And all logged food and weigh-ins are kept

Scenario: Becoming pregnant
  Given a female profile on fat loss
  When Pregnant is ticked in the health check
  Then the goal becomes maintenance immediately, with an explanation

Scenario: No longer breastfeeding
  Given a profile with Breastfeeding ticked
  When it is unticked
  Then the 400 kcal addition is removed and all goals are offered again

Scenario: Under 18 by correction
  Given a date of birth corrected to one that makes the user under 18
  Then coaching stops, as for any under-18 profile
```

## Notes
- The engine already recomputes from history on every change; what is missing is the screens, and the "apply immediately" rule in
  `nextTargets` (today only a goal change bypasses the weekly wait).

## Progress (built and verified)
- Settings has a Profile group (`settings/profile_section.dart`): biological sex (a confirmation that says what is recalculated and that food and weigh-ins are kept; female-only health answers are cleared when changing to male), date of birth (a date picker), height (a sheet in feet and inches or centimetres that saves only 100 to 250 cm), and a Health check screen that reuses the onboarding questions and saves each change at once.
- Every change bumps `UserSetup.profileRevision`; each targets record stores the revision it was made for (`TargetsRecord.profileRevision`). When they differ, `nextTargets` issues new targets that day with no weekly wait and no step limit. Past targets are not changed. Schema version 4 adds both columns (default 0); a test migrates a populated version-1 database through every step.
- A health answer that rules the goal out (pregnant, breastfeeding, an eating-disorder history) makes the record maintenance with `modeNotAllowed` (the Coach screen says why) and the app moves the stored goal to maintenance, as MM-111 does for low weight, so a deficit does not resume by itself when the answer is unticked. Unticking offers every goal again; it does not choose one.
- A date of birth that makes the user under 18 shows an adults-only screen (`app/adults_only_screen.dart`) with a way back to Settings to correct it; coaching is off.
- **Found and fixed on the way**: the check-in ran inside the home screen, and Riverpod pauses watchers under a covered route, so a change made in Settings did not take effect until the user went back. It now runs above the navigator (`app/check_in_host.dart`). This also affected earlier flows that change setup from Settings.
- Tests: engine (new revision issues targets at once and unthrottled; same revision waits; a health answer makes maintenance flagged; no rewrite loop), repositories (revision round-trips through Drift and in-memory), and app (correct sex, cancel, male clears female-only answers, pregnant, no longer breastfeeding and every goal offered again, under 18, height, an implausible height cannot be saved).
- **Not verified**: on a device; a user whose weigh-ins or food are many days old when they correct a profile. Whether unticking pregnancy should hold the user at maintenance for a while (postpartum) is a question for MM-112.
- **Not done**: a changed health answer explains itself only through the existing Coach flag text; the fuller "why targets changed" explanation is MM-138.

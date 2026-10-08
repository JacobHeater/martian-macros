---
id: MM-90
status: done
component: app-shell
related: [MM-89, MM-9, MM-41, MM-80, MM-99]
---

# Story: Three tabs, and a day that rolls over

## Context
See MM-89.

## Decisions
Choices I made without asking (say if any is wrong):
- **Today, Progress, Coach**, in a bottom navigation bar, with the screen's name in the top bar and Settings behind a gear there.
- **The app opens on Today**: logging is the most frequent task.
- **Each tab keeps its place** when the user switches away and back.
- **With no profile the app shows onboarding and nothing else.** When the database cannot be opened it shows the error rather than a blank
  screen.
- **"Today" is the phone's local calendar day.** When the app returns to the foreground it re-reads the date, so a session left open
  overnight shows the new day without a restart.
- **The check-in runs while the shell is on screen** (MM-24).
- **The accent color is a Mars rust (#C1440E)**, with Material 3 generating the rest of the palette.

## Description
The app's root decides between a loading indicator, an error, onboarding and the main shell, according to whether a profile exists.

## Acceptance Criteria
```gherkin
Scenario: First launch
  Given no profile
  Then onboarding is shown

Scenario: Returning user
  Given a profile
  Then the Today tab is shown, with Progress and Coach one tap away

Scenario: Overnight
  Given the app was left open on Monday evening
  When it is brought to the foreground on Tuesday morning
  Then Today shows Tuesday

Scenario: Erased
  Given the user erases all data
  Then onboarding is shown again
```

## Notes (built and partly verified)
- `apps/mobile/lib/src/app.dart` (`_Root`, `_HomeShell`); `todayProvider` and `checkInProvider` in `providers.dart`.
- Seen on an Android emulator, and exercised by the widget tests, which switch tabs.
- **The overnight rollover has no test** (MM-93). One known gap in it: a day the user picked on the Today tab is remembered separately,
  so if they were viewing "yesterday" before midnight they will still be viewing that date, now two days back.
- The first launch of a debug build sat on the Flutter splash screen for about 25 seconds on a freshly booted emulator. Normal for debug;
  check a release build's start time before launch.
- **Superseded by MM-99.** The product owner has since decided the app starts on a dashboard, with Food, Progress and Coach on their own
  icons; "Today" becomes "Food". This ticket remains as the record of what was built first.

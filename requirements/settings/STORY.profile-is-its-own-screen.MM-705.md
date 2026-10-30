---
id: MM-705
status: in-progress
component: settings
related: [MM-259, MM-398, MM-703, MM-704]
---

# Story: Profile is its own screen

## Context
Settings holds, in folds, today's setup, the coach, nutrition goals, the profile (sex, date of birth, height, health
check), reminders, health sync, data, backup, appearance, about and erase. The owner (MM-703, 2026-10-30): "settings
are settings, but profile is profile. It's not all or nothing."

## Decisions
The owner's (MM-703): Profile takes the profile section and nutrition goals; everything else stays Settings; Profile is
a row in the drawer (MM-704) and opens as a pushed screen.

Choices made without asking (say if any is wrong):
- **`ProfileScreen`** is the sibling of `SettingsScreen`: a pushed `Screen` titled "Profile" holding `ProfileSection`
  ("You") and `NutritionGoalsSection`, both folds, **both open on arrival**, since the screen is theirs.
- **Settings keeps its other sections in their order.** `SettingsSectionId` keeps `profile` and `nutritionGoals` for the
  places that open a section by id; opening Settings on one of those two now opens Profile on it instead (one function,
  `openSettingsSection`, decides). Every caller that passed `open: 'nutritionGoals'` or `open: 'profile'` (the coach's
  "change your goal" links, the Dashboard's rows, onboarding's returns; grep for them) is rerouted and tested.
- **Nothing moves inside the two sections**: their rows, sheets and words are untouched.

## Description
Profile, opened from the drawer, shows "You" and "Nutrition goals". Settings no longer shows them.

## Acceptance Criteria
```gherkin
Scenario: Profile from the drawer
  When the person opens the drawer and presses "Profile"
  Then a screen titled "Profile" shows "You" and "Nutrition goals", both open

Scenario: Settings without them
  When Settings is open
  Then it shows Today's setup, Coach, Reminders, Health, Data, Backup, Appearance, About and Erase
  And neither "You" nor "Nutrition goals" is on it

Scenario: A link into the goals
  Given a place that opened Settings on nutrition goals (the coach's change-your-goal link)
  When it is pressed
  Then Profile opens with "Nutrition goals" open
```

## UI/UX
- Profile — apps/mobile/src/gallery/screens/Profile.stories.tsx (Stories: Profile, ProfileSmallPhone at 360 px with
  the longest goal and height words). Settings' existing stories are updated to the shorter screen.

## Notes
- Tests: `test/settings/profileScreen.test.tsx` (the three scenarios, and that every former caller of the two ids lands
  on Profile); the Settings tests that read those sections move.
- Where: `apps/mobile/src/settings/ProfileScreen.tsx`, `openSettingsSection.ts` beside it.

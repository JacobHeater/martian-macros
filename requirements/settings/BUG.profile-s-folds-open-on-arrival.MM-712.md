---
id: MM-712
status: in-progress
component: settings
related: [MM-398, MM-676, MM-703, MM-705]
---

# Bug: Profile's two folds opened on arrival

## Context
MM-705 opened "You" and "Nutrition goals" on arrival, a choice made without asking ("since the screen is theirs"). The
owner, 2026-10-30, on a screenshot of the phone: "i said all collapsibles start collapsed too". The owner's rule in the
Q&A ("collapsible paradigm, collapsed by default") is general, as Settings (MM-398) and Coach (MM-676) already follow it.

## Decisions
The owner's: every collapsible section starts collapsed, on every screen. The one exception stays: a way in that asks
for a section (`open`) finds that section open, because the person asked for it.

Choices made without asking (say if any is wrong):
- **`ProfileScreen` takes `open`**, as `SettingsScreen` does, and `openSettingsSection` passes the section asked for; the
  drawer's Profile row passes none. The stories about one row open its section through `open`.
- **The test helper `openProfile`** opens every section unless told `closed`, as `openSettings` does.

## Description
Profile opens with "You" and "Nutrition goals" closed. Correcting the date of birth from the adults-only screen still
opens Profile with "You" open.

## Acceptance Criteria
```gherkin
Scenario: Closed on arrival
  When Profile is opened from the drawer
  Then "You" and "Nutrition goals" are both closed, and nothing of either is in sight

Scenario: A way in about a row
  When the adults-only screen's "Correct date of birth" is pressed
  Then Profile opens with "You" open
```

## UI/UX
- Profile — apps/mobile/src/gallery/screens/Profile.stories.tsx (Stories: Profile, closed; ProfileYouOpen; ProfileSmallPhone
  opened on the goals through `open`).

## Notes
- Tests: `test/settings/profileScreen.test.tsx`.
- Not run locally; CI validates. Owed on the phone: Profile from the drawer, both folds closed.

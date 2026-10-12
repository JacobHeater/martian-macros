---
id: MM-80
status: in-progress
component: settings
related: [MM-81, MM-82, MM-83, MM-62, MM-49, MM-56, MM-63, MM-9]
---

# Epic: Settings

## Context
Onboarding collects the user's answers once. People change units, start training more, get a body-fat measurement, or realize they
mis-tapped something.

## Narrative
One Settings screen, reached from the gear on every tab. Built: units (MM-81), training background and body-fat estimate (MM-82), and
erasing everything (MM-62). The profile itself (sex, age, height) is shown but cannot be edited, and the health check cannot be changed at
all (MM-83).

Other components add their own sections here as they are built: detail level (MM-49), food packs (MM-56), backup (MM-63), health
connections (MM-68), and the purchase (MM-87).

## Acceptance Criteria (narrative)
The Epic is done when everything a user told the app at onboarding can be corrected afterwards without erasing their data, and a correction
that changes the coach's inputs takes effect the way a user would expect.

## UI/UX Assets

- [Settings](../ui-ux-assets/views/settings.html#settings-default) — Current.
  Draws SettingsScreen as built on 2026-10-11: populated, own body fat, erase
  confirm. Compared with a screenshot test of the built screen. Compared with
  the screenshot test for the top of the page only. It shows what exists and
  approves nothing.

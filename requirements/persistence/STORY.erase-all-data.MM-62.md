---
id: MM-62
status: done
component: persistence
related: [MM-59, MM-60, MM-83]
---

# Story: Erase everything and start over

## Context
An app that holds health data must let the user remove it. It is also, for now, the only way to redo onboarding (MM-83).

## Decisions
Choices I made without asking (say if any is wrong):
- **A confirmation dialog** that says what is deleted (profile, food log, weigh-ins, targets) and that it cannot be undone.
- **Erasing returns the user to onboarding.**

## Description
Settings has "Erase all data and start over". Confirming deletes every row in every table.

## Acceptance Criteria
```gherkin
Scenario: Confirming
  Given a user with logged data
  When they choose to erase and confirm
  Then no setup, weigh-in, food entry or target remains and onboarding is shown

Scenario: Cancelling
  When they choose to erase and cancel
  Then nothing is deleted
```

## Notes (built and partly verified)
- `MmStore.wipe` (data test "wipe clears everything") and `_confirmErase` in `settings_screen.dart`.
- **The settings screen has no widget test** and the dialog was not exercised on a device (MM-93).
- Rows are deleted; the database file is not removed or overwritten, so deleted data may remain in free pages until SQLite reuses them.
  When backup files exist (MM-63), erasing should also say that backups elsewhere are not touched.

## UI/UX Assets

- [Settings](../ui-ux-assets/views/settings.html#settings-default) — Current.
  Draws SettingsScreen as built on 2026-10-11: populated, own body fat, erase
  confirm. Compared with a screenshot test of the built screen. Compared with
  the screenshot test for the top of the page only. It shows what exists and
  approves nothing.
- [Component catalog](../ui-ux-assets/components/index.html#show-mm-confirm) —
  Current. Draws showMmConfirm as built on 2026-10-11: open. Drawn from the
  source alone; not compared with the running app. It shows what exists and
  approves nothing.

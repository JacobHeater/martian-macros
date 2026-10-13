---
id: MM-259
component: settings
status: proposed
related: [MM-253, MM-224, MM-80, MM-184, MM-242]
---

# Story: Settings with icons and sections

## What is built

- **Every row carries a leading icon** (`MmListRow` already supports one):
  appearance, units, activity, training, body fat, profile, health check,
  reminders, food database, health platform, terms, privacy, erase.
- **Sections in the order of use**: Today's setup (activity, training,
  body fat), You (profile, health check), Reminders, Data (food database,
  health platform, backup when it exists), Appearance, About. The
  appearance and units choosers become rows that open a chooser, so the
  screen is one list of rows, not a mix of chips, segments, sliders and
  rows.
- **Destructive actions last**, in their own section with the danger icon.

## Acceptance criteria

```gherkin
Scenario: One list
  Then Settings is sections of rows, each row with a leading icon, and no control is inline except a switch

Scenario: Order
  Then the sections appear in the order above, with erase last

Scenario: Nothing lost
  Then every setting the old screen held is reachable within one tap
```

## UI/UX

`apps/mobile/src/gallery/screens/Settings.stories.tsx` (Settings), before
and after.

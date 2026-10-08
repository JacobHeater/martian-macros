---
id: MM-165
status: done
component: settings
related: [MM-80, MM-101, MM-102, MM-91, MM-160, MM-161]
---

# Story: Choose light, dark or follow my phone

## Context
Both themes are first-class (MM-102), but the app only follows the phone's setting. A user who wants dark at noon, or light at night, cannot have it.

## Decisions
Choices I made without asking (say if any is wrong):
- **Three choices: System (default), Light, Dark**, in a new Appearance group at the top of Settings, applied at once without restarting.
- **Stored on the device** through its own repository (`PreferencesRepository`, interface in the domain package, Drift and in-memory implementations, contract tests), not in the profile: it is a display preference, it exists before onboarding, and it is not health data. It is not part of `UserSetup`.
- **"Erase all data" resets it** to System, like everything else.
- **No flash on start**: the preference is read before the first frame where possible; until it is read the app follows the system setting.

## Description
A `ThemePreference` value, a preferences repository, an Appearance control in Settings, and `MaterialApp.themeMode` driven by it.

## Acceptance Criteria
```gherkin
Scenario: Choosing dark
  Given the phone is in light mode and the preference is System
  When the user chooses Dark in Settings
  Then the whole app is dark at once and stays dark after a restart

Scenario: Following the phone
  Given the preference is System
  When the phone switches to dark
  Then the app does too

Scenario: Erase
  Given the preference is Dark
  When all data is erased
  Then the preference is System

Scenario: Substitutable storage
  Then the Drift and the in-memory preferences repositories pass the same contract tests

Scenario: Existing data survives the upgrade
  Given a version-1 database
  When the app opens
  Then every row is unchanged and the preference is System
```

## Notes
- Shares schema version 2 with MM-164.

## Progress (built and verified)
- `ThemePreference` and `PreferencesRepository` (domain), `DriftPreferencesRepository` and `InMemoryPreferencesRepository`, both run through `preferencesRepositoryContract`; the eraser contract checks that erasing resets it to System.
- Settings has an Appearance control (System, Light, Dark) at the top; `MaterialApp.themeMode` follows the stored choice. Tests: applies at once, is stored, a stored choice applies on open. Checked on the emulator: Dark applies immediately.
- **Not verified**: a cold start with Dark chosen while the phone is in light mode may show one light frame before the stored choice is read; not measured.

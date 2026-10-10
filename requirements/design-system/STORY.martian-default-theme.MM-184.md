---
id: MM-184
status: in-progress
component: design-system
related: [MM-102, MM-181]
---

# Story: Martian by default, with a first-launch theme choice

## Decisions
The owner approved the retro '90s Martian palette in the static preview.
New installations open in Martian and choose Martian, Light, Dark or System
before onboarding. Martian is preselected; Continue accepts it. Selecting a
different option previews it immediately without saving until Continue.
The choice persists and Settings offers the same four themes.

Existing installations never see this chooser and retain all existing theme
settings, including System when no preference row exists. The owner explicitly
chose new installations only. No health data is read or transmitted.

An `unselected` preference represents a fresh install until the user confirms
the chooser. It resolves visually to Martian but is not a selectable theme.
Schema 24 changes the new-row default; upgrades retain old preferences and
insert System for older installations without a preference row.

## Acceptance Criteria
```gherkin
Scenario: First launch
  Given a new installation
  Then Martian is displayed and preselected in a theme chooser before onboarding
  When the user previews another theme
  Then the chooser immediately uses that theme without persisting it yet
  When Continue is pressed
  Then the selected theme is saved and onboarding opens
  And subsequent launches do not show the chooser

Scenario: Existing installation
  Given an installation from schema 23 or earlier
  When it upgrades
  Then its Light, Dark or System preference is unchanged
  And it does not show the first-launch theme chooser
  And an absent preference row retains System behavior

Scenario: Settings
  Then Settings offers Martian, Light, Dark and System
  And a selection is applied immediately and persists

Scenario: Readable retro colors
  Then Martian uses deep grape surfaces, cream text and acid-lime actions
  And cyan, pink and violet macros remain distinguishable in grayscale
  And text, control and macro contrasts meet the existing design thresholds
  And primary actions do not acquire a glow

Scenario: Storage failures
  Given theme preferences fail to load or save
  Then an explicit failure is shown without claiming the choice was saved
```

---
id: MM-68
status: proposed
component: health-sync
related: [MM-66, MM-67, MM-16, MM-19, MM-20, MM-34, MM-71, MM-72, MM-73, MM-188, MM-189]
---

# Story: Import weigh-ins and more from Health Connect

## Context
See MM-66.

## Decisions
Choices I made without asking (say if any is wrong):
- **Connecting is offered, never required**: at the end of onboarding and in Settings.
- **Permissions are requested per data type**, with a sentence for each saying what it is used for. Refusing one does not block the others.
- **Each imported weigh-in shows where it came from**, and the user can type a value for a day to overrule it.
- **Menstruation data is requested only for female profiles.**
- **Height from the platform is offered as a suggestion** if it differs from the profile; it never overwrites silently.

## Description
On Android, the user connects Health Connect and grants read access to any of: weight, body fat, lean mass, height, exercise sessions,
menstruation periods, steps. Granted types are imported and kept up to date (MM-72). Weight feeds the trend; menstruation feeds the trend's
noise (MM-19); body fat and lean mass are stored for the body-fat estimate (MM-34); sessions are stored for the training log (MM-75).

## Acceptance Criteria
```gherkin
Scenario: A scale's readings arrive
  Given a scale app writing weight to Health Connect and permission granted
  When the user steps on the scale and later opens the app
  Then today's weigh-in is that reading and the trend includes it

Scenario: Partial permission
  Given weight is granted and body fat refused
  Then weight is imported and nothing about body fat is requested again until the user asks

Scenario: Overruling an import
  Given an imported weigh-in for today
  When the user types a different value
  Then the typed value is used and the import is kept but not used

Scenario: Permission withdrawn
  Given permission is later removed in system settings
  Then the app notices, stops importing, keeps what it has, and says how to reconnect

Scenario: Health Connect is absent
  Given a device without Health Connect
  Then the app says so and offers nothing that needs it
```

## Notes
- Health Connect has no biological-sex record, so nothing here touches MM-14.
- Google Play requires a declaration of each health permission and why it is needed (MM-95).

---
id: MM-69
status: proposed
component: health-sync
related: [MM-66, MM-67, MM-14, MM-68, MM-71, MM-72]
---

# Story: Import from Apple Health

## Context
See MM-66 and MM-68. The same behavior on iOS, behind the same interface.

## Decisions (made with the product owner)
- **HealthKit's biological sex may pre-fill the onboarding question, and nothing more.** Its values are female, male, other and not set.
  Only female and male are used; with other or not set the question is simply not pre-filled. The user always confirms (MM-14).

Choices I made without asking (say if any is wrong):
- **Everything in MM-68 applies**, with HealthKit's types: body mass, body fat percentage, lean body mass, height, workouts, menstrual
  flow, step count.
- **HealthKit never tells an app that read permission was refused** (a refusal looks like "no data"). The app says "No weight data found
  in Health" and how to check permissions, rather than claiming a refusal.
- **Date of birth and height may also be pre-filled** from HealthKit at onboarding, each shown for confirmation.

## Description
On iOS, the user connects Apple Health; the flow, storage and behavior match MM-68.

## Acceptance Criteria
```gherkin
Scenario: Pre-filling sex
  Given Apple Health reports biological sex as female
  Then the onboarding question has Female selected and the user must still continue past it

Scenario: Not pre-filling
  Given Apple Health reports other or not set
  Then the question has nothing selected and cannot be skipped

Scenario: The same behavior as Android
  Then the shared health-source test suite passes against HealthKit on a device

Scenario: No data, or no permission
  Given no weight samples are returned
  Then the app says none were found and how to check Health permissions
```

## Notes
- Needs the Mac, a paid developer account for the HealthKit entitlement, and a real device (the simulator's Health data is limited).
- App Review requires the purpose strings to say clearly why each type is read and written.

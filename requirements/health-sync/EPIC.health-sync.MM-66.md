---
id: MM-66
status: proposed
component: health-sync
related: [MM-67, MM-68, MM-69, MM-70, MM-71, MM-72, MM-73, MM-15, MM-14, MM-75, MM-188, MM-189]
---

# Epic: Health platform sync

## Context
Many users already own a smart scale that writes to Apple Health or Android's Health Connect. If the app reads those weigh-ins, the most
important daily task (MM-16) happens by itself.

Decisions made with the product owner:
- **Read**: weight, body fat, lean mass, height, workouts (as sessions, for timing and duration), menstruation, and steps (for context
  only).
- **Write**: nutrition, so the app is a good citizen of the user's health data. Workouts too, aligned with what each platform can
  name and falling back to a plain session where it cannot (MM-189; the owner's direction).
- **Do not use wearable "active calories" in the expenditure estimate.** Their error is roughly 27% to over 90%, and the estimate does not
  need them.
- **Development starts on Windows with Android**; HealthKit waits until work moves to the Mac.

## Narrative
The app talks to an interface, not to a platform, with a fake implementation that replays recorded histories so everything above it can be
built and tested on Windows (MM-67). Health Connect comes first (MM-68), then HealthKit (MM-69), then writing nutrition back (MM-70).

Several devices and apps can write the same kind of data, so the app needs a rule for which reading counts (MM-71). It should pick up new
readings without draining the battery (MM-72), and on first connection read back as far as the platform allows, because a user with six
months of scale history can have a settled trend on day one (MM-73).

## Acceptance Criteria (narrative)
The Epic is done when a user with a connected scale never types a weigh-in, sees the same trend they would have had by typing, can see
where each reading came from and overrule it, and finds what they logged in the app in their phone's health app.

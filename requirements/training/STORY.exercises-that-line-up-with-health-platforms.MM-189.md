---
id: MM-189
status: proposed
component: training
related: [MM-66, MM-68, MM-69, MM-70, MM-74, MM-75, MM-76, MM-77, MM-188, MM-191]
---

# Story: Workouts that line up with the health platforms, with a fallback

## Context
The user's phone already holds a health record (Health Connect on Android, Apple Health on iOS), and other apps and watches write
workouts into it. The product owner's direction: **training should sync with those systems, so workouts align mostly with what the
platforms offer, with a fallback for the exercises they do not.**

The platforms are uneven. Health Connect can name 42 strength movements inside a workout. HealthKit names the kind of workout and not
the exercises in it. MM-188 has the checked lists, the mapping, and what is still open.

## Decisions (made with the product owner)
- **Align with the platforms where they have something**, and fall back where they do not.

Choices I made without asking (say if any is wrong):
- **Every library exercise (MM-76) has an optional mapping**: the platform's own exercise type where one exists for it. Where a platform
  names the movement, the library uses that movement as its anchor, and variants map to it (an incline press maps to the same type as a
  bench press). Where none exists, the exercise has no mapping, and that is a normal state, not an error.
- **The app is the system of record.** Exercise names, sets, reps, load and RIR live in the app, whatever a platform can hold. A platform
  gets a summary of the workout, never the only copy.
- **The fallback is a session without the exercise.** A workout is always written to a platform as a session of the platform's strength
  type, with its start, end and duration. Exercises the platform can name are written as segments inside it; ones it cannot are left
  out of the segments but stay in the app. Nothing is invented: an unmapped exercise is never written as the nearest-sounding one.
- **iOS is session-level only**, because HealthKit does not name exercises: a workout is imported and written as a session, and the
  sets stay in the app. The same code path as the fallback, not a separate feature.
- **Importing**: a session from a platform becomes a workout with its duration (MM-75). Where the platform gives segments, each becomes
  an exercise by the mapping, with the platform's repetitions or weight if it gave them; a segment the library cannot place becomes
  "Other exercise" with its time and can be renamed or re-chosen. The user can add sets to any imported workout.
- **A custom exercise has no mapping**, unless the user chooses what it counts as from the exercises that have one. It never maps by
  default.
- **One workout, one record**: a workout the app wrote is not imported back as a second one (MM-71's rule of a stable platform id).
- **Writing workouts to a platform is a permission the user grants separately** from reading, and off until they do. Refusing it changes
  nothing in the app.
- **Nothing here changes the expenditure estimate.** Platform workouts and their calories stay out of it (MM-66).

What the spike (MM-188) settled:
- **Sessions ship first, on both platforms**, through the `health` plugin, which reads and writes sessions and nothing finer.
- **Segments on Android are a later, separate piece** in the app's own Android code, because the plugin does not expose them. A
  segment is one set with its repetitions. Weight, set index and perceived exertion exist only in an alpha of the client library and
  wait for a stable one. RIR is never written: the platform has no field for it.
- **A segment needs a start and an end time.** The owner's decision: a set's times can be entered by hand, and the app has set and
  rest timers (MM-191). A set with both times can be written as a segment; one without is left out, and no time is invented.
- **The mappings marked as judgement in MM-188 stand for now** (the owner's decision).
- **The mapping table in MM-188 is the library's data** from its first version, so nothing has to be re-keyed when segments arrive.

## Description
A mapping from each library exercise to a platform exercise type or none, and the import and export rules above. The mapping is data
that ships with the library; its source is MM-188.

## Acceptance Criteria
```gherkin
Scenario: A movement the platform names
  Given a barbell bench press, which Health Connect names
  Then the library entry carries the platform's type for it
  And a workout containing it is written with that segment inside a strength session

Scenario: A movement it does not
  Given an exercise with no platform type
  Then it is stored in the app and the workout is still written as a session
  And the exercise is not written as any other

Scenario: iOS
  Given Apple Health
  Then a workout is written and read as a session, and its sets stay in the app

Scenario: Importing a workout with segments
  Given a Health Connect session with a bench press segment of 8 repetitions
  Then the app shows a workout with a bench press exercise and a set of 8, which the user can edit

Scenario: An unknown segment
  Given a segment the library has no mapping for
  Then it appears as "Other exercise" with its time, and nothing is lost

Scenario: Not written twice
  Given a workout the app wrote to the platform
  When the platform is read again
  Then no second workout appears

Scenario: Writing is separate permission
  Given the user granted reading workouts but not writing them
  Then nothing is written
```

## Notes
- MM-188 (done) has the platform lists and the mapping. Depends on MM-67 for the health source seam, so the whole thing is built and
  tested against a fake on Windows.
- The training log's own list and muscle taxonomy (MM-76) are the app's; the mapping adds to them and never constrains them.
- Not planned: reading a watch's heart-rate or calories for a workout.

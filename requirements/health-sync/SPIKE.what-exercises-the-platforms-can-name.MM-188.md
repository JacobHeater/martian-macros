---
id: MM-188
status: proposed
component: health-sync
related: [MM-66, MM-67, MM-68, MM-69, MM-75, MM-76, MM-189]
---

# Spike: Which exercises Health Connect and HealthKit can name, and what a workout can carry

## Context
The product owner wants the app's workouts to line up with what the phone's health systems offer, with a fallback for the exercises they
do not (MM-189). That needs an exact list, not memory. What was found so far, from the platforms' own documentation, and what is still
open:

- **Health Connect** has an exercise session (a workout with a type such as strength training or weightlifting) and, inside it, exercise
  segments. A segment has its own type, and the list includes strength movements: bench press, barbell shoulder press, deadlift,
  dumbbell row, lateral raise, shoulder press, pull-up, lunge, leg raise, leg press and plank, among others. The list found was
  truncated. Segments are documented with a repetition count; the platform-level class also lists weight, set index and rate of
  perceived exertion. Which of these the AndroidX client library the app will use exposes is **not confirmed**.
- **HealthKit** has a workout with one activity type, and strength training has two: traditional strength training and functional
  strength training. It has laps, segments and markers inside a workout, but no list of named exercises, and no sets or reps. Exercise
  names, reps and load could only go in free metadata, which no other app would understand. That is from the documentation found and
  from general knowledge of the framework, and is **not confirmed**.

## Questions
1. The complete list of Health Connect segment types, and which are strength movements.
2. What a segment can carry in the library version the app will pin: repetitions, weight, set index, perceived exertion.
3. Whether other apps that write strength workouts to Health Connect actually fill segments, or only sessions. A rich schema nobody
   writes is little use for import.
4. The HealthKit workout activity types a strength or conditioning session can have, and whether any metadata keys are conventional.
5. Whether a workout the app writes shows up usefully in each platform's own app, with and without segments.

## Output
- A table in this ticket: for each exercise type the platforms name, its identifier on each platform and the library exercises that map
  to it. It becomes the data MM-76 ships.
- A decision for each of questions 2 and 5, so MM-189 can settle what is written back.
- The pinned plugin or client library, and whether it exposes segments at all. If it does not, segment import and export wait and
  everything falls back to sessions, which MM-189 allows for.

## Acceptance Criteria
```gherkin
Scenario: The table is checked against the source
  Then every identifier in the table is checked against the platform's own reference for the pinned library version, and says so

Scenario: What is not available is said
  Then each exercise the platforms cannot name is listed as using the fallback
```

## Notes
- No code. Nothing here is built from memory: a mapping with a wrong identifier would write the wrong exercise into someone's health
  record.

---
id: MM-188
status: done
component: health-sync
related: [MM-66, MM-67, MM-68, MM-69, MM-75, MM-76, MM-189]
---

# Spike: Which exercises Health Connect and HealthKit can name, and what a workout can carry

## Context
The product owner wants the app's workouts to line up with what the phone's health systems offer, with a fallback for the exercises they
do not (MM-189). That needs an exact list, not memory. This ticket is the result.

## Questions
1. The complete list of Health Connect segment types, and which are strength movements.
2. What a segment can carry in the library version the app will pin: repetitions, weight, set index, perceived exertion.
3. Whether other apps that write strength workouts to Health Connect actually fill segments, or only sessions.
4. The HealthKit workout activity types a strength or conditioning session can have, and whether any metadata keys are conventional.
5. Whether a workout the app writes shows up usefully in each platform's own app, with and without segments.

## Sources (read on 2026-10-10)
Every identifier below was read from these, not from memory.
- **Health Connect**: the AndroidX client library's own source, `ExerciseSegment.kt` and `ExerciseSessionRecord.kt`, in three versions:
  the published sources of `androidx.health.connect:connect-client` **1.1.0** (latest stable, 2025-10-08) and **1.2.0-alpha02**, and the
  development branch (1.2.0-alpha06). Release dates and notes from the library's release page.
- **HealthKit**: Apple's reference data for `HKWorkoutActivityType` (87 cases).
- **Flutter plugin**: the published package `health` **13.3.2** (2026-08-14), its Kotlin, Swift and Dart source.

## Findings

### 1. Health Connect segment types
There are **68** segment types, numbered 0 to 67, **identical in 1.1.0 and the development branch**. The library itself defines which
are strength movements: a set of **42** that a strength session accepts.

A segment must be compatible with its session's type or the record is refused. Sessions of type `STRENGTH_TRAINING` (70),
`WEIGHTLIFTING` (81), `CALISTHENICS` (13) and `GYMNASTICS` (34) accept the 42 below. `BOOT_CAMP`, `HIGH_INTENSITY_INTERVAL_TRAINING` and
`OTHER_WORKOUT` sessions accept any segment. `OTHER_WORKOUT` (38), `PAUSE` (39), `REST` (44), `STRETCHING` (54) and `UNKNOWN` (0)
segments are accepted in any session.

### 2. What a segment carries

| Field | 1.1.0 (stable) | 1.2.0-alpha02 | 1.2.0-alpha03 and later |
|---|---|---|---|
| Start and end time (required, start before end) | yes | yes | yes |
| Segment type | yes | yes | yes |
| Repetitions | yes | yes | yes |
| Weight | no | no | yes |
| Set index | no | no | yes |
| Rate of perceived exertion (0 to 10) | no | no | yes |

Weight, set index and perceived exertion were added in 1.2.0-alpha03 (2026-03-25) and are alpha only. In the development branch they are
validated by the platform itself on Android 14 with SDK extension 21 or later; what an older phone does with them was **not checked**.

There is no field for reps in reserve, and none for an exercise's name. A set is one segment.

### 3. Whether other apps fill segments
**Not answered.** It cannot be read from documentation; it needs a phone with real apps and a watch writing to Health Connect. One fact
bears on it: the most-used Flutter plugin does not write segments at all (below), so apps built on it write sessions only.

### 4. HealthKit
`HKWorkoutActivityType` has 87 cases and **none names an exercise**. The ones a strength or conditioning session can be:

| Case | Apple's description |
|---|---|
| `traditionalStrengthTraining` | strength training exercises primarily using machines or free weights |
| `functionalStrengthTraining` | strength training, primarily with free weights and body weight |
| `coreTraining` | core training |
| `highIntensityIntervalTraining` | high intensity interval training |
| `crossTraining` | any mixture of cardio, strength, and/or flexibility training |
| `flexibility` | a flexibility workout |
| `other` | does not match any of the other workout activity types |

No conventional metadata key for exercise names, sets or reps was found in the reference. iOS stays session-level, as MM-189 assumed.

### 5. How a written workout shows in each platform's own app
**Not answered.** It needs a device. Nothing has been written to a platform yet.

### The Flutter plugin
`health` 13.3.2 builds against connect-client 1.2.0-alpha02. It reads and writes workouts as **sessions only**: a type, start, end,
optional energy and distance, and a title. It has no way to read or write segments; its only mention of them is copying a session's
existing segments when it attaches a route. On iOS it reads and writes `HKWorkout` with an activity type.

## Decisions
- **Sessions first, on both platforms, through the `health` plugin.** That is everything iOS can do and everything the plugin can do on
  Android. It is MM-189's fallback, and it ships without waiting for anything.
- **Segments on Android need the app's own code**: a small Android-side reader and writer on the AndroidX client, behind the health
  source seam (MM-67), because the plugin does not expose them. It is a separate ticket from session sync, to be raised when session
  sync is done, and it is worth building only if question 3 comes back yes for import, or the owner wants export regardless.
- **When segments are written: one segment per set, with its repetitions, and nothing else**, on library 1.1.0. Weight, set index and
  perceived exertion wait for a stable 1.2.0. RIR is never written; the platform has no field for it, and RPE is not the same thing.
- **A segment needs a start and an end**, and the workout log (MM-75) does not time each set. So writing segments also needs either set
  timestamps or an honest rule for spreading sets across the session. Open, and a reason on its own to ship sessions first.
- **Session type**: the app writes `STRENGTH_TRAINING` on Android and `traditionalStrengthTraining` on iOS. It imports as a strength
  workout: `STRENGTH_TRAINING`, `WEIGHTLIFTING` and `CALISTHENICS` on Android; `traditionalStrengthTraining`,
  `functionalStrengthTraining` and `coreTraining` on iOS. Other types import as a workout with a duration and no exercises.
- **The mapping below ships with the library (MM-76) as data**, whether or not segments are built yet, so the library is aligned from
  the first version.

## The mapping
Health Connect segment types a strength session accepts, with the identifier checked against connect-client 1.1.0, and the library
movements that map to each. A variant maps to its movement's type (MM-189). Where the fit is a judgement and not a plain match, it says
so, and the owner can strike it.

| Segment type | Id | Library movements that map to it |
|---|---|---|
| `ARM_CURL` | 1 | Barbell curl, EZ-bar curl, cable curl, machine curl, preacher curl, hammer curl, two-arm dumbbell curl |
| `BACK_EXTENSION` | 2 | Back extension (hyperextension) |
| `BALL_SLAM` | 3 | Medicine-ball slam |
| `BARBELL_SHOULDER_PRESS` | 4 | Barbell overhead press, push press (judgement) |
| `BENCH_PRESS` | 5 | Barbell and dumbbell bench press; incline, decline and close-grip bench press; machine chest press (judgement) |
| `BENCH_SIT_UP` | 6 | Decline sit-up |
| `BURPEE` | 9 | Burpee |
| `CRUNCH` | 10 | Crunch, cable crunch, machine crunch |
| `DEADLIFT` | 11 | Conventional, sumo and trap-bar deadlift; Romanian and stiff-leg deadlift (judgement) |
| `DOUBLE_ARM_TRICEPS_EXTENSION` | 12 | Not used: the same movement as id 20, which the library uses |
| `DUMBBELL_CURL_LEFT_ARM` | 13 | Not used on export: the log does not record a side. Imports as dumbbell curl |
| `DUMBBELL_CURL_RIGHT_ARM` | 14 | As id 13 |
| `DUMBBELL_FRONT_RAISE` | 15 | Dumbbell front raise |
| `DUMBBELL_LATERAL_RAISE` | 16 | Dumbbell lateral raise |
| `DUMBBELL_ROW` | 17 | Dumbbell row |
| `DUMBBELL_TRICEPS_EXTENSION_LEFT_ARM` | 18 | Not used on export. Imports as dumbbell triceps extension |
| `DUMBBELL_TRICEPS_EXTENSION_RIGHT_ARM` | 19 | As id 18 |
| `DUMBBELL_TRICEPS_EXTENSION_TWO_ARM` | 20 | Dumbbell overhead triceps extension |
| `FORWARD_TWIST` | 22 | None |
| `FRONT_RAISE` | 23 | Cable and plate front raise |
| `HIP_THRUST` | 25 | Barbell and machine hip thrust |
| `HULA_HOOP` | 26 | None |
| `JUMPING_JACK` | 27 | Jumping jack |
| `JUMP_ROPE` | 28 | Jump rope |
| `KETTLEBELL_SWING` | 29 | Kettlebell swing |
| `LATERAL_RAISE` | 30 | Cable and machine lateral raise |
| `LAT_PULL_DOWN` | 31 | Lat pulldown, all grips |
| `LEG_CURL` | 32 | Lying, seated and standing leg curl |
| `LEG_EXTENSION` | 33 | Leg extension |
| `LEG_PRESS` | 34 | Leg press; hack squat machine is **not** mapped here |
| `LEG_RAISE` | 35 | Lying, hanging and captain's-chair leg raise |
| `LUNGE` | 36 | Forward, reverse and walking lunge |
| `MOUNTAIN_CLIMBER` | 37 | Mountain climber |
| `PLANK` | 41 | Plank, side plank (judgement) |
| `PULL_UP` | 42 | Pull-up, chin-up, neutral-grip and weighted pull-up; assisted pull-up (judgement) |
| `PUNCH` | 43 | None |
| `SHOULDER_PRESS` | 48 | Dumbbell, machine and Arnold shoulder press |
| `SINGLE_ARM_TRICEPS_EXTENSION` | 49 | Single-arm cable or dumbbell triceps extension |
| `SIT_UP` | 50 | Sit-up |
| `SQUAT` | 51 | Back, front, goblet, box and bodyweight squat; Smith-machine squat (judgement) |
| `UPPER_TWIST` | 63 | None |
| `WEIGHTLIFTING` | 65 | Clean, snatch, clean and jerk, and their variants |

**Common exercises the platform cannot name, which use the fallback** (kept in the app, left out of the platform's segments, never
written as something else): push-up, dip, barbell row, seated and cable row, T-bar row, chest fly and pec deck, cable crossover,
face pull, reverse fly, shrug, pullover, triceps pushdown, skull crusher, calf raise, glute bridge, good morning, hip abduction and
adduction, split squat and Bulgarian split squat, step-up, hack squat, farmer's carry, ab wheel, Russian twist, Pallof press, wrist
curl. HealthKit names none at all, so on iOS every exercise uses the fallback.

## Acceptance Criteria
```gherkin
Scenario: The table is checked against the source
  Then every identifier in the table is checked against the platform's own reference for the pinned library version, and says so

Scenario: What is not available is said
  Then each exercise the platforms cannot name is listed as using the fallback
```

## Notes
- No code.
- Still open, and needing a phone: questions 3 and 5. Neither blocks the exercise library (MM-76) or session sync.
- The "judgement" rows are mine. Strike any that should use the fallback instead; the cost of a wrong one is a workout that reads
  slightly off in another app, and the cost of striking one is that exercise missing from the platform's record.
- The library version to pin when segment code is written: connect-client 1.1.0, unless 1.2.0 is stable by then. Re-check the three
  new fields against whatever is pinned.

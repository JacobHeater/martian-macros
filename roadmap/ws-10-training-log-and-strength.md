# WS-10: Training log and strength

**Order** 10 · **Group** C · **State** not started · **Risk** medium

## Summary
Log workouts set by set and derive a strength trend: the third headline
progress measure, and the signal recomp coaching needs.

## Why this is a workstream
Recomposition is caused by training; diet only permits it. The product owner
decided early that the app tracks training, and strength (as estimated
one-rep max) is one of three headline measures with trend weight and waist.
None of it exists.

It maps almost one-to-one onto its requirements folder, which is unusual in
this roadmap and is the right shape here: the training log is a new screen
family, new tables, new domain types and new engine files, with two narrow
points of contact with everything else (a navigation destination, and the
strength trend that other workstreams read).

## Capability it unlocks
"Am I getting stronger?" answered per lift over weeks. With it: the full
recomp signal, the recomp review's strength column, the strength trigger for
easing a deficit, and the rule that a surplus needs training.

## Included
- An exercise library shipped as data, plus custom exercises.
- Logging a workout: exercises, sets of reps, load and reps in reserve.
- Estimated one-rep max per session and a smoothed trend per lift.
- Weekly hard sets per muscle group.
- Double-progression suggestions.

## Excluded or deferred
- Programs, periodization, deloads, rest timers, social features: recorded
  non-goals or explicitly out of the first version.
- Importing workout sessions from a health platform: WS-11 step 3.
- Using strength in coaching rules: WS-09 steps 5 and 6, WS-06 step 8.
- Estimating training energy for the energy-availability floor: the engine
  takes it as an input that is zero today. Supplying a real value is a
  follow-up for WS-02's owner once workouts exist; no ticket specifies the
  estimate yet.

## Prerequisites
- **WS-01 (MM-61)** from step 2: workouts, exercises and sets are new tables.
- **WS-03 (MM-104, MM-108, MM-99)** from step 2: Train is a destination in
  the navigation built there, and set entry uses library components.

Step 1 needs neither.

## Enables
WS-09 step 6, and the strength halves of WS-09 step 5 and WS-06 step 8. The
training-lapse rules owned by WS-05.

## Packages and surfaces
- `apps/mobile/lib/src/train/` (new)
- `packages/domain` (workout, exercise, set; new files)
- `packages/engine` (e1RM, strength trend, volume, progression; new files)
- `packages/data` (new tables)
- exercise library data (new asset)
- the Progress screen, for strength cards, through components WS-07 exposes

## Risks
- **Logging speed decides whether it is used.** The epic's bar is logging a
  session in less time than the rest between sets allows: one tap to repeat
  a set, large controls, last session alongside. Build to that, and test it
  on a phone, not an emulator with a keyboard.
- **The exercise library's source.** About 150 exercises with muscle groups.
  Written by hand, or taken from an openly licensed list whose license must
  be checked as carefully as the food data's.
- **e1RM is a comparison tool, not a prediction.** The formula is poor above
  about twelve reps and the ticket excludes those sets. Say what the number
  is wherever it is shown.
- **An interrupted workout must survive.** The app can be closed mid-session.
  Persist sets as they are logged, not on "finish".

## Sequence
1. **Exercise library (MM-76).** M3. Data and a search function; no schema.
2. **Log a workout (MM-75).** M3. Tables, the Train destination, set entry.
   Agree the workout table with WS-11 before either builds on it.
3. **Strength trend (MM-77).** M3. The gate.
4. **Weekly volume per muscle group (MM-78).** M4.
5. **Progression suggestions (MM-79).** M4. Wording changes with the goal: on
   a cut, matching last time is the aim.

## Done enough to unblock others
MM-77 is done: one engine function returns a smoothed e1RM trend per lift
with its change over four and twelve weeks.

## Do not start before this
WS-09 step 6 in its full form.

## Parallel with
Everything in group C, and, if capacity allows, group B: its real
prerequisites are only WS-01's and WS-03's gates. It is the safest large
workstream to hand to a separate contributor, because nearly every file it
creates is new.

## Requirement sources
- Remaining: MM-76, MM-75, MM-191, MM-77, MM-78, MM-79, MM-189. Epic: MM-74.

## Notes for whoever builds it
- **The owner's direction (MM-189): workouts line up with what the phone's health systems offer, with a fallback where they do
  not.** Each library exercise carries an optional mapping to the platform's own exercise type, and no mapping is a normal state.
  The app is the system of record; a platform gets a summary session, and exercises it cannot name stay in the app. Health
  Connect can name some exercises inside a workout; HealthKit names only the kind of workout, so iOS is session-level. The
  mappings come from the spike MM-188 (WS-11 step 8) and are never written from memory. The library
  (`builtInExercises` in `mm_domain`) carries them; a test holds its Health Connect identifiers to MM-188's table.
- **MM-76 is part built**: the model, the 164-exercise library and the search exist as pure code. The picker screen and the table
  for a user's own exercises come with MM-75, so the training tables are one schema change.
- Load is entered in the user's weight unit and stored in kilograms, like
  every other quantity. Bodyweight exercises record added load, which may be
  zero or negative.
- A set with no reps in reserve recorded is treated as taken to failure,
  which understates strength instead of flattering it.
- Personal records are the one outcome the reward rules allow celebrating,
  because they are earned by training. The detection belongs here; the
  celebration belongs to WS-09 step 7.
- The free tier includes the training log. Logging, the library and the
  strength trend are not gated; whether suggestions are is a question for
  the free-tier ticket in WS-13.
- A workout imported from a health platform appears as a workout with
  duration only, to which the user can add sets. Only strength sessions
  count as training for the rule that a surplus needs training.

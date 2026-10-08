# WS-05: Setup, screening and profile lifecycle

**Order** 5 · **Group** B · **State** partly built · **Risk** high

## Summary
Make what the user told the app at onboarding correctable, repeatable and
wider, so the coaching policy is right on day 120 as well as on day 0.

## Why this is a workstream
Onboarding is built and verified: profile, health screening, goal
recommendation, the adults-only rule, biological sex enforced at four layers,
units, and editing of training days and body fat. It is a one-way door:

- **A screening answer cannot be changed** short of erasing all data. A user
  who becomes pregnant in month four stays on a deficit.
- **A mis-tapped sex or birth date cannot be corrected.**
- **The health check misses conditions** where a deficit or a high protein
  target interacts with treatment.
- **Goals that depend on training do not say so.**
- **Nothing prepares the user** for what the first month's scale will do.

These tickets come from four requirements folders (onboarding, settings,
safeguards, adaptive coach). They share one piece of domain code
(`ScreeningAnswers`, `UserSetup`, `CoachingPolicy`), one table (Setups) and
two screens (onboarding, Settings), which is why they are one workstream.

## Capability it unlocks
A coaching policy that later workstreams can rely on: pace limits by
condition and age, flags for which notices and rewards are suppressed, and a
"last confirmed" date.

## Included
- Correcting any profile field or screening answer after onboarding, with
  history recomputed.
- New screening answers and their effects; the check asked again every 90
  days and when entering a deficit.
- Notes and an acknowledgement on goals that need resistance training.
- A what-to-expect screen at the end of onboarding.
- Support for users on weight-loss medication.

## Excluded or deferred
- The underweight guard: WS-02 step 5. It is a rule from height and weight in
  the same function, and it must land first.
- The training-lapse rules of the "goal needs training" ticket (suspend a
  surplus after 21 days without a workout): they need the training log. Build
  them when WS-10 step 2 exists.
- The fat-loss pace control itself: WS-06 step 5. This workstream supplies
  the limits it obeys.
- Pre-filling sex from HealthKit: WS-11 step 7.

## Prerequisites
- **WS-01 (MM-61)** for steps 2 and 5: new answers are new columns.
- **WS-03 (MM-104, MM-108)** for steps 3 to 5. Steps 1 and 2 belong to M1 and
  may be built before the design system; they are then migrated with the
  other screens.
- **WS-02 step 5 (MM-111)** lands before step 2 here (same function).

## Enables
WS-06 step 5 (pace limits), WS-09 steps 2 and 3 (the gap flow re-runs the
check; notices read the flags), WS-13 (the professional review covers the
screening rules).

## Packages and surfaces
- `packages/domain/lib/src/screening.dart`, `user_setup.dart`, `profile.dart`
- `packages/data` (Setups columns; one migration for step 2)
- `apps/mobile/lib/src/onboarding/`, `settings/`
- the app shell, for the re-check screen
- `packages/engine/lib/src/mode_advisor.dart` (goal-sheet notes read the
  recommendation)

## Risks
- **Safety-critical and unreviewed.** Every effect in the new screening table
  is product judgment awaiting professional review. Build the mechanism;
  expect the values to change.
- **Recompute on correction.** Changing sex, birth date or height changes
  resting energy, body-fat estimate, floors and limits. The engine is a pure
  function of stored history, so recomputation is a re-run, but stored
  targets history was issued under the old profile. Decide (the correction
  ticket leaves it open) whether past targets are kept as issued. Keeping
  them is simpler and honest.
- **Friction.** A health check every 90 days costs goodwill. The ticket fixes
  it at one screen and one tap when nothing changed; hold that line.
- **Female-only questions.** The existing rule (shown only to female
  profiles, refused by the domain layer on a male profile, cleared if sex is
  corrected to male) must extend to every new female-only answer and to the
  correction flow.

## Sequence
1. **Correct profile and screening answers (MM-83).** M1. No schema change.
   Without it, step 2's "editable in Settings at any time" has nowhere to
   live.
2. **Wider and repeated health check (MM-112).** M1. One migration: the new
   answer columns and the last-confirmed date. Rebase onto the underweight
   guard.
3. **Goals that need training (MM-134), the goal-sheet half.** M2.
4. **What to expect (MM-158).** M2. It quotes the chosen pace as a range; if
   the pace control (WS-06 step 5) is not built yet, it uses the fixed
   default pace.
5. **Weight-loss medication (MM-113).** M4. One more answer plus wording and
   threshold changes on screens owned by WS-06 and WS-09; build it after
   those exist.

## Done enough to unblock others
MM-112 is done: `CoachingPolicy` carries pace limits, protein floors by age,
suppression flags and the confirmation date, and those fields are not expected
to change shape.

## Do not start before this
- WS-06 step 5 (pace) before step 2 here.
- WS-09 step 2 (the gap flow) before step 2 here.

## Parallel with
WS-07 and WS-08 freely (different screens, different domain types). WS-06
with care: both add fields to `UserSetup` and cards to the Coach screen; take
turns in the schema lane and keep to separate cards.

## Requirement sources
- Built: MM-10, MM-11, MM-12, MM-13, MM-14 (profile, screening,
  recommendation, adults only, biological sex); MM-81, MM-82 (units, training
  and body fat in Settings); MM-164 (daily activity in the starting estimate); MM-83 (correct profile and
  health check).
- Remaining: MM-112, MM-134, MM-158, MM-113. Epics: MM-9, MM-80.

## Notes for whoever builds it
- Biological sex is a strict male/female enum with no default, enforced by
  type, parser, schema constraint and screen. That is a fixed product
  constraint. The correction flow changes the stored value between the two;
  it adds no third state and no "unset".
- Age-based rules (65 and over) use the date of birth and today's date, so a
  user can cross the line while using the app. The engine takes "today" as a
  parameter; the change must be announced through the target explanation
  (WS-06 step 3) once that exists.
- A changed screening answer acts immediately and is not step-limited, like
  a change of goal. After WS-02 step 3 that is the engine's general rule for
  safety changes.
- The existing Settings sliders write to the database on every movement and
  the body-fat switch starts at a fixed 25%. Both are recorded rough edges in
  the built ticket; fix them in step 1 while the screen is open.
- The what-to-expect screen comes closest of anything in the app to
  describing outcomes. Its wording goes through the health-claims review in
  WS-13.

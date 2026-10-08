---
id: MM-134
status: proposed
component: adaptive-coach
related: [MM-10, MM-12, MM-22, MM-25, MM-74, MM-75, MM-78, MM-82, MM-113, MM-121, MM-129, MM-133, MM-138]
---

# Story: A goal that needs training says so, and notices when training stops

## Context
Recomp and lean gain work by resistance training. Diet only permits what training causes (MM-74). Yet nothing connects the two today: a
user who answers "not lifting yet" and zero training days can choose lean gain and be given a surplus, which will be stored as fat. The
goal recommendation steers them to recomp (MM-12), but recomp without training is simply a small deficit with a hopeful name.

Evidence:
- **Strong**: resistance training is the main driver of muscle gain and of lean-mass retention during weight loss; protein without
  training does little for lean mass (Nunes 2022).
- **Moderate**: weekly volume shows a dose-response with hypertrophy, with diminishing returns; low volumes still produce gains
  (Schoenfeld 2017; Pelland 2024 meta-regressions). During a deficit, volume above a modest level has not been shown to protect more lean
  mass (Roth 2022 systematic review suggested it; a controlled trial by the same group did not confirm it).

## Decisions
Choices I made without asking (say if any is wrong):
- **At goal selection**: when training days per week is 0 or experience is "not lifting yet", Lean gain and Recomp each carry a plain
  note: "This goal works through resistance training. Without it, a surplus is stored as fat." Choosing Lean gain then requires one
  acknowledgement. Recomp does not, since a small deficit harms nobody.
- **The app says what "training" means here, once**: working each major muscle group with hard sets at least twice a week is a sound
  minimum for most people. Stated as a typical minimum, not a program (MM-78, MM-144).
- **While on lean gain, with the training log in use**: no logged workout for 14 days produces a notice. At 21 days the surplus is
  suspended: targets go to maintenance, flagged, with the reason. It resumes at the next check-in after a workout is logged.
- **While on a deficit, training lapses produce a notice only** (at 14 days): "Lifting is what tells your body to keep muscle while you
  lose weight." No target change.
- **Without the training log**, the only signal is the training-days setting. A user on lean gain who sets it to 0 gets the same
  suspension, immediately, with the explanation.
- **Illness, injury and travel are legitimate.** A pause (MM-148) stops these notices and counts. The notice wording never implies
  laziness (MM-108).
- **Imported workout sessions** (MM-68) count as training for this rule only when they are strength sessions; a logged run does not
  sustain a lean gain.

Where the experts disagreed:
- The behavior-change expert opposed any automatic change: overruling a user on a goal they chose is how apps get uninstalled. The
  recomposition and hypertrophy experts: an unearned surplus is the one case where the app is otherwise knowingly making the user fatter.
  Resolved as automatic only for the surplus, after three weeks, reversible by logging one workout.
- The strength expert wanted a minimum volume check (hard sets per muscle group, MM-78) to gate lean gain. Too easy to fail for
  uninteresting reasons (unlogged sets); the presence of training is the gate, and volume is information.

## Description
Notes on the goal sheet, an acknowledgement for lean gain without training, and a training-recency input to `nextTargets`.

## Acceptance Criteria
```gherkin
Scenario: Choosing lean gain without training
  Given a user with 0 training days
  When they select Lean gain
  Then the note is shown and the goal is not saved until they acknowledge it

Scenario: Recomp without training
  Given the same user selects Recomp
  Then the note is shown and no acknowledgement is required

Scenario: Training lapses on a gain
  Given a user on lean gain who logged workouts regularly and then none for 21 days
  When the next check-in runs
  Then targets are at maintenance, flagged, with the reason

Scenario: Training resumes
  Given the surplus is suspended
  When a strength workout is logged
  Then the next check-in restores the lean-gain targets

Scenario: Training lapses on a cut
  Given a user on fat loss with no workout for 14 days
  Then a notice is shown and targets are unchanged

Scenario: Paused
  Given a pause for injury is active
  Then no training notice is shown and the surplus is suspended without comment

Scenario: Cardio only
  Given a user on lean gain whose only sessions in 21 days are imported runs
  Then the surplus is suspended
```

## Notes
- Priority: the goal-sheet notes are must-have and cheap; the lapse rules wait for the training log (MM-75).
- A user on weight-loss medication gets the training note with different wording (MM-113).
- The protein target for a user who does not lift is lower (MM-121); changing training days changes it at the next check-in.

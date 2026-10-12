# Run brief: Logging a workout, walked

- Task ID and requested outcome: `mm212-workout-logging-walkthrough`. Review
  the usability of logging a workout as the app is built today, under the
  task-walkthrough rule of `agents/review-contract.md` (MM-212). Findings
  only; no change to the app is requested or authorized. A report with no
  findings is acceptable if its step records support it.
- Audit mode (change/feature/domain/panel-baseline), bounded coverage and
  unreviewed areas; planning's existing-behavior audit: `feature`. In scope:
  the Train destination, a workout in progress, choosing an exercise, the set
  editor, the timers, workout times. Out of scope: weekly volume, strength
  trends and histories, exercise science (rep ranges, progression rules),
  Health Connect.
- For screens: depth targets, the count that chose them, and the render
  supplied for each (or why none); what is only surveyed: one depth target,
  logging a workout. Counted from the source on 2026-10-11 (controls a
  person can act on; branches in the build code): add food 67 and 155;
  workout logging 39 and 70; settings 29 and 39; onboarding 19 and 34;
  progress entry 11 and 30; coach 11 and 34; pause 6 and 14; the Food
  screen 5 and 19. Workout logging is the second highest and is reviewed
  here because the highest has its own run. Renders of the built screens,
  360 by 800 logical pixels, from the existing screenshot tests in
  `apps/mobile/test/goldens/images/`: `train_dark.png`, `workout_dark.png`,
  `workout_martian.png`, `exercise_picker_dark.png`. No render exists of a
  running set timer, a rest counting down, the time dialog, the rest-target
  options, creating an exercise, the suggestions screen or workout times:
  walk those from source and say so, or leave them surveyed.
- Baseline branch/commit and working-tree changes:
  `feature/mm212-usability-by-inspection` at `ca3ff57`, with uncommitted
  changes to `agents/` and `requirements/` that do not touch the app.
- Requirement IDs and exact files (or tooling-only explanation): MM-75,
  MM-76, MM-79 under `requirements/training/`, and MM-191 (find each with a
  search for its id).
- Architecture/design/roadmap inputs and hashes: `design/screen-direction.md`,
  `design/ux-architecture.md`, `design/interaction-and-motion.md`,
  `design/voice-and-wording.md`. Hashes are in `state.json`.
- Existing facts, non-goals and approved owner decisions: the app is offline.
  A requirement that asks for a field does not settle whether a person can
  use it. Do not redesign; say what fails and what would have to be true.
- Acceptance criteria and proposed criteria (separate): each reviewer returns
  the shared report with a step record for each task below, each area marked
  walked or surveyed, and findings classed under the contract.
- Relevant core/selective role assignments and reasons for omissions:
  UX & accessibility and Product designer, independently, neither seeing the
  other's report. Tasks to walk, for a person who lifts and is using the
  training log for the first time, phone in hand between sets, on a 360-wide
  phone:
  1. Start a workout and log the first set of a barbell lift.
  2. Log the next set, timing the set and the rest.
  3. Fix the time of a set that was recorded wrongly.
  4. Finish the workout and find it again.
  Omitted: training, nutrition, micronutrients, coaching, measurement, safety,
  product, architecture, Flutter, integrations, privacy-security, QA. No
  domain rule, data handling or code is under review.
- Dependencies, safety/privacy constraints and unresolved choices: reviewers
  are read-only and cannot run the app. `requirements/ui-ux-assets/views/train.html`
  is a drawing made from the source; it may orient and is not the render.
  Synthetic fixture data only.
- Actual writer identity and ownership paths (or no owner): the chair, Claude
  Code session `9c9d02ab`, owns `docs/agent-runs/mm212-workout-logging-walkthrough/`.

## Record of omissions (added by the chair after the reviews; the assignment above is unchanged)

Each omitted role is recorded with the reason: "Outside a usability walkthrough of built screens; no rule of this domain is proposed or changed."
The chair is recorded with the reason: "The chair synthesizes; it did not write an independent review."

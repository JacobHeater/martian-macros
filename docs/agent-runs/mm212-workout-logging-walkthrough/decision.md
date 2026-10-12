# Panel decision: Logging a workout, walked

- Facts versus proposals and requirement traceability: the training log was
  walked as built at `ca3ff57`, against MM-75, MM-76, MM-79 and MM-191 and the
  design documents. Every proposal is in a ticket marked proposed; nothing in
  the app was changed.
- Consolidated inspected/uninspected coverage, evidence methods and referrals:
  walked on source and four screenshot tests: Train, a workout in progress
  with a set open, the exercise picker, the set controls, the timer bar at
  rest. Walked from source only: an empty workout, a running set timer, the
  countdown, the paused bar, the time dialog, rest-target options, workout
  times, a finished workout. Surveyed: creating an exercise, the suggestions
  screen, personal records. Methods: source inspection, render inspection,
  task walkthrough. Two reviewers, neither shown the other's report, given
  four tasks and no suggested findings.
- Deduplicated classified findings and confirmed issue-to-ticket routing:
  - **Defects, confirmed by a test that fails:** MM-214 the reps field can
    show what is not stored (UXA-3, in part); MM-215 removing a set cannot be
    undone, against the design rule (UXA-10, in part).
  - **Usability problems found by inspection, one cause each, all to MM-222:**
    a recorded set looks unfinished (PD-1, UXA-3); "Add set" is off screen
    when the bar points at it (PD-2, UXA-2); "Add set" stamps a time unsaid
    (UXA-1); a set row does not look as if it opens (PD-3, UXA-4); "Start
    set" before an exercise (UXA-5, PD-5); "Edit times" misleads (PD-4); the
    length is not shown where it is corrected (PD-6); a refused time (UXA-6);
    the paused bar (UXA-7).
  - **Requirement gap:** no screen direction for Train (PD-9): owner
    question, in MM-222 and the handoff.
- Accepted/rejected findings with reasons and sources: all of the above
  accepted as classed. PD-7 (the plus and minus are slight; left edges
  disagree) is a design improvement with no failing step and is not ticketed.
  PD-8 (a timed rest leaves no figure) contradicts no rule and is put to the
  owner in MM-222. No external source was used.
- Disposition of every finding (ticket, owner question, verified now, or
  rejected) and each reviewer request for evidence, answered: every finding
  above has a ticket or a stated reason. UXA-8 (the rest signal with the
  display off) and UXA-9 (screen reader, target size, large text) cannot be
  verified here and go to the repository handoff as needing a phone. Requests
  for evidence: a set being timed with the previous set open was supplied
  (`workout_set_running_dark`) and confirms PD-2 and UXA-2; a test of stored
  reps against the field was written and fails (MM-214). Declined for now,
  recorded in the handoff: screenshots of the empty workout, the paused bar,
  the time dialog, workout times and a reopened finished workout; the device
  checks.
- Targeted challenges, alternatives and remaining conflicts: none run. The
  two reports agree on the four main points and differ only in severity
  (high from the designer, medium from UX, on the first two).
- Safety/privacy blockers and qualified review needs: none. UX notes that set
  times recorded late could later be written to a health platform (MM-189);
  that is for the integrations role if it is taken up.
- Actual owner decisions (not persona consensus): none taken. Five questions
  are open in MM-222.
- Acceptance criteria, edge cases and cross-domain dependencies: in MM-222,
  marked proposed.
- Designated single edit owner and exact paths: the chair, for this folder
  and the tickets and tests named above.
- Verification plan, actual results and remaining limits: three guard cases
  run enabled once and seen to fail, then skipped under their tickets; the
  screenshot tests pass on Linux. Nothing was run on an emulator or a phone,
  and nobody was observed logging a workout.

## What this run shows about the review method, and what it does not

This interaction was not in the request that prompted MM-212. It was chosen
by count (39 controls and 70 branches, second to Add food). The reviewers
were given tasks, not leads, and independently reported the same four
problems, two of which are visible in a screenshot test that had existed for
days and that earlier work, the chair's included, had looked at without
remark. Two of their claims were turned into tests that fail.

It does not show that a person would stumble where the reviewers say. It
shows that a review done this way produces specific, checkable findings on a
screen nobody had flagged.

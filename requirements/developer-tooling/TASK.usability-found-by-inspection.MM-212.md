---
id: MM-212
status: done
component: developer-tooling
related: [MM-198, MM-201, MM-211, MM-213, MM-214, MM-215, MM-216, MM-217, MM-218, MM-219, MM-220, MM-221, MM-222]
---

# Task: The panel can find a usability problem by inspection, and no finding is left without an outcome

## Context
A reviewer outside the panel, asked to look at one sheet of the UI reference
library (the Add food sheet), raised usability concerns the product owner
already had. The panel’s own audit of the same journey (the run for MM-205, a ticket on that unmerged branch;
`docs/agent-runs/mm205-novice-mobile-experience/` on its branch) had product
designer and UX reviewers and did not put them in front of the owner.

Its records show why. The reviewers did see part of it: UX-05 named confusing
"reference servings with consumed amounts" and "Estimate with manual estimated
values"; PD-03 named the sheet offering "Search, Scan, Saved, Estimate,
recents and a manual form". Then:

1. **The contract had no class for what they had found.** A finding was a
   violation of something written, a reproduced defect, or else a "design/
   usability improvement" or an "unverified hypothesis". Both reviewers wrote
   that confusion "was not observed" and asked for a study of novice users,
   which the panel cannot run. A usability problem established by inspecting
   the screen, which is how such problems are ordinarily found before any
   user is involved, had nowhere to stand.
2. **Only confirmed defects had an outcome.** The decision ticketed three and
   left the rest as text in the run. Nothing carried them to the owner.
3. **Nobody could see the sheet.** No screenshot test covered it; the
   designer's report says so and asks for one ("Render at phone size"). The
   reviewers cannot run anything. The chair can, was not required to, and
   closed the run.
4. **Depth was not chosen.** One brief covered onboarding, Dashboard, Food,
   the sheet, Coach and Progress. The sheet, the interaction with by far the
   most decisions, received one finding each, cited at a 180-line range. The
   owner's signal (cards, analysis) pointed at the Dashboard, and the reports
   could not show which steps had actually been examined.

More role text was not what was missing: that run had already added a long
novice-journey passage to the UX role, and its findings still ended as
hypotheses. The reviewers were not the weak point either; the same reviewers
saw the same ground.

## Decisions
Choices I made without asking (say if any is wrong):
- **A task walkthrough is evidence.** For a named person and task, each step
  of the built screen is recorded: what is seen, what must be decided or
  known, the action, and what shows it worked. A step that fails is a finding
  of a new class, *usability problem found by inspection*. It needs no
  observed users and claims nothing about how many would fail.
- **Every finding gets an outcome**: a bug ticket, a proposed requirement
  ticket, a question on the handoff's owner list, verification done now, or
  rejection with the reason. "Needs verification" is not an outcome.
- **The chair names depth targets by counting** inputs, choices and branches
  in the source, and says what is only surveyed.
- **A depth target comes with a render of the built screen**, supplied by the
  chair. A sheet from the reference library is a drawing from source and is
  not that render.
- **Reports say walked or surveyed** for each area.
- **The role files are not changed.** The mechanism is in the shared contract
  and protocol, so every role and both tools get it.
- **Usability findings become proposed tickets, not changes.** Whether to
  alter food entry is the owner's; this task changes how the panel reviews.

## Description
- `agents/review-contract.md`: the walkthrough, the new class, walked versus
  surveyed.
- `agents/panel-protocol.md`: depth targets and their renders at scoping;
  disposal of every finding at synthesis.
- `agents/templates/brief.md`, `decision.md`: a line each for the above.
- `agents/state.schema.json`: `render-inspection` and `task-walkthrough` as
  evidence methods, so a run records that they happened.
- Screenshot tests of the Add food sheet (seven images), since it had none,
  and one more of a workout set being timed.
- The reference library's sheets take typed input in their fields and scale
  text alone, so they are less misleading as an aid.

## Acceptance Criteria
```gherkin
Scenario: A problem found by walking the screen
  Given a reviewer walks a depth target step by step on the built screen
  And a step leaves a new person unable to tell what a value means
  Then the report records the step and classes it "usability problem found by inspection"
  And it is not classed an unverified hypothesis for want of observed users
  And it does not claim that users were observed

Scenario: Every finding has an outcome
  Given a decision is written
  Then each finding is ticketed, put to the owner in the handoff, verified now, or rejected with a reason
  And none is left as "needs verification"

Scenario: A reviewer asks for evidence
  Given a report asks for a render or a test
  Then the decision records that it was supplied, or that it was declined and why

Scenario: Choosing where to go deep
  Given a review of several screens
  Then the brief names its depth targets and the count that chose them
  And says which areas are only surveyed

Scenario: A depth target with no render
  Given no screenshot test or capture of a depth target exists
  Then the chair adds one before the review, or records that none could be supplied and what that prevents

Scenario: A drawing is not the screen
  Given only a sheet from the UI reference library is available
  Then a walkthrough is not recorded as done on the built screen

Scenario: A run records how it looked
  When "mm panel docs/agent-runs/<run>" validates a run whose reviewers used renders and a walkthrough
  Then "render-inspection" and "task-walkthrough" are accepted as methods
```

## Notes
- Sources read for the method, 2026-10-11: Moran and Gordon, "How to Conduct
  a Heuristic Evaluation", Nielsen Norman Group, 2023-06-25
  (https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/):
  inspection finds likely problems without participants, evaluators work
  independently and each misses some, and it does not replace user research.
  Flaherty, "Evaluate Interface Learnability with Cognitive Walkthroughs",
  2022-02-13 (https://www.nngroup.com/articles/cognitive-walkthroughs/): a
  task-based inspection without users, asking at each step whether a new user
  will try the right thing, notice the action, connect it to the goal and see
  progress. Nielsen, "Severity Ratings for Usability Problems", 1994-11-01
  (https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/):
  frequency, impact and persistence, and one evaluator's severity is
  unreliable. These are practitioner sources, not trials; they support
  treating inspection as a legitimate source of findings and do not show that
  any particular finding is right.

## Progress (built and verified)
- The contract, protocol, two templates and the state schema are changed as
  described. `mm panel` passes, and both runs below validate with
  `mm panel docs/agent-runs/<run>`, recording `render-inspection` and
  `task-walkthrough` as methods.
- **Depth targets by count** (controls a person can act on; branches in the
  build code): add food 67 and 155; workout logging 39 and 70; settings 29
  and 39; onboarding 19 and 34; progress entry 11 and 30; coach 11 and 34;
  pause 6 and 14; the Food screen 5 and 19. The count alone puts the Add food
  sheet first.
- **Run 1, Add food** (`docs/agent-runs/mm212-add-food-walkthrough/`). Two
  reviewers, apart, given four tasks and seven screenshots of the built
  sheet, and not told what anyone had found. 30 findings between them, routed
  to three bug tickets (MM-213, MM-216, MM-217) and four proposed stories
  (MM-218 to MM-221). The first screenshot ever taken of the sheet showed a
  defect before any reviewer read it (MM-213).
- **Run 2, logging a workout** (`docs/agent-runs/mm212-workout-logging-walkthrough/`).
  Not named in the request; second by count. Same method, no suggested
  findings. 19 findings, the four main ones reached by both reviewers
  independently, routed to two bug tickets (MM-214, MM-215) and one proposed
  story (MM-222).
- **Every reviewer claim the chair could check was checked.** Five became
  tests that fail (run enabled once, then skipped under their tickets); two
  requested screenshots were added and confirm the findings they were asked
  for. Requests the chair could not meet are listed in each run's decision
  and in the repository handoff.
- **What the outside review raised, and where it stands:**

| Raised | In the app? | Where it went |
|---|---|---|
| The first screen mixes finding a food with typing one | Yes (both reviewers) | MM-219 |
| What the typed numbers are for, against the amount | Yes, high (both) | MM-218 |
| Measuring methods: units, fractions, moving between them | Partly: changing the method clears the amount silently (MM-216); fractions are accepted and unsaid. The rest was the drawing showing few methods | MM-216; drawing corrected |
| Editing does not show method and basis; old entries ambiguous | Yes for an entry typed per serving and for old entries. The drawing had also left the method out of the edit frame, which was the drawing's error | MM-221; drawing corrected |
| Search results give calories on different bases | The built rows say each basis in words; both reviewers passed the step and found instead that the two kinds of row lead to opposite behaviour | MM-219, as that |
| Unit choices overlap; oil | Units: judged low. Oil: yes, the choice adds an entry it never shows. A hand portion reads as exact (MM-217) | MM-217, MM-218 |
| Estimate has no result to review | Yes: no macros before logging, and the action is off screen | MM-218, MM-220 |
| Calorie warning does not say which value is logged | Yes | MM-218 |
| The drawing's fields could not be typed in | The drawing only | Fixed: fields take typing; nothing is calculated |
| Scaling the whole frame is not text scaling | The drawing only | Fixed: text alone scales; still not how Flutter reflows |

- **Not shown by any of this.** The chair knew the outside concerns when it
  chose and scoped run 1, so that run is not a blind test of the chair; the
  reviewers were blind. Two runs do not show the method always works. A
  walkthrough finds what a careful reader of the screen can find; it does not
  show that people fail, how many, or what they would prefer. Nothing was run
  on an emulator or a phone, in the other two palettes, at larger text, or
  with a screen reader.
- The MM-205 run could not be re-run under the new rules for comparison: it
  lives on an unmerged branch that is not this session's to change.

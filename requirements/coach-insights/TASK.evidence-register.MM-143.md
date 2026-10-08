---
id: MM-143
status: proposed
component: coach-insights
related: [MM-137, MM-18, MM-19, MM-23, MM-25, MM-26, MM-28, MM-29, MM-96, MM-108, MM-121, MM-128, MM-132, MM-135, MM-141]
---

# Task: A register of every constant, its source and how good the evidence is

## Context
The engine is full of numbers that decide what people are told to eat: 9,440 and 1,815 kcal per kg; 10.4 in the Forbes curve; the halving
for trained users; 0.65 persistence and 0.6% for water; 1.6 times noise around menstruation; 1,500 and 1,200; 30 kcal per kg of
fat-free mass; 0.5, 0.7, 1.0% a week; 1.6 to 2.2 and 2.3 to 3.1 g per kg; 100 kcal or 5%; 16 weeks; 28, 14, 10 and 8 for the window.

Their provenance is scattered across ticket notes, code comments and an architecture document, and it is uneven. Some are well-founded
(the energy densities; Mifflin-St Jeor). Some are sound conventions (the calorie floors). Some are explicitly made up and say so ("a
modelling assumption, not a fitted constant"; "a starting point, not fitted"; "my rules of thumb"). A reader cannot tell which is which
without reading everything, and the professional reviewer (MM-29) is owed a single list.

Some of the citations in use also deserve a more careful statement than they get. Two examples the panel raised:
- **The energy-availability floor.** The IOC's 2023 consensus statement on REDs moved away from treating 30 kcal per kg of fat-free mass
  as a universal threshold: it describes a continuum, notes the figure came from short laboratory studies in women, and that the
  threshold in men appears lower. The floor may be a reasonable conservative choice; "Loucks" as its sole source overstates how settled
  it is.
- **Wearable energy error "27% to over 90%"** (MM-23): the range is from a single well-known study of seven devices (Shcherbina 2017),
  and should be cited as that.

## Decisions
Choices I made without asking (say if any is wrong):
- **One file, `docs/evidence.md`, one row per constant or rule**, with: name; value; where it lives in code; what it decides; source (full
  citation, or "product judgement" with the author of the judgement); evidence grade; the population the evidence comes from; date last
  reviewed and by whom.
- **Four grades, defined once and used everywhere** (tickets, the register, and in-app text):
  - **strong**: consistent meta-analyses, consensus statements, or established physiology;
  - **moderate**: a good meta-analysis with inconsistency, or several trials, or strong evidence in a population different from ours;
  - **emerging**: one or a few small studies;
  - **judgement**: expert practice or product reasoning with no direct trial.
- **Population matters and is recorded.** Much of the literature is young, male and trained, or has obesity and is untrained. A row says
  which, so that applying it to a 55-year-old woman is a visible extrapolation.
- **The register is checked by a test**: every public constant in `SafetyBounds`, the partition model, the trend model and the estimator
  has a row, matched by name. Adding a constant without a row fails `mm check`.
- **The app has a "How this works" screen**, reachable from the Coach screen and Settings, generated from the register: plain-language
  entries grouped by question ("How is my protein target chosen?"), each ending with its grade in words ("Well established", "Reasonably
  supported", "Early evidence", "Our judgement") and, one tap down, the citation.
- **Explanations elsewhere may not claim more than the register's grade.** A sentence stating as fact something graded emerging or
  judgement is a defect (MM-108, MM-96).
- **A judgement row is not a failure.** Many product decisions cannot be anything else. The failure is a judgement presented as science.

## Description
Write the register for every existing constant; add the test; build the screen; correct any in-app or ticket wording the register shows
to be overstated.

## Acceptance Criteria
```gherkin
Scenario: Complete
  Then every public constant in the engine's safety, partition, trend and estimator code has a row in the register

Scenario: Kept complete
  Given a new constant added to SafetyBounds with no register row
  Then "mm check" fails and names it

Scenario: Graded
  Then every row has one of the four grades, a population, and either a citation or a named judgement

Scenario: Visible to the user
  When "How this works" is opened and the protein entry is chosen
  Then it explains the rule, states how strong the evidence is in words, and offers the source

Scenario: No overclaiming
  Given a rule graded emerging or judgement
  Then no text in the app states its effect as a fact

Scenario: Reviewed
  Then the professional reviewer's sign-off (MM-29) is recorded against rows, not against the app as a whole
```

## Notes
- Priority: must-have before public release, and before MM-29, which it makes far cheaper.
- Citations in these requirement tickets were gathered by literature search during planning and from secondary summaries in some cases.
  **Each must be checked against the primary source when its row is written**; a row is not done until someone has read the paper.
- Open questions the register will surface, listed here so they are not lost: the two different "lean woman" thresholds (23% for protein,
  25% for the energy floor, MM-28); whether Mifflin-St Jeor is the right starting formula for users who supply a body-fat figure (a
  fat-free-mass formula such as Cunningham or Katch-McArdle is generally closer in lean, muscular people); the 0.5 halving of lean loss
  for trained users (MM-26).

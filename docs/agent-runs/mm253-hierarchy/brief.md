# Run brief

- **Task ID and requested outcome:** `mm253-hierarchy`. The owner
  (2026-10-13): "I want the hierarchy rebuild with iconography." MM-253
  asks that the product-designer and UX-accessibility roles grade the built
  stories of every destination against the seven rules of the direction,
  in the register, before the screens are rebuilt (MM-254 to MM-259), so
  the rebuild starts from graded findings and not from the chair's taste.
  Outcome: two independent reports with every finding classified and
  given an outcome, consolidated in `decision.md`, routed into the six
  rebuild tickets or into bug tickets with regression tests.
- **Audit mode:** `feature`: the six destinations as built on `main` at
  `9fb8c79` (Dashboard, Food, Coach, Progress, Train, Settings), each as
  its Storybook screen story over the demo scenario, against the seven
  rules in MM-253 and the design documents below. Unreviewed: the sheets
  and pushed screens beneath each destination (Add food, Workout, the
  reports, the histories), the design-system components themselves
  (walked in `mm253-components` the same day; their fixes are merged as
  MM-262), the Android shell. Planning's existing-behaviour audit: the
  chair's own read of the six renders is recorded under "Existing facts".
- **For screens, depth targets:** the six destinations are the depth
  targets by the owner's own signal ("the app suffers from a lack of
  iconography and segmenting; monolithic views; cognitive overload"),
  not by a decision count: a destination is where the person decides
  what to look at first. Counts from the source, for the record:
  Dashboard renders 1 hero + 1 chart card + 1 weight card + 1 streak card
  + 1 insight card + a metrics section of 6 cards and a recovery card (11
  top-level groups); Food 1 hero + 1 chart card + 4 meal cards + 1
  completeness control (7); Coach up to 11 cards and up to 3 notices;
  Progress 1 entry card + 1 chart card + 1 events card + 1 waist card +
  up to 4 strength cards + 1 intro card (9); Train 3 buttons + 1 list card;
  Settings 12 groups mixing chips, segments, sliders and rows.
  **Renders supplied for every target:** the static Storybook build of
  `main` at `9fb8c79`, drawn headless at 412 px wide and 2,600 px tall in
  Martian and Light, saved on the chair's machine at
  `C:/Users/jacob/AppData/Local/Temp/claude/c--Users-jacob-dev-martian-macros/9c9d02ab-952f-4e0e-85e3-8f72d0e91c46/scratchpad/before/<story>-<palette>.png`
  for the stories `screens-today--dashboard`, `screens-food--food`,
  `screens-coach--coach`, `screens-progress--progress`,
  `screens-train--train` and `screens-settings--settings`. They are
  renders of the app's own screens over fixture data (MM-237), not
  drawings; they show the first 2,600 px, so Dashboard's and Coach's
  tails are cut. Dark was not rendered: the rules under review are about
  hierarchy, not colour, and Dark shares Light's radii and Martian's
  surface steps. Nothing on a device.
- **Baseline branch/commit and working-tree changes:** `main` at
  `9fb8c796831f98f11bb9a0c77c9d9cb0b9ddf5ae`, clean; the chair works on
  `feature/mm253-hierarchy` from it. The reviewers read the tree at that
  commit; the chair begins the rebuild on the branch while they review,
  and the reports are judged against the baseline, not the branch.
- **Requirement IDs and exact files:** MM-253
  (`requirements/usability/TASK.hierarchy-and-wayfinding-direction.MM-253.md`,
  the seven rules and the eighth from MM-262); MM-254
  (`requirements/dashboard/STORY.dashboard-with-tiers.MM-254.md`); MM-255
  (`requirements/food-logging/STORY.food-screen-with-tiers.MM-255.md`);
  MM-256 (`requirements/coach-insights/STORY.coach-screen-with-tiers.MM-256.md`);
  MM-257 (`requirements/body-measurements/STORY.progress-screen-with-tiers.MM-257.md`);
  MM-258 (`requirements/training/STORY.train-screen-with-tiers.MM-258.md`);
  MM-259 (`requirements/settings/STORY.settings-with-icons-and-sections.MM-259.md`);
  MM-224 (the epic they hang from).
- **Architecture, design and roadmap inputs and hashes (SHA-256, at
  `9fb8c79`):** `design/screen-direction.md`
  e47c999b64fcd7163076aa286a889d20225ed56ef13934cfaf440fb53f9745ab;
  `design/anti-cruft-and-anti-slop.md`
  ddeb7c127b69c5c93181e98ba6455f6478fb0a26e14e22d7905499f1763c9e2d;
  `design/visual-language.md`
  a7a5a7f2b0ad8c0d25be65974561c958e3b40fc0c9c1509e7250cf98db1ea502;
  `design/interaction-and-motion.md`
  e0f4e3f79c437b3892dc73092fd26b8eb7f19ad6b4ca5e1632714f3ea5cbd885;
  `design/design-system-implementation.md`
  a33ca9631d99c3ddcc84c918bca115a26f1c14fb2c5889540f03709567a049f0;
  MM-253 f9ada874a2407c3155f2c84189df2c4f450987bc7a892afef6b1653daf20c261;
  MM-254 95dcb63f4fa50607fe646325229ae6f400ca2f1e29690fcb67246f7a95ac0263;
  MM-255 41fd5388f48d73f33df9ed1779bf233a4a901d02cfe5ae43dbab8b1e2b8f8d89;
  MM-256 81e2fcd72743c4929b94d2bb7a009bee597188a429b4e450647aa7b5461afaf1;
  MM-257 896c295fa9dafae1842ac409a6b6e2a6c3daa1cdc5b08b4c8bc3f1a5d44ece50;
  MM-258 faaf137336ccc661a49e46e80d7a87fd6aaf4dc498648db30f03223442b8e356;
  MM-259 7cf512e3dcc1366056623c2870e4553414e8aee8986c0150717eb379c1710951;
  `agents/panel-protocol.md`
  8fe36a9eb6c5fb23c29b16ceb9ba0a3b8a927ed588633474f5e693bf45445e62;
  `agents/review-contract.md`
  7965b6e0cb7dd14dbe6a442b2f1a36bb304300a6a04cee04059bc332527722f8;
  `agents/roles/product-designer.md`
  8bf1398283164813885f66db04a4ff8857fb9a2443d219477abcfa5a1783e2bb;
  `agents/roles/ux-accessibility.md`
  679b6b24ec000782eba619f6fe917619367ff0d1fd297078646e21b6c4cefaf3;
  `AGENTS.md` af50d527c202aa068490f0772d03da163011095291acd350ae919b586acdd31b.
  The screen sources: `apps/mobile/src/dashboard/`, `food/`, `coach/`,
  `progress/`, `train/`, `settings/`, and `apps/mobile/src/app/HomeShell.tsx`.
- **Existing facts, non-goals and approved owner decisions:** The chair's
  read of the six renders (facts, from the PNGs): every destination is a
  column of `MmSurface` cards of one radius and fill; the macro picture
  (bars in the hero and the "Macronutrient split" donut card) appears
  twice on Dashboard and on Food; Coach renders eleven cards of equal
  weight with its one next step nowhere in particular; Progress's chart
  caption is four lines inline and its weight-events explanation four
  lines; Train is a full-width primary and a full-width secondary button,
  a chip, then thirteen identical rows with no grouping and the record
  count in a subtitle; Settings mixes chips, a segmented control, sliders
  and rows across twelve groups; icons appear in the navigation bar, in
  Settings' About and Data rows and nowhere else. Owner decisions in
  force: Material icons everywhere now, custom art after MM-109; both
  macro pictures kept behind a switch, never both at once; all six
  destinations under one direction built in stages; nothing native shows
  (MM-262, built and merged as #154 the same day, so every control the
  rebuild uses is drawn by the design system). Non-goals: no new
  colour, no mascot, no illustration, no change to what a screen
  computes; the rebuild changes where things sit and how they are told.
- **Acceptance criteria (existing):** MM-253's four scenarios; each
  rebuild ticket's "Nothing lost" (every figure and control reachable
  within one tap) and its own scenarios. **Proposed by this run:** the
  reviewers propose criteria per destination in their reports; the chair
  folds accepted ones into the tickets' Progress notes, marked as the
  panel's.
- **Role assignments:** product-designer and ux-accessibility, each
  independent, in parallel, read-only, with the same brief and renders.
  Omitted (training, nutrition, coaching, measurement, safety, and the
  selective roles privacy-security, micronutrients, integrations, qa,
  product, architecture, react-capacitor), each with this reason:
  The rebuild moves and segments what the screens already compute and say; no health rule, coaching message, measurement, data flow or component contract changes, and the React-Capacitor role walked the components the same day.
- **Dependencies, safety/privacy constraints and unresolved choices:**
  Safety content (the under-eating notice, the relief offer, cautions, the
  pause banner) must stay at the top of its screen and never move behind
  a disclosure; the reviewers are asked to check the rebuild tickets honour
  that. Unresolved: whether Dashboard's rhythm strip shows the calendar
  week or the last seven days (the chair builds the last seven days, so
  every dot is a real day); whether Progress's waist and strength open a
  screen or unfold in place (the chair builds unfold in place).
- **Actual writer identity and ownership paths:** the parent session
  (Claude Fable 5.1) as chair and single edit owner, on
  `feature/mm253-hierarchy`: `apps/mobile/`, `design/`, `requirements/`,
  `roadmap/`, `docs/agent-runs/mm253-hierarchy/`. Reviewers return text
  only.

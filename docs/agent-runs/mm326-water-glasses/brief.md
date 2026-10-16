# Run brief

- **Task ID and requested outcome:** `mm326-water-glasses`. The owner, 2026-10-14, on the Food screen's
  Water section: "add a visual here to gamify the water and make it easier to accomplish the goal". The
  owner chose glasses to fill, shown folded or not, with a quiet check mark at the goal. Outcome: the
  glasses drawn, reviewed against their siblings, an outcome for every finding.
- **Audit mode:** `change`: `MmTally` (new), `MmSection`'s `meter`, `waterGlasses`, `glassesLabel`,
  `WaterSection`, their stories and tests. Not in scope: the Dashboard water row, the add sheet, the goals.
- **For a new section, row or control: its nearest siblings on the same screen** (rule 9 of
  `design/screen-direction.md`): the meal sections (`MealSection`, whose summary carries the quiet
  `food-meal-marker` check mark), the macro bars in the hero above (`MmProgressBar`), and the design
  system's `MmRhythmStrip` (MM-253, rule 3), whose dots the tally reuses. **The question every design
  reviewer answers first: does the tally look and behave like what sits around it, and where it does not,
  is the stated reason good enough?** Stated differences: no letters and no per-mark name (a mark is a
  glass, not a day; heard once as a whole); a strip under a section header, which no meal has (a meal has
  no goal to fill).
- **Baseline:** `fix/unseen-states` at `4527f32` (PR #160) plus the working tree on
  `feature/water-glasses`.
- **Requirements:** MM-326 (this), MM-318 (water as a section), MM-313 (water), MM-253 (sections, rhythm).
- **Existing facts and owner decisions:** glasses to fill; always shown; a quiet mark at the goal. A glass
  is the add sheet's (8 fl oz, 250 ml).
- **Renders supplied** (412 by 915 frame, static Storybook, in `C:/Users/jacob/AppData/Local/Temp/claude/c--Users-jacob-dev-martian-macros/146d53ab-1011-49eb-b45b-55f6848c57de/scratchpad/shots`): water-glasses in martian, dark
  and light (3 of 16, imperial); water-glasses-folded (martian); water-glasses-half (light, 1.5 of 8);
  water-most-glasses (martian, 26 glasses, three rows); water-goal-reached (dark, all full, check);
  water-goal-set-none (martian, 0 of 8); water-section (martian, no goal, no tally).
- **Roles:** product-designer (sameness with the siblings, hierarchy, the motivating effect) and
  ux-accessibility (the UX guard).
- **Omitted roles** (the reasons as recorded in `state.json`):
  - chair: The parent session chairs and owns the edits; its synthesis is decision.md.
  - training: An owner-chosen visual of the water section; no health rule, advice wording, measurement or engine change.
  - nutrition: An owner-chosen visual of the water section; no health rule, advice wording, measurement or engine change.
  - coaching: An owner-chosen visual of the water section; no health rule, advice wording, measurement or engine change.
  - measurement: An owner-chosen visual of the water section; no health rule, advice wording, measurement or engine change.
  - safety: An owner-chosen visual of the water section; no health rule, advice wording, measurement or engine change.
- **Writer:** the parent session (Claude Opus 5.5), single edit owner. Reviewers are read-only.

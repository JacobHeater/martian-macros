# Run brief

- **Task ID and requested outcome:** `mm326-water-bar`. The owner, 2026-10-15, looking at the first
  design (glasses as dots, `docs/agent-runs/mm326-water-glasses/`): "This should be a bar that stretches
  the span of the screen width with fluid animation to indicate water filling. When the user adds/removes
  water it animates. When they expand the section it animates." Outcome: the bar drawn, reviewed, an
  outcome for every finding.
- **Audit mode:** `change`: `MmProgressBar` (kind `water`, weight `prominent`), `usePoured`, the
  `--water` and `--motion-pour` tokens, `MmSection`'s `meter` (drawn anew on opening), `WaterSection`,
  the water CSS in `ui.css`, the Water stories and tests, `design/interaction-and-motion.md` (moment 5)
  and `design/color-and-theme-system.md` (Water). Not in scope: the Dashboard water row, the add sheet.
- **For a new section, row or control: its nearest siblings on the same screen** (rule 9 of
  `design/screen-direction.md`): the hero's macro bars (`MmProgressBar`, MM-278) directly above, and the
  meal sections (`MealSection`). **The question every design reviewer answers first: does the water bar
  look and behave like what sits around it, and where it does not, is the stated reason good enough?**
  Stated differences: it spans the section under its icon (the owner asked for the screen's width); it is
  heavier (14 px, `prominent`); it pours (the owner asked for fluid animation); its own colour token.
- **Baseline:** `feature/water-glasses` (PR #161) plus the working tree.
- **Requirements:** MM-326 (rewritten for the bar), MM-318, MM-278, the motion rules (`design/interaction-and-motion.md`:
  no perpetual animation, no overshoot; reduced motion).
- **Existing facts and owner decisions:** the bar across the screen; animates on add, remove and opening;
  always shown; a quiet check mark at the goal.
- **Renders supplied** (in `C:/Users/jacob/AppData/Local/Temp/claude/c--Users-jacob-dev-martian-macros/146d53ab-1011-49eb-b45b-55f6848c57de/scratchpad/bar`): settled, 412 by 915 frames: water-bar in martian, dark, light;
  water-bar-folded-martian (white box: focus ring after the fold); water-bar-nearly-there-light;
  water-goal-reached-dark; water-goal-set-none-martian; water-section-martian (no goal, no bar);
  water-goal-partway-dark. The pour in Light at 2x, cropped to the section, captured over the DevTools
  protocol: pour-settled; pour-open-60, -250, -500, -900, -1600 (ms after the section is opened again);
  pour-add-100, -300, -600, -1500 (ms after Glass is chosen in the add sheet).
- **Roles:** product-designer and ux-accessibility (the UX guard).
- **Omitted roles** (the reasons as recorded in `state.json`):
  - chair: The parent session chairs and owns the edits; its synthesis is decision.md.
  - training: An owner-directed visual of the water section; no health rule, advice wording, measurement or engine change.
  - nutrition: An owner-directed visual of the water section; no health rule, advice wording, measurement or engine change.
  - coaching: An owner-directed visual of the water section; no health rule, advice wording, measurement or engine change.
  - measurement: An owner-directed visual of the water section; no health rule, advice wording, measurement or engine change.
  - safety: An owner-directed visual of the water section; no health rule, advice wording, measurement or engine change.
- **Writer:** the parent session (Claude Opus 5.5), single edit owner. Reviewers are read-only.

# Run brief

- **Task ID and requested outcome:** `mm318-water-section`. The owner, 2026-10-14, on the Food screen's
  water block as built for MM-313: "make this an accordion section like the others". Outcome: Water rebuilt
  as a section like the meals, reviewed against them, an outcome for every finding.
- **Audit mode:** `change`: `WaterSection`, `WaterEntryTile`, `AddWaterSheet`, `showAddWaterSheet`, the
  `NumberEntry` focus fix, and their stories and tests. Not in scope: the Dashboard water row, Micros, the
  goals.
- **For a new section, row or control: its nearest siblings on the same screen** (rule 9 of
  `design/screen-direction.md`): `MealSection` (`apps/mobile/src/food/MealSection.tsx`), `FoodEntryTile`,
  and the Add food sheet (`AddFoodSheet`, `showAddFoodSheet`). **The question every design reviewer answers
  first: does Water look and behave like the meal sections, and where it does not, is the stated reason
  good enough?** The stated differences: a water row cannot be pressed (a drink has nothing to edit but its
  amount; delete and add again), and Water has no "copy to today" on a past day (no reason to copy a day's
  drinks).
- **Baseline:** `feature/water-sodium-micronutrients` at `75f00ba` plus the working tree (this change).
- **Requirements:** MM-318 (this), MM-313 (water), MM-317 (focus, second cause), MM-255 (meal sections).
- **Existing facts and owner decisions:** Water is a section like the meals (owner). The rest of MM-313
  stands (sizes, another amount, a goal, plain water only, Undo).
- **Renders supplied** (412 by 915, static Storybook, in the chair's scratchpad `shots4`): Water Section in
  Martian, Light, Dark (the section below the meals); Water None; Water Add Sheet in Martian and Light;
  Water Other Amount (Dark); Water Other Refused; Water Removed; Water Goal Reached.
- **Roles:** product-designer (sameness with the meals, hierarchy) and ux-accessibility (the UX guard).
- **Omitted roles** (the reasons as recorded in `state.json`):
  - chair: The parent session chairs and owns the edits; its synthesis is decision.md.
  - training: A layout change of the water section; no health rule, wording of advice, measurement or engine change.
  - nutrition: A layout change of the water section; no health rule, wording of advice, measurement or engine change.
  - coaching: A layout change of the water section; no health rule, wording of advice, measurement or engine change.
  - measurement: A layout change of the water section; no health rule, wording of advice, measurement or engine change.
  - safety: A layout change of the water section; no health rule, wording of advice, measurement or engine change.
- **Writer:** the parent session (Claude Opus 5.5), single edit owner. Reviewers are read-only.

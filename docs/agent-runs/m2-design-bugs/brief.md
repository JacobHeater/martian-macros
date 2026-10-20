# Brief: the M2 design bugs, fixed in one batch (MM-336, MM-342, MM-351, MM-352, MM-373, MM-374, MM-324)

## Question
Seven design bugs the panel's earlier runs found are fixed together on
`feat/m2` (the owner, 2026-10-19: close the beta's tickets on one branch).
Each ticket said "a design fix: drawn in Storybook, reviewed by the panel";
the stories that draw them already exist, so this is the review. Does each
fix match its siblings (rule 9), say things in the domain's words, and leave
no state undrawn?

1. **MM-336, the day's alcohol inside the hero.** The Food screen's fiber
   and alcohol lines were bare paragraphs on the canvas between the hero and
   the meals. Both now sit inside the calorie hero under its picture, in a
   `lines` slot (`.food-hero-lines`, muted lines). Story `FoodWithAlcohol`
   (and `FoodFullDetail` for the fiber line).
2. **MM-342, figures in the figure column.** "Your last 7 days" on Coach
   put "2,350 kcal against 2,100: 250 over" in a stat row's value. The value
   is now the figure, "2,350 kcal", and the target, distance and notes are a
   muted `detail` line under the row (`StatRow` gains `detail`,
   `.mm-stat-detail`). Story `CoachStalledOverTarget`.
3. **MM-351, the lookup announced.** The scan step's "not in the food
   database on this phone" notice is a polite status (`Notice` gains
   `live`, `role="status"`); nothing moves focus. Story `AddFoodUnknownBarcode`
   or its sibling in `Food.stories.tsx` (the MM-337 state).
4. **MM-352, icons and an edge.** "Nothing downloaded yet" carries the
   `download` icon, an installed pack the `document` icon; every `Notice`
   now carries a 1 px `--outline` hairline, so it stands apart from the
   canvas in Light as the list groups beside it do. This last is app-wide:
   is the hairline right on every notice kind (info, caution, safeguard,
   which already has a border of its own)? Stories: Settings' food database
   stories; any story with a notice.
5. **MM-373, MM-374, 200% text.** Each navigation label is its own span that
   wraps inside its destination; the app bar's title wraps inside a word
   rather than over its action; a list row's action button wraps its words
   and may shrink so the row stays one row. Stories `FoodLargeText`,
   `DashboardLargeText` (Designs/Coaching insights).
6. **MM-324**, one text column for rows with and without an action: a CSS
   gap, no design question; listed for completeness.

## Inputs
- `apps/mobile/src/ui/ui.css` (5639983e060e7cf5…), `apps/mobile/src/food/food.css` (255b79e952ed15f5…)
- `apps/mobile/src/food/CalorieHero.tsx` (6b3997bde2e4c817…), `apps/mobile/src/food/FoodScreen.tsx` (8d8d308247c4eb55…), `apps/mobile/src/food/FiberLine.tsx`
- `apps/mobile/src/ui/StatRow.tsx` (4a813c8808076630…), `apps/mobile/src/format/adherenceLines.ts` (2ecd2f7f77f0a1c1…), `apps/mobile/src/coach/AdherenceCard.tsx`
- `apps/mobile/src/ui/Notice.tsx` (920033f6b319b721…), `apps/mobile/src/food/scan/BarcodeScanStep.tsx`
- `apps/mobile/src/foodPacks/FoodDatabaseScreen.tsx` (db5be6e5c5573575…)
- `apps/mobile/src/ui/MmNavigationBar.tsx` (fa6117e25890c59a…), `apps/mobile/src/ui/MmAppBar.tsx`, `apps/mobile/src/ui/MmListRow.tsx`
- Stories: `apps/mobile/src/gallery/screens/Food.stories.tsx`, `Coach.stories.tsx`, `Settings.stories.tsx`, the Designs/Coaching insights large-text stories.
- Tests: `test/gallery/registerDefects.test.tsx` (MM-336, MM-342 guards now running), `test/app/largeTextLayout.test.ts`, `test/ui/listRowColumn.test.ts`, `test/food/scanAnnounced.test.tsx`, `test/settings/foodDatabase.test.tsx`, `test/coach/adherenceSummary.test.tsx`.
- The seven tickets, each with its "Fix (2026-10-19)" section. Direction: `design/screen-direction.md`, `design/anti-cruft-and-anti-slop.md`.

## Audit mode, coverage, renders
- Mode: change. Baseline `main` at 39f315c; the working tree of `feat/m2`, uncommitted at review time.
- **Depth targets**, counted from the source: (a) Food with a glass of wine logged at Full detail: the hero's figure, its picture, two lines, the status row (1 press, 2 lines); (b) Coach stalled over target: four stat rows, one with a detail (4 rows). Everything else surveyed.
- **Render supplied**: the stories, read from source (no browser automation on the owner's Mac in this session). Say so.
- Not reviewed: the engine's numbers; the ranking of search; the tool.

## Existing facts, non-goals, owner decisions
- The owner's rule (MM-293): every design through Storybook and the panel before it is built; here the stories existed and the fixes are small, so the review follows the build in the same batch and is recorded before the pull request.
- Non-goals: redesigning the hero, the Coach summary or the navigation bar; a count or a grade anywhere in the adherence summary (MM-149).

## Acceptance criteria
- Each ticket's own scenarios, in its file.

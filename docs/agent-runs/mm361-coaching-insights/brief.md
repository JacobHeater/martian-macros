# Run brief

- **Task ID and requested outcome:** `mm361-coaching-insights`. The owner, 2026-10-17: "do the designs
  now" for coaching insights inline (MM-361) and food grades (MM-370), specified the same day. Outcome:
  every state drawn in Storybook on the real screens, reviewed by the product designer and the UX guard,
  an outcome for every finding (MM-293's gate). Nothing is built behind the design: the lines, grades
  and recent insights are the design's own figures, handed to the real screens through a design seam
  (`InsightPreview`) that the app never provides.
- **Audit mode:** `change`. New: `coach/InlineInsight` (+ `InlineInsightContent`, `InlineInsightLayout`,
  `RowWithInsight`), `food/FoodGrade` (+ `FoodGradeValue`, `FoodGradeLetter`), `ui/MmPopover` and
  `Overlays.popover`, `coach/RecentInsightsSection`, `settings/CoachSettingsSection`,
  `settings/CoachSettingsScreen`, `settings/CoachAreaScreen` (+ `InsightSwitchesDraft`), the seam
  `coach/InsightPreview*`, and their CSS in `coach.css`, `food.css`, `settings.css`, `train.css`,
  `ui.css`. Changed to read the seam: `MealSection`, `FoodDayHeader`, `FoodSearchResults`,
  `AddFoodSheet`, `FoodAmountStep`, `WorkoutExerciseCard`, `DashboardScreen`, `CoachScreen`,
  `SettingsScreen`. Stories: `src/gallery/screens/CoachingInsights.stories.tsx` (21) and
  `Overlays.stories.tsx › Popover`.
- **For each new part, its nearest siblings on the same screen** (rule 9 of `design/screen-direction.md`).
  **The question every design reviewer answers first: does the new part look and behave like what sits
  around it, and where it does not, is the stated reason good enough?**
  - The inline line under a food entry: siblings are the entry row itself (`FoodEntryTile`, its method
    icon column and text column), the easy-to-miss line (`EasyToMissLine`) and the dashboard insight's
    "What this rests on" (`InsightCard`, `MmDisclosure`). Stated difference: it is a disclosure inside
    the entry's swipe row, its icon in the entry's icon column, its text in `--text2` at body size, the
    insight icon in `--info`.
  - The line under a Dashboard row (weigh-in, waist, water): siblings are those `MmListRow`s; the line is
    inside the same list-group child, so no hairline falls between a row and its line.
  - The line under a workout exercise: sibling is "Last time" and the suggestion inside
    `WorkoutExerciseCard`. **The chair already dropped a draft rule:** "New best" repeated the workout's
    own Personal records card (`WorkoutScreen`), so it is not an inline line (MM-366 to be amended).
  - The grade badge: siblings are the entry's calories and its "More actions" button (entries), the meal
    header's copy and add buttons (meals), the completeness mark in the day header, and `FoodTrustMark`
    in search and on the amount step. Stated difference: a neutral outlined letter in a 48 dp slot of its
    own, outside the pressed part of the row; an ungradable food is a dashed "?" button that opens a
    popover.
  - The popover: sibling is `MmMenu` (anchored, drawn by the overlay host). New component.
  - The Coach tab's Recent insights: sibling is Monthly reports (`ReportsCard`).
  - Settings > Coach: siblings are Today's setup's rows (Pause opens a screen; Easy-to-miss is a switch).
    The area screen uses `MmSwitchRow`s in a list group. The spec (MM-364) said each area row has its own
    switch; the design moved the area's switch into its screen so no row holds two controls. Say whether
    that is right.
- **Baseline:** branch `design/inline-insights-and-grades`, stacked on `spec/inline-coaching-insights`
  (PR #177), plus the working tree.
- **Requirements:** MM-361 (epic), MM-362, MM-363, MM-364, MM-365, MM-366, MM-367, MM-370, MM-371;
  MM-108 (voice, no red), MM-141 (dashboard insights), MM-291 (nothing holding a control bare on the
  canvas), MM-318 (siblings), MM-253/MM-254 (hierarchy).
- **Existing facts and owner decisions (2026-10-17):** inline under the item; every qualifying item shows
  its line (not rationed); one line, expandable; quieted only in Settings > Coach (master, area, rule);
  same safeguards (eating-disorder history: no food-composition or weight lines); grades A+ to D-,
  universal, on every logged food, in search and add, for each meal and day; a "?" with a popover when a
  food can't be graded; grades shown with an eating-disorder history; nothing paywalled.
- **Renders supplied** (412 by 915, each in martian, dark and light), in
  `C:/Users/jacob/AppData/Local/Temp/claude/c--Users-jacob-dev-martian-macros/5768f982-f0cb-404d-8707-4c5ae277fee9/scratchpad/shots/`,
  named `<story>-<palette>.png`: food-with-insights, food-two-insights-in-one-meal, food-insight-open,
  food-insight-to-settings, food-grade-why, food-meal-grade-why, food-with-insights-eating-disorder,
  search-with-grades, amount-step-with-grade, workout-with-insights, workout-insight-open,
  dashboard-with-insights, coach-recent-insights, coach-recent-insights-none, settings-coach-section,
  coach-settings, coach-settings-all-off, coach-settings-food, coach-settings-food-off,
  coach-settings-food-eating-disorder, coach-settings-training. Known artifact: a white box round a
  control that a story's walk just pressed is the focus ring after a scripted press.
- **Interactions marked for a walkthrough (depth):** (1) a novice reads yesterday's food log, notices the
  line under Peanut butter, opens it, and reaches its switch; (2) a novice sees a "?" grade on a snack
  and finds out why; (3) a screen-reader user moves through a meal with grades and a line; (4) a person
  turns off food tips entirely, then turns everything back on.
- **Roles:** product-designer and ux-accessibility (the UX guard).
- **Omitted roles:** chair (the parent session chairs and owns the edits; its synthesis is decision.md);
  coaching, nutrition, training, measurement, safety (the wording and thresholds of the rules are drafts
  that MM-365 to MM-368 send to those roles before anything is built; this run is the visual and
  interaction design); react-capacitor (the seam is design-only and is replaced when MM-362 is built).
- **Writer:** the parent session (Claude Opus 5.5), single edit owner. Reviewers are read-only.

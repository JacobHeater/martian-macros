# Review: ux-accessibility

## Scope and traceability

- **Role and reviewer:** UX & accessibility (`agents/roles/ux-accessibility.md`). Reviewer is Claude (`claude-opus-5-5`), a read-only subagent of chair session `9c9d02ab`. One pass; no other reviewer's report was seen or looked for.
- **Run:** `mm212-add-food-walkthrough`, audit mode `feature`.
- **Commit:** branch `feature/mm212-usability-by-inspection` at `ca3ff57`, as the brief states. I could not run git, so this is not independently confirmed.
- **Input hashes:** not computed (no shell). The brief says they are in `state.json`, which I did not open.
- **Requirements read in full:** MM-38, MM-39, MM-42, MM-43, MM-44, MM-45, MM-46, MM-48, MM-150, MM-151, MM-153, MM-167, and the bug ticket MM-213. All are under `C:\Users\jacob\dev\martian-macros\requirements\food-logging\` except MM-153, which is under `...\requirements\food-database\`.
- **Guidance read in full:** `AGENTS.md`, `agents/roles/ux-accessibility.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, `agents/templates/findings/role.md`, and the brief at `C:\Users\jacob\dev\martian-macros\docs\agent-runs\mm212-add-food-walkthrough\brief.md`.
- **Design inputs read:** `design/screen-direction.md`, `design/ux-architecture.md`, `design/interaction-and-motion.md`, `design/voice-and-wording.md` (all under `C:\Users\jacob\dev\martian-macros\design\`).
- **Renders read** (all under `C:\Users\jacob\dev\martian-macros\apps\mobile\test\goldens\images\`): `add_food_opened_dark.png`, `add_food_form_end_dark.png`, `add_food_search_dark.png`, `add_food_amount_dark.png`, `add_food_estimate_dark.png`, `add_food_edit_dark.png`. They are produced by `apps/mobile/test/goldens/screen_goldens_test.dart:576-654`.
- **Source read.** Citations below use the file name and line; every name is unique within these folders.
  - `C:\Users\jacob\dev\martian-macros\apps\mobile\lib\src\food\`: `add_food_sheet_state.dart`, `food_amount_step_state.dart`, `food_search_results.dart`, `show_add_food_sheet.dart`, `add_food_button.dart`, `amount_choice.dart`, `food_trust_mark.dart`, `food_entry_tile.dart`, `meal_section.dart`, `food_screen.dart`
  - `...\food\estimate\estimate_meal_step_state.dart`
  - `...\food\scan\barcode_scan_step_state.dart`, `mobile_scanner_view_state.dart`
  - `...\food\custom\my_foods_step_state.dart`, `custom_food_form_state.dart`, `recipe_form_state.dart`, `recipe_ingredient_adder_state.dart`
  - `C:\Users\jacob\dev\martian-macros\apps\mobile\lib\src\format\`: `quantity_source_label.dart`, `portion_unit_label.dart`, `portion_summary.dart`, `quantity_text.dart`, `parse_number.dart`, `trust_tier_label.dart`, `food_source_label.dart`
  - `C:\Users\jacob\dev\martian-macros\apps\mobile\lib\src\ui\`: `mm_text_field.dart`, `mm_button.dart`, `mm_choice_chip.dart`, `mm_list_row.dart`, `mm_segmented.dart`, `notice.dart`, `day_stepper.dart`
  - `C:\Users\jacob\dev\martian-macros\apps\mobile\lib\src\theme\mm_colors.dart`, and by search only `mm_theme.dart:147-209`
  - `C:\Users\jacob\dev\martian-macros\packages\domain\lib\src\food\portion\units_offered.dart`, `parse_quantity.dart`

## Existing facts versus proposals

**Repository facts (source and renders):**

- The sheet is one modal bottom sheet (`show_add_food_sheet.dart:15-26`). Its content is swapped in place between the main form, the amount step, My foods, Estimate and Scan (`add_food_sheet_state.dart:353-422`).
- With the search field empty, the sheet shows the three route buttons, the recents chips and the whole typed form. With any text in search, all of that is replaced by result rows (`add_food_sheet_state.dart:443, 489-542`).
- The typed form's basis defaults to totals for everything eaten. "One serving" is offered only under Label serving. Typed totals are never multiplied by the amount (`add_food_sheet_state.dart:58, 159-187, 701-711`).
- A line saying what will be logged appears only for a per-serving or calculated entry (`add_food_sheet_state.dart:590-600`).
- The amount step for a found food always shows live totals (`food_amount_step_state.dart:356-363`).
- MM-213 (Saved and Estimate break mid-word at 360 wide) is already ticketed. The render confirms it. I do not re-file it.

**Approved requirements that bear on the findings:**

- MM-167 decision 3 sets the default basis to "For everything you ate" and makes a quantity on typed totals descriptive only.
- MM-151 asks that the raw or cooked choice be remembered.
- MM-42 asks for "Enter manually" when nothing is found.
- `design/interaction-and-motion.md:48-49` asks that sheets be dismissible by drag, back and a visible close action; lines 83-84 ask for frequent actions in thumb reach.

**Proposals:** only the "what would have to be true" statements under each finding and the proposed criteria near the end. None is a redesign and none is approved.

## Audit coverage

Mode: `feature`. Method: source inspection plus the six renders (360 by 800 logical, dark palette, default text size). Nothing was run. No device, emulator, TalkBack, VoiceOver, keyboard, switch access or text-scale observation was made.

| Area | Status | Evidence |
|---|---|---|
| Typed form (Task 1) | Walked | Source; renders `opened`, `form_end` |
| Search results and amount step (Task 2) | Walked | Source; renders `search`, `amount` |
| Estimate a meal (Task 3) | Walked | Source; render `estimate`. The state before a maintenance estimate exists was walked from source only. |
| Editing an entry (Task 4) | Walked | Source; render `edit`. The render shows only an entry logged before amounts were recorded. Editing a typed entry with an amount and editing a calculated entry were walked from source only. |
| Saved foods: New food form | Walked from source only, as a branch of Task 1 | No render |
| Raw or cooked switch, cooking oil | Walked from source only, as a branch of Task 2 | No render (the fixture banana has neither) |
| Barcode scanning, typed digits | Surveyed | No render |
| Recipes and the ingredient adder, My foods list, label reader | Surveyed | No render |
| Food screen entry row, swipe to delete | Surveyed. Out of scope per the brief; read only as the entry to Task 4 | |

**Not inspected:** light and "martian" palettes; any text size above default; widths other than 360; landscape; `fmt.dart`, `meal_label.dart`, `meal_kind_label.dart`, `meal_size_label.dart`, `mm_fab.dart`, `mm_action_chip.dart`, the label-reader files; the HTML drawing `requirements/ui-ux-assets/views/add-food.html` (not needed and not the render); the body of the test files (test names only, by search).

**Blocked checks:** all runtime behaviour, including keyboard type shown, focus order, screen-reader output, sheet dismissal, and hint visibility. No findings in a surveyed area says nothing about its usability.

**Referrals:** product-designer (hierarchy of the opened sheet, position of the primary action); flutter (semantics, focus, keyboard actions); measurement and product (F-12, F-01 against MM-167); qa (renders and tests requested under Verification).

## Task walkthroughs

The person in each task is in their first week with the app, on a 360-wide phone, with a food database installed. Evidence is the source and the named render. Nothing here was observed with users.

### Task 1: log a packaged food by typing what its label says

Example label: "1 bar (40 g): 190 kcal, fat 7 g, carbs 22 g, protein 12 g". Two bars were eaten.

| # | What the person sees | Must decide or already know | Action | Sign it worked | Evidence | Result |
|---|---|---|---|---|---|---|
| 1.1 | "Add food" button on the Food screen | None | Tap | Sheet rises | `add_food_button.dart:15-18` | Pass |
| 1.2 | Title "Add food"; field "Search foods"; buttons "Scan", "Save/d", "Esti/mate"; recents chips; a field "Food"; then the form | Which of two empty text fields takes the product name. Nothing names the lower part as "type it yourself". | Tap "Food" and type the name | Text appears; label floats | render `opened`; `add_food_sheet_state.dart:436-442, 568-573` | Pass if "Food" is chosen. **Fails** if the name goes into "Search foods", the first field (F-02). Broken labels are MM-213. |
| 1.3 | "How was it measured?" with seven chips; "Label serving" is checked | That the default fits; no need to act | None | Check mark on "Label serving" | render `opened`; `add_food_sheet_state.dart:684-696` | Pass |
| 1.4 | "Servings eaten", prefilled 1 | How many servings were eaten | Type 2 | Field shows 2 | `add_food_sheet_state.dart:653-674` | Pass. The keyboard requested is the full text one (F-15). |
| 1.5 | "The numbers below are for": "Everything I ate" (selected) or "One serving" | That label numbers are per serving, that the default is not, and that "Servings eaten: 2" will not multiply anything unless "One serving" is chosen | Must tap "One serving" | If tapped: calories label becomes "Calories per serving" and a "Logs …" line appears near the button. If not tapped: nothing. | render `opened`; `add_food_sheet_state.dart:58, 159-187, 590-600, 699-711, 743` | **Fails** (F-01): the person cannot tell which value will be kept |
| 1.6 | "Protein g", "Carbs g", "Fat g" in one row | Reorder from the label's order (calories, fat, carbs, protein) | Type three numbers, tapping each field | Values shown | render `opened`; `add_food_sheet_state.dart:713-721` | Pass, with friction (F-15) |
| 1.7 | "Includes alcohol?" link, then "Calories" with "Leave blank to calculate from macros." Below the first screenful. | Scroll; type calories or leave blank | Type 190 or skip | If typed and far from the macros, a caution line appears. If left blank, the figure that will be kept is a hint that Flutter shows only while the field is focused. | renders `opened`, `form_end`; `add_food_sheet_state.dart:740-752` | Typed: pass. Left blank: **fails** (F-07) |
| 1.8 | Meal chips, one preselected by the clock | Whether the meal is right | Tap if not | Check mark moves | render `form_end`; `add_food_sheet_state.dart:114-119, 579-589` | Pass |
| 1.9 | "Log it", at the end of the scrolling form | Scroll to it. If it is grey, work out why. | Tap | Enabled only with a name, a valid amount and energy above zero | render `form_end` (disabled); `add_food_sheet_state.dart:189-196, 602-607` | Pass when valid. **Fails** when disabled for a missing name or missing energy: no reason is shown (F-08). Position: F-04. |
| 1.10 | Sheet closes; the Food screen is behind it | None | None | The hero figure changes and a row appears in its meal, reading for example "2 servings · totals entered by you" | `add_food_sheet_state.dart:343-344`; `portion_summary.dart:31-37` | Pass from source. Whether the new row is in view depends on scroll position; not verified. |

**Branch 1B, source only (no render): Saved, then New food.** This is the one form that states its basis in words ("Numbers for one serving", `custom_food_form_state.dart:252`).

| # | What the person sees | Must decide or already know | Action | Sign it worked | Evidence | Result |
|---|---|---|---|---|---|---|
| 1B.1 | A button reading "Save/d" at 360 wide | That "Saved" is where a label can be typed per serving | Tap | A screen titled "My foods" | `add_food_sheet_state.dart:459-466`; `my_foods_step_state.dart:64` | Weak: the button and the screen it opens have different names (F-14) |
| 1B.2 | "New food", "New recipe", "Back" | None | Tap "New food" | Form "Save your own food" | `my_foods_step_state.dart:96-103` | Pass |
| 1B.3 | "Name", "One serving is", "Weighs g", "Numbers for one serving", calories, optional barcode, "Save food" | That "Weighs g" is required; nothing says so | Fill in and save | "Save food" stays grey without a weight, with no reason shown | `custom_food_form_state.dart:149-157, 239-248, 288-293` | **Fails** when the weight is blank (F-08) |

### Task 2: find a food by searching and log how much was eaten

| # | What the person sees | Must decide or already know | Action | Sign it worked | Evidence | Result |
|---|---|---|---|---|---|---|
| 2.1 | "Search foods" at the top, not focused | None | Tap and type "chicken" | Rows appear as each letter is typed | render `search`; `add_food_sheet_state.dart:436-442` | Pass. One extra tap; the design direction says the field opens focused (F-17). |
| 2.2 | "Chicken and rice / Your recent food · 610 kcal"; "Chicken breast, raw / 120 kcal per 100 g / Food database · Reference"; the same for "cooked" | Which row. Raw and cooked are in the names. "Reference" is not explained anywhere in the sheet. | Tap a row | A database row opens the amount step. The recent row instead fills the long typed form. | render `search`; `food_search_results.dart:53-71`; `add_food_sheet_state.dart:511-516` | Database row: pass. "Reference": F-14. Recent row leads into F-01. |
| 2.3 | Food name, "Food database · Reference", chips "1 medium (118 g)" (checked), "Grams", "Ounces", "Palms", "Cupped hands", "Thumbs" | Which unit. The chips have no heading. Nothing says what a palm is. | Tap a chip or keep the first | Check mark moves; the amount resets to a default (1, 100 or 4) | render `amount`; `food_amount_step_state.dart:29-57, 101-105, 274-279, 309-319` | Pass for servings and weights. Hand units: F-12. |
| 2.4 | "How many servings" with "236 g" beneath, then "210 kcal · 3 g protein · 54 g carbs · 1 g fat" | How many | Type 2 | The gram line and the totals change as each digit is typed | render `amount`; `food_amount_step_state.dart:340-363` | Pass. This step shows clearly what will be kept. |
| 2.5 | Source only: for a food with a raw and cooked pair, logged by weight, "Weighed as" with two segments and a line comparing both | Which state was weighed. The step may open on the other state than the row tapped, because the last one logged is remembered (MM-151). | Tap a segment | The title, the selected segment and the comparison line change | `food_amount_step_state.dart:79-93, 304, 320-338` | Pass from source: the state is visible in three places. No render. |
| 2.6 | Source only: for a cooked generic food, "Cooked with oil?" No / 1 tsp / 1 tbsp | Whether oil was used | Tap | The segment is selected. The totals line does not change, yet a second entry "Cooking oil" will be logged. | `food_amount_step_state.dart:247-270, 356-382` | **Fails** (F-13): no sign of what the choice adds |
| 2.7 | Meal chips; "Log it" (filled, enabled); "Back to search" | None | Tap "Log it" | Sheet closes; the row reads for example "2 × 1 medium (236 g) · calculated from 89 kcal per 100 g" | render `amount`; `food_amount_step_state.dart:384-406`; `portion_summary.dart:18-37` | Pass. The primary action is on screen in this render. |

### Task 3: log a restaurant meal without knowing its numbers

| # | What the person sees | Must decide or already know | Action | Sign it worked | Evidence | Result |
|---|---|---|---|---|---|---|
| 3.1 | "Search foods"; "Scan", "Save/d", "Esti/mate" (fork-and-knife icon); recents; the typed form, which contains a chip also labelled "Estimate" | Which of four ways in fits a meal with no numbers. Two controls carry the word "Estimate". | Tap the "Estimate" button | Screen "Estimate a meal" | render `opened`; `add_food_sheet_state.dart:468-476`; `quantity_source_label.dart:11` | Pass if the button is chosen. **Fails** if the chip is chosen (F-03) or the dish name is typed into search (F-02). |
| 3.2 | "Estimate a meal", three sentences, "How big was it?" with four chips, each "Size · about N kcal"; "Regular" is checked | How big. The kcal figures help. Nothing says the sizes are scaled to the person. | Tap one | Check mark moves | render `estimate`; `estimate_meal_step_state.dart:66-97` | Pass |
| 3.2a | Source only: before the app has a maintenance estimate, a notice replaces the size chips and ends "Until then, enter the food by hand." The kind chips, name and meal chips are still shown and usable; "Log the estimate" is disabled. | That nothing on this screen can be logged | None possible | None | `estimate_meal_step_state.dart:61, 77-83, 132-137` | **Fails** for this task (F-09): the advice needs the numbers the person does not have |
| 3.3 | "What kind of meal?" with four chips with examples; "Balanced" is checked | Which kind | Tap one | Check mark moves. No protein, carbohydrate or fat figure is shown for the choice. | render `estimate`; `estimate_meal_step_state.dart:99-111` | Pass for choosing. The macros that will be kept are not shown before logging (F-04, second part). |
| 3.4 | "Name (optional)" | Whether to name it | Type or skip | Blank gives "Estimated meal (regular, balanced)" | `estimate_meal_step_state.dart:40-43, 113-118` | Pass |
| 3.5 | Meal chips. The render ends here with empty space beneath and nothing cut off. | That the screen continues, and that "Log the estimate" is below | Scroll | Button comes into view | render `estimate` (no button visible); `estimate_meal_step_state.dart:120-142` | **Fails** (F-04): the control is not on screen and nothing shows there is more |
| 3.6 | "Log the estimate", "Back" | None | Tap | Sheet closes; the row reads "Estimated totals" | `estimate_meal_step_state.dart:30-56`; `portion_summary.dart:14` | Pass from source |

### Task 4: correct an entry logged earlier today

| # | What the person sees | Must decide or already know | Action | Sign it worked | Evidence | Result |
|---|---|---|---|---|---|---|
| 4.1 | The entry's row on the Food screen, with no edit mark | That tapping the row opens it | Tap | Sheet "Edit food" | `meal_section.dart:144-149`; `food_entry_tile.dart:23-64` | Pass from source. The row is outside this run's scope; noted only. |
| 4.2 | "Edit food", then "‹ Today ›" in title-size type, the same control as the Food screen's day header | That this control moves the entry to another day rather than changing the day being viewed | Leave it | None | render `edit`; `add_food_sheet_state.dart:480-488`; `day_stepper.dart:25-46` | Pass if left alone. Its meaning is not stated (F-10). |
| 4.3a | Typed entry with totals (source only): the same form as Task 1, filled in | Which number is wrong. That Calories holds the earlier figure even if the app worked it out from the macros. | Change the protein figure | The field changes. Calories stays as it was. A caution line appears only if the gap exceeds the tolerance. | `add_food_sheet_state.dart:210-231, 198-208, 740-752` | Changing the number: pass. The calories kept: **fails** (F-07). |
| 4.3b | Entry typed as "One serving" (source only): name, one chip "Servings", "How many", "Enter the totals myself", meal chips, "Logs …". No protein, carbohydrate, fat or calorie fields. | That a wrong per-serving number can only be fixed through "Enter the totals myself", and then as totals for everything eaten | Tap that link, then retype totals | The typed form appears holding multiplied totals | `add_food_sheet_state.dart:84-88, 242-254, 758-822` | **Fails** (F-06): the control for the task is not found and the numbers typed are not the ones shown |
| 4.3c | Entry from search (source only): unit chips, "How many" or "Amount", "Logs …" | The new amount | Type it | The "Logs …" line changes as typed | `add_food_sheet_state.dart:758-815, 590-600` | Pass from source |
| 4.3d | Entry logged before amounts were recorded: "Weighed" is checked, and a notice says "Choose how it was measured to add one." | That tapping the already-checked chip is how to add an amount | Tap a chip, or ignore | An amount field appears | render `edit`; `add_food_sheet_state.dart:614-622, 233-239` | Correcting numbers: pass. The notice contradicts the checked chip (F-11). |
| 4.4 | "Save changes" at the end of the form; meal chips are cut off at the bottom of the render | Scroll | Tap | Sheet closes; the row shows the new numbers | render `edit`; `add_food_sheet_state.dart:602-607` | Pass. The cut-off chips show there is more. |
| 4.5 | To leave without saving: a drag handle and nothing else. The sheet fills the whole render. | That dragging the handle or the system back action closes it | Drag or back | Sheet closes; changes are dropped with no message | render `edit`, `opened`; `add_food_sheet_state.dart:824-832` | **Fails** (F-05): no visible control |

## Findings

All findings are from source inspection and the renders. None was reproduced at runtime. Each "what would have to be true" states a condition, not a design.

### F-01: The default basis and the amount field together log the wrong total for a typed label (ux-accessibility; product for MM-167)

- **Classification:** usability problem found by inspection. **Severity:** high. **Confidence:** high for the behaviour (read in source and covered by the test "typed totals are never multiplied by the servings"); medium for the judgement that it will be missed.
- **Step:** 1.5; also reached at 2.2 through a recent food.
- **Observed:**
  - The form opens on "Everything I ate" (`add_food_sheet_state.dart:58, 701-709`).
  - Directly above it, "Servings eaten" invites a count (`add_food_sheet_state.dart:653-674`).
  - With the default, the count is stored but multiplies nothing (`add_food_sheet_state.dart:172-186`).
  - The "Logs …" line is shown only on the other basis (`add_food_sheet_state.dart:590-591`).
  - So a person who types the label's numbers and "2" logs half of what was eaten, with no error and no total shown.
  - Tapping a recent food sets the basis to typed totals and keeps the amount (`add_food_sheet_state.dart:220-225`), so changing "2" to "1" there changes nothing either.
- **Expected for the step to pass:** before "Log it", the screen shows the totals that will be logged in every basis, or the amount field cannot be read as a multiplier when it is not one.
- **Severity reasoning:** met on every typed label; silent when missed; recurs each time. MM-38 calls this route "the fallback that must always work".
- **Where a change would have to be made:** MM-167 decision 3 and its scenario "Totals that are not multiplied again" ask for exactly this default. The requirement does not make the step pass.
- **Verification:** source inspection; render `opened` shows the two controls stacked.

### F-02: Typing in the search field removes every other way in (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** medium. **Confidence:** high.
- **Steps:** 1.2, 3.1.
- **Observed:**
  - Any text in "Search foods" hides Scan, Saved and Estimate (`add_food_sheet_state.dart:443`) and replaces the recents and the typed form with results (`add_food_sheet_state.dart:489-542`).
  - When there are results, no "Enter manually" is offered (`food_search_results.dart:53-71`; render `search`).
  - When there are none, the only offer is "Enter manually" (`food_search_results.dart:30-51`), which needs numbers.
  - The only way back to the form or to Estimate is to delete the search text. Nothing says so.
- **Impact:** a person who starts by typing a product or a restaurant dish, and does not find it among the results, has no visible next step.
- **Expected for the step to pass:** from the results, with or without matches, the person can see how to reach the typed form and the estimate.
- **Requirement note:** MM-42 says the typed form "remains, reachable as Enter manually"; its scenario covers only the nothing-found case.
- **Verification:** source and render `search`. The no-results state has no render.

### F-03: "Estimate" names two different controls on the same screen (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** medium. **Confidence:** high.
- **Step:** 3.1.
- **Observed:** the route button "Estimate" opens the size-and-kind step (`add_food_sheet_state.dart:468-476`). The chip "Estimate" under "How was it measured?" (`quantity_source_label.dart:11`) instead shows "Enter calories and macros for everything you ate." (`add_food_sheet_state.dart:624-631`). Both are in render `opened`; the button's label is broken across two lines (MM-213) and the chip's is whole.
- **Impact:** a person with no numbers who taps the chip is asked for numbers and is not pointed to the other control.
- **Expected for the step to pass:** the two controls have different names, or the chip's state points to the estimate step.
- **Verification:** source and render.

### F-04: The primary action is below the first screenful, and on the estimate step nothing shows it is there (ux-accessibility; product-designer)

- **Classification:** usability problem found by inspection. **Severity:** medium. **Confidence:** high for the 360 by 800 render; unknown for other sizes.
- **Steps:** 3.5; also 1.9 and 4.4.
- **Observed:**
  - Render `estimate` ends after the meal chips, with blank space and no cut-off element. "Log the estimate" and "Back" follow in the scroll (`estimate_meal_step_state.dart:131-142`).
  - In `opened` and `edit` the button is also off screen, but a cut-off field or chip row shows the form continues.
  - The button is the last child of a scrolling column in every step (`add_food_sheet_state.dart:824-832`). No step pins it.
  - The estimate step shows calories in the size chip but no macros before logging (`estimate_meal_step_state.dart:85-111`).
- **Design rule:** `design/interaction-and-motion.md:83-84` (frequent actions in thumb reach: "the sheet's primary bar"); `design/screen-direction.md:129-132`.
- **Expected for the step to pass:** on a 360 by 800 screen the action that completes each step is visible, or something visibly continues past the bottom edge.
- **Limit:** the render has no system bars and no keyboard; a real phone has less room.

### F-05: No visible way to close the sheet or abandon an edit (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** medium. **Confidence:** medium (the absence of a control is certain; how the sheet dismisses was not run).
- **Step:** 4.5; also the main Add food form.
- **Observed:** the main form and the edit form have no Close, Cancel or Back control (`add_food_sheet_state.dart:429-545, 561-609`); the sub-steps do. Renders `opened` and `edit` show the sheet filling the full height, so no dimmed area is left to tap. The body scrolls, so a drag on it scrolls rather than closes.
- **Design rule:** `design/interaction-and-motion.md:48-49`: sheets "are dismissible by drag, back, and a visible close action".
- **Expected for the step to pass:** a visible control leaves the sheet without logging or saving.
- **Verification needed:** an emulator check of handle drag and back, and a TalkBack check of how the sheet is dismissed.

### F-06: An entry typed per serving cannot have its numbers corrected where they were typed (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** medium. **Confidence:** medium-high (source and the test name "an entry logged by serving is restored as logged"; no render).
- **Step:** 4.3b.
- **Observed:** such an entry reopens as a calculated entry (`add_food_sheet_state.dart:84-88`). The form then has one chip, an amount field and "Enter the totals myself" (`add_food_sheet_state.dart:758-822`). The per-serving protein, carbohydrate, fat and calories the person typed are not shown. Tapping the link fills the fields with totals already multiplied (`add_food_sheet_state.dart:242-254`) and cannot be undone except by leaving the sheet.
- **Impact:** MM-48's own scenario (51 g of protein that should be 15 g) needs the person to find a link that does not name the task, then work out totals by hand.
- **Expected for the step to pass:** an entry typed per serving can have its per-serving numbers seen and changed.
- **Verification needed:** a render of this state.

### F-07: The calories that will be kept are not evident (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** medium. **Confidence:** high for the edit case; medium for the blank-field case, which rests on how Flutter shows a hint beside a label and was not rendered.
- **Steps:** 1.7, 4.3a.
- **Observed:**
  - *Adding with Calories blank:* the figure from the macros is supplied only as the field's hint (`add_food_sheet_state.dart:745`). With a label present, the hint shows only while the field is focused. No "Logs …" line exists on the default basis (`add_food_sheet_state.dart:590-591`).
  - *Editing:* the stored calories are written into the field whether they were typed or calculated (`add_food_sheet_state.dart:214`). After a macro is corrected they stay. A caution appears only past the tolerance, reads "Double-check the label", and replaces "Leave blank to calculate from macros." (`add_food_sheet_state.dart:746-749`).
  - Render `edit` agrees with this reading: 48, 70 and 12 g make 580 kcal against 610 stored, inside the tolerance, and no caution is shown.
- **Expected for the step to pass:** the person can see, without focusing a field, the calories that will be saved, and can tell a typed figure from a calculated one after an edit.
- **Verification needed:** a render of the form with macros typed and Calories blank and unfocused.

### F-08: A disabled "Log it" or "Save food" does not say what is missing (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** medium. **Confidence:** high.
- **Steps:** 1.9, 1B.3.
- **Observed:**
  - "Log it" needs a name, a valid amount and energy above zero (`add_food_sheet_state.dart:189-196`). Only the amount has a line saying so (`add_food_sheet_state.dart:667-672`).
  - In render `form_end` the name field has scrolled off while the grey button is in view.
  - "Save food" also needs a serving weight (`custom_food_form_state.dart:153`), and the "Weighs g" field carries no "required" mark or message (`custom_food_form_state.dart:239-248`). A drink labelled only by volume cannot be saved, and nothing says why.
- **Expected for the step to pass:** beside a disabled primary action, or at each empty required field, the screen says what is still needed.

### F-09: Estimate cannot be used before a maintenance estimate exists, and sends the person to the route they cannot use (ux-accessibility; product for how often)

- **Classification:** usability problem found by inspection. **Severity:** medium, depending on a fact I could not establish: how long a first-week person is in this state. **Confidence:** high for the behaviour; no render.
- **Step:** 3.2a.
- **Observed:** with no maintenance figure, the size chips are replaced by a notice ending "Until then, enter the food by hand." (`estimate_meal_step_state.dart:77-83`). The button is disabled (`estimate_meal_step_state.dart:136`). The kind chips, name field and meal chips remain usable (`estimate_meal_step_state.dart:99-130`).
- **Impact:** the task is "without knowing its numbers", so the advice cannot be followed. Controls that cannot lead anywhere stay live.
- **Expected for the step to pass:** a person in this state can still log a rough meal, or the screen offers only what can be acted on.
- **Verification needed:** when the coach's maintenance figure first exists for a new user, and a render of this state.

### F-10: The day control in the edit sheet is unlabelled and identical to the Food screen's day header (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** low. **Confidence:** medium.
- **Step:** 4.2.
- **Observed:** "‹ Today ›" in title-size type sits under "Edit food" with no caption (`add_food_sheet_state.dart:480-488`; render `edit`). The same control and tooltips ("Previous day", "Next day", `day_stepper.dart:28-44`) serve the Food screen's header (render `search`, top). Here it moves the entry; after saving, the entry leaves today's list with no message.
- **Expected for the step to pass:** the control says it is the entry's day, in sight and to a screen reader.

### F-11: The notice on an old entry tells the person to choose a method while one is shown chosen (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** low (met only on entries from before amounts were recorded, which a new user will not have). **Confidence:** medium; whether tapping the checked chip responds was not run.
- **Step:** 4.3d.
- **Observed:** render `edit` shows "Weighed" checked and "This entry was logged without an amount. Choose how it was measured to add one." (`add_food_sheet_state.dart:614-622`). Adding an amount for a weighed entry means tapping the chip that is already checked (`add_food_sheet_state.dart:233-239`).
- **Expected for the step to pass:** the instruction matches what the person must do.

### F-12: A hand portion of a found food is presented as exact (measurement; ux-accessibility for wording)

- **Classification:** confirmed requirement violation, by source inspection. **Severity:** low. **Confidence:** medium (MM-46 is in progress and its Progress section does not list this as unbuilt).
- **Step:** 2.3.
- **Requirement:** MM-46 Description: "The app shows the grams and macros it will record." MM-167 scenario "2 cupped handfuls as an estimated portion": "the amount is never presented as exact"; its example summary is "2 cupped hands, estimated". `design/voice-and-wording.md` rule 3.
- **Observed:**
  - The amount step shows the gram line only for a serving (`food_amount_step_state.dart:347-351`), so palms, cupped hands and thumbs show totals with no weight and no word that they are an estimate.
  - The logged row for such an entry reads as an amount, a gram weight in brackets and "calculated from N kcal per 100 g" (`portion_summary.dart:23-37`). "Estimated" appears only for hand portions with typed totals (`portion_summary.dart:32-33`).
- **Verification:** source only. A render of the amount step with "Palms" selected, and of the resulting row, would confirm it.

### F-13: The cooking-oil choice adds an entry the step never shows (ux-accessibility)

- **Classification:** usability problem found by inspection. **Severity:** low. **Confidence:** medium (source only; the fixture render has no cooked food).
- **Step:** 2.6.
- **Observed:** choosing "1 tsp" or "1 tbsp" logs a second entry, "Cooking oil" (`food_amount_step_state.dart:247-270`). The totals line above reflects only the food (`food_amount_step_state.dart:356-363`), and the segments carry no calories (`food_amount_step_state.dart:372-381`).
- **Expected for the step to pass:** the step shows what the oil choice will add before "Log it".

### F-14: Three words a newcomer has to guess (ux-accessibility)

- **Classification:** design/usability improvement. **Severity:** low. **Confidence:** medium.
- **Observed:**
  - "Reference" follows the source on every database row and on the amount step (`food_trust_mark.dart:24-36`; `trust_tier_label.dart:7`; renders `search`, `amount`). Only "Check this" carries a reason; no legend is in the sheet.
  - The button "Saved" opens a screen titled "My foods" (`add_food_sheet_state.dart:462`; `my_foods_step_state.dart:64`).
  - The basis reads "Everything I ate" on the control (`add_food_sheet_state.dart:704`) and "Everything you ate" as plain text (`add_food_sheet_state.dart:711`).
- **Rule:** `design/voice-and-wording.md` glossary: "One term for one thing, used everywhere."

### F-15: Input friction in the typed form (ux-accessibility; flutter)

- **Classification:** design/usability improvement. **Severity:** low. **Confidence:** medium (source only; keyboards were not seen).
- **Observed:**
  - Amount fields ask for the full text keyboard (`mm_text_field.dart:42`), so that fractions can be typed (MM-167 decision 6). Nothing on screen says fractions are accepted.
  - No field sets a keyboard action or a submit handler (searched `food/` for `textInputAction` and `onSubmitted`: none), so moving through protein, carbs, fat and calories takes a tap on each.
  - The fields run protein, carbs, fat, then calories after a link (`add_food_sheet_state.dart:713-752`). The example label in Task 1 runs calories first.
  - The recents row is fixed at 40 high (`add_food_sheet_state.dart:528`), under the 48 dp minimum in `design/interaction-and-motion.md:83`. In render `opened` the chips draw about 33 dp tall.

### F-16: Screen-reader, focus and large-text behaviour of the sheet is unverified (ux-accessibility; flutter)

- **Classification:** unverified hypothesis requiring investigation. It needs an assistive-technology run, not observed users. **Severity:** medium if confirmed. **Confidence:** low.
- **Basis:** `food/` contains no `Semantics` widget and no live region (searched). The following therefore rest on component defaults I could not observe:
  - whether the changing totals line and the validation line are announced while an amount is typed (`food_amount_step_state.dart:347-363`);
  - where focus lands when the sheet's content is swapped between steps (`add_food_sheet_state.dart:353-422`);
  - whether the chip groups are announced with their question, and the meal chips with any name at all (they have no visible heading either, `add_food_sheet_state.dart:579-589`);
  - whether the three macro fields in one row, the recents row fixed at 40 high, and the one-row route buttons survive the largest text size. MM-213 already shows the buttons failing at default size.
- **Request to the chair:** a TalkBack pass over Tasks 1 and 2, and renders of `opened` and `amount` at the largest supported text size.

### F-17: The design direction for the Add sheet does not describe the sheet that is built (ux-accessibility; product-designer)

- **Classification:** documentation or requirement gap. **Severity:** low. **Confidence:** high.
- **Observed:** `design/screen-direction.md:129-143` describes:
  - a focused search field;
  - a segmented set of Search, Scan and Quick add, with Recent as the default list;
  - a primary "Add" bar shown only when a food is selected;
  - Quick add as four fields;
  - barcode scanning as a full-screen camera.

  The built sheet has:
  - an unfocused search field (`mm_text_field.dart:36-59` sets no autofocus);
  - three buttons, Scan, Saved and Estimate;
  - the whole typed form inline, with up to seven method chips;
  - a 220-high camera inside the sheet (`mobile_scanner_view_state.dart:49-50`).
- **Impact:** a reviewer or builder cannot use the direction to judge this sheet; findings F-04 and F-05 lean on rules the sheet was not built to.

### Already ticketed, confirmed here

MM-213: render `opened` shows "Save/d" and "Esti/mate". It bears on steps 1B.1 and 3.1. No new finding.

### Passing, for the record

- The amount step (2.3, 2.4, 2.7) passes: live totals, a gram line for servings, the action on screen.
- Method chips, meal chips and segments show selection with a check mark as well as colour.
- The caution line and the "Check this" mark carry words, not colour alone.
- **Contrast, calculated from token values in `mm_colors.dart:129-155`, not measured on a device:**
  - tertiary text `#8F9BB5` on the sheet `#171F32` is about 5.9:1;
  - accent text `#FF6A45` on the sheet is about 5.8:1.

  Dark palette only.

## Sources and evidence

None. No external source was consulted. All evidence is the repository source, requirement and design files listed under Scope, and the six renders.

## Research

Status: unnecessary.

- **Question considered:** whether any finding rests on a platform convention.
- **Outcome:** none does. Where a finding depends on framework behaviour I did not see (hint visibility in F-07, the keyboard shown in F-15, sheet dismissal in F-05, tapping a checked chip in F-11), it is marked as unverified at runtime and a render or emulator check is requested. No convention is asserted.
- **Tools:** web search and fetch were available to this session and were not used.

## Confidence and limitations

- **Overall confidence:** medium-high that the behaviours described are what the source does; medium that each failing step would stop or mislead a newcomer. That is an analytical judgement and measures nothing about how many people would fail.
- **Renders:** one palette, one size, default text, no keyboard, no system bars. The `edit` render shows only the old-entry state, which a first-week user would not meet. The states that person would meet (4.3a, 4.3b, 4.3c) have no render.
- **Render artefact:** in `amount`, a text-selection handle overlaps the "236 g" line. I treated it as an artefact of the test having focus, not a finding.
- **Not checked:** what happens if saving fails. `_save` and `_log` await the write with no error path visible in these files (`add_food_sheet_state.dart:321-345`; `food_amount_step_state.dart:209-272`). I could not determine what the person would see.
- **Feedback after logging:** I found no haptic call in `food/` (searched), although `design/interaction-and-motion.md:33-36` describes one. I did not raise it as a finding, because feedback after logging could not be observed.
- **Other limits:** hashes not computed; commit not independently confirmed. Single reviewer, single pass; no self-review beyond re-reading cited lines.

## Acceptance criteria and edge cases

**Existing criteria traced:**

| Criterion | Status against the built screen |
|---|---|
| MM-167 "Totals that are not multiplied again" | Met as written (test "typed totals are never multiplied by the servings"); it is the source of F-01 |
| MM-167 "The basis is stated" | Met in words (`add_food_sheet_state.dart:699-711`); F-01 concerns whether stating it is enough |
| MM-167 "2 cupped handfuls … never presented as exact" | Not met for found foods (F-12) |
| MM-167 "Editing restores the portion" | Met in a form that hides the typed numbers (F-06) |
| MM-42 "Nothing found" | Offers manual entry only; "scan its label" is recorded there as not done |
| MM-48 "Fixing a number" | Has a test (`food_edit_test.dart:44`); F-06 and F-07 are states it does not cover |
| MM-213 | Open; its test is skipped |

**Proposed criteria (not approved; conditions, not designs):**

1. With typed numbers on any basis, the totals that will be logged are visible before "Log it" (F-01, F-07).
2. From search results, with or without matches, the typed form and the estimate are reachable by a visible control (F-02).
3. No two controls on one screen share a name while doing different things (F-03).
4. At 360 by 800 and default text size, each step's completing action is visible, or content visibly continues past the edge (F-04).
5. Every state of the sheet has a visible control that leaves without saving (F-05).
6. A disabled primary action is accompanied by what is missing (F-08).

**Edge cases to cover when any of this is taken up:**

- Servings of 0.5 and 1.5 under each basis.
- A recent food reopened with its amount changed.
- A label stated only in millilitres on the saved-food form.
- An estimate before the first maintenance figure.
- An entry moved to another day from the edit sheet.
- The largest text size and a narrower phone.
- The keyboard open over the form.
- An entry edited after its calories were calculated rather than typed.

## Dependencies

- **product:** F-01 and F-06 touch MM-167 decisions 3 and 5; F-09 needs to know when a maintenance figure first exists. Challenge: is "Everything I ate" still the right default once the amount field sits above it?
- **product-designer:** F-04, F-05, F-17. Challenge: does the direction in `design/screen-direction.md:129-143` still stand, or does the built sheet replace it?
- **measurement:** F-12. Challenge: is a hand portion of a found food "calculated" or "estimated" in the row's wording?
- **flutter:** F-15, F-16 and the framework behaviours named under Research.
- **qa:** the renders and runs listed under Verification.

## Safety concerns

None found within this scope and method; this is not clinical clearance.

One item is adjacent: F-01 and F-07 can put intake figures into the log that differ from what was eaten without the person knowing, and the coach reads those figures. Whether that matters to any safeguard is for the measurement and safety roles, which this run omitted.

## Unresolved product decisions

1. **Default basis for typed numbers (F-01).** Alternatives: keep "Everything I ate" and show the logged totals; change the default under Label serving; ask each time. Impact: every typed label. Authority: product owner, since MM-167 decision 3 is theirs.
2. **Estimate before a maintenance figure (F-09).** Alternatives: keep it unavailable; offer unscaled sizes; hide the route until it can be used. Authority: product owner (MM-150).
3. **Which document describes the Add sheet (F-17).** Alternatives: bring `design/screen-direction.md` up to the built sheet, or treat the built sheet as departing from it. Authority: product owner with the product designer.

## Verification

- **Run by me:** nothing. Read-only; no commands.
- **Inspected:** the source, requirement and design files under Scope; six renders; test names (not bodies) in `food_edit_test.dart`, `food_portion_test.dart`, `food_search_test.dart`, `estimate_meal_test.dart`, `food_flows_test.dart`; and `apps/mobile/test/add_food_route_labels_test.dart` in full (skipped, per MM-213).
- **Requested of the chair or edit owner (recommendations, not executions):**
  1. Renders at 360 by 800:
     - the typed form with macros filled and Calories blank and unfocused (F-07);
     - editing an entry typed as "One serving" (F-06);
     - editing an entry from search (4.3c);
     - the estimate step with no maintenance figure (F-09);
     - search with no results (F-02);
     - the amount step for a cooked food with a pair, and with "Palms" selected (F-12, F-13).
  2. Renders of `opened` and `amount` at the largest supported text size (F-16).
  3. An emulator check of how the full-height sheet is dismissed (F-05).
  4. A TalkBack pass over Tasks 1 and 2 (F-16).
  5. A widget test that types a per-serving label with two servings on the default basis and asserts what is logged, to pin the F-01 behaviour whichever way the owner decides.

## Targeted challenges

None.

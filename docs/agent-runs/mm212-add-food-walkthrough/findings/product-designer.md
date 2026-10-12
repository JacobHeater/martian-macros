# Review: product-designer

## Scope and traceability

- **Role:** Product designer (`agents/roles/product-designer.md`), a review lens, not a credential.
- **Reviewer identity:** read-only subagent of chair session `9c9d02ab` (Claude Code, model `claude-opus-5-5`), run `mm212-add-food-walkthrough`, 2026-10-11. I was shown no other reviewer's report and did not look for one.
- **Brief:** `C:\Users\jacob\dev\martian-macros\docs\agent-runs\mm212-add-food-walkthrough\brief.md`.
- **Commit:** `feature/mm212-usability-by-inspection` at `ca3ff57`, as the brief and git status state. I could not confirm it myself (no shell).
- **Input hashes:** not computed (no shell). The brief says they are in `state.json`; I did not open that file.
- **Requirement files read in full:**
  - `requirements/food-logging/STORY.log-food-by-macros.MM-38.md`
  - `requirements/food-logging/STORY.search-the-food-database.MM-42.md`
  - `requirements/food-logging/STORY.edit-a-logged-entry.MM-48.md`
  - `requirements/food-logging/STORY.estimated-meal-entry.MM-150.md`
  - `requirements/food-logging/STORY.record-quantity-unit-and-nutrition-basis.MM-167.md`
  - `requirements/food-database/STORY.food-data-trust-indicators.MM-153.md`
  - `requirements/food-logging/BUG.add-food-route-labels-break-mid-word.MM-213.md` (uncommitted, proposed)
- **Requirement files located but not read:** MM-39, MM-43, MM-44, MM-45, MM-46, MM-151.
- **Design inputs read in full:** `design/screen-direction.md`, `design/ux-architecture.md`, `design/interaction-and-motion.md`, `design/voice-and-wording.md`, `design/visual-language.md`.
- **Renders read** (each 720 x 1600 px, which is 360 x 800 logical at 2x, dark palette), all under `apps/mobile/test/goldens/images/`:
  - `add_food_opened_dark.png`
  - `add_food_form_end_dark.png`
  - `add_food_search_dark.png`
  - `add_food_amount_dark.png`
  - `add_food_estimate_dark.png`
  - `add_food_edit_dark.png`
- **Test that produced them:** `apps/mobile/test/goldens/screen_goldens_test.dart:573-654`, with its seed at lines 53-72.
- **Source read:**
  - Under `apps/mobile/lib/src/food/`: `add_food_sheet_state.dart`, `food_amount_step_state.dart`, `food_search_results.dart`, `food_trust_mark.dart`, `amount_choice.dart`, `food_entry_tile.dart`, `meal_section.dart`, `food_screen.dart`, `show_add_food_sheet.dart`, `add_food_button.dart`, `estimate/estimate_meal_step_state.dart`, `scan/barcode_scan_step_state.dart`, `custom/my_foods_step_state.dart`, `custom/custom_food_form_state.dart`, `custom/recipe_form_state.dart`.
  - Under `apps/mobile/lib/src/format/`: `quantity_source_label.dart`, `portion_unit_label.dart`, `portion_summary.dart`, `trust_tier_label.dart`, `food_source_label.dart`.
  - Under `apps/mobile/lib/src/ui/`: `mm_button.dart`, `mm_choice_chip.dart`, `mm_action_chip.dart`, `mm_text_field.dart`, `mm_segmented.dart`, `mm_list_row.dart`, `notice.dart`, `day_stepper.dart`.
  - Under `apps/mobile/lib/src/theme/`: `mm_theme.dart`, `mm_type.dart`.
  - `packages/domain/lib/src/food/portion/units_offered.dart`.

## Existing facts versus proposals

**Repository facts (source and renders)**

- The sheet is one scroll view with no pinned footer; the primary button is the last child of the scrolled column (`add_food_sheet_state.dart:602-607`, `824-832`).
- A new typed entry starts on method "Label serving", amount "1", and basis "entered totals" (`add_food_sheet_state.dart:52-58`).
- The "Logs N kcal ..." line is drawn only when the basis is "One serving" or the entry is calculated from a food (`add_food_sheet_state.dart:590-600`).
- Typing in the search field replaces the route buttons, the recents and the whole form with results (`add_food_sheet_state.dart:443`, `489-542`).
- A recent food tapped from results fills the typed form with basis "entered totals" (`add_food_sheet_state.dart:511-516`, `210-231`). A database food opens the amount step (`:517-519`, `354-367`).
- An entry whose stored basis is calculated and has a reference reopens in the calculated layout, which has no macro fields (`add_food_sheet_state.dart:84-88`, `574-577`, `758-822`).
- The entry in the edit render has no portion, so it shows the legacy state (`screen_goldens_test.dart:58-71`; `add_food_sheet_state.dart:79-83`, `614-623`).
- Text buttons and the selected segment are Ember by theme (`mm_theme.dart:139-146`, `171-179`). A selected chip is not (`mm_theme.dart:180-185`).

**Approved requirements**

- MM-167 owner decision 3: the manual form's default basis is "For everything you ate", with a one-tap switch to per serving (`STORY...MM-167.md:217-218`).
- MM-167 section 5: editing restores the portion and "shows the same controls as when the entry was logged" (`:106-108`).
- MM-48: "Fixing a number" scenario (`STORY...MM-48.md:21-24`).
- MM-150: the Estimate step's two questions and optional name.
- MM-213 (proposed, uncommitted): Saved and Estimate break mid-word.

**Design direction (a design document, not a ticket)**

- `design/screen-direction.md:125-143` (Food logging flows).
- `design/interaction-and-motion.md:48-49` (a sheet has a visible close action) and `:84` (frequent actions in thumb reach, "the sheet's primary bar").
- `design/visual-language.md:104-105` ("Ember is for actions") and `:128-134` (one strongest element per view).
- `design/voice-and-wording.md:27` ("One term for one thing, used everywhere").

**Proposals:** only the "what would have to be true" lines under each finding and the proposed criteria further down. No redesign is proposed.

## Audit coverage

Mode: **feature**. Every step record below is analytical: it comes from the source and the named render, with no users observed and nothing run.

| Area | Status | Evidence |
|---|---|---|
| Add food sheet as it opens, typed form | **walked** | render `add_food_opened_dark`, `add_food_form_end_dark`; source |
| Search results | **walked** | render `add_food_search_dark`; source |
| Amount step for a database food, serving unit | **walked** | render `add_food_amount_dark`; source |
| Amount step: weight units, "Weighed as" raw/cooked, "Cooked with oil?", rounded-to-zero notice, "Check this" tier | **surveyed** | source only (`food_amount_step_state.dart:320-382`); no render |
| Estimate a meal, maintenance known | **walked** | render `add_food_estimate_dark`; source |
| Estimate a meal, maintenance not yet known | **walked from source only** | `estimate_meal_step_state.dart:77-83`, `136`; no render |
| Edit, legacy entry | **walked** | render `add_food_edit_dark`; source |
| Edit, typed / calculated / estimate entries | **walked from source only** | no render (see limitations: these are the states the brief's person would actually meet) |
| Barcode scan step | **surveyed** | source only; camera view files not opened |
| Saved foods list, custom food form, recipe form | **surveyed** | source only; `recipe_ingredient_adder*` not opened |
| Label reader | **surveyed** | source only (`custom_food_form_state.dart:71-117`); `label/*` not opened |
| Nothing-found and no-database states | **surveyed** | `food_search_results.dart:30-52`; no render |
| Light and Martian palettes; larger text sizes; keyboard open | **not inspected** | no render supplied |
| Food screen list (where Task 4 starts) | **out of scope** per brief | `meal_section.dart:134-151` read only to find the entry point |
| `requirements/ui-ux-assets/views/add-food.html` | **not opened** | a drawing, not the render; MM-211 fidelity check not done here |

No findings in a surveyed area says nothing about its usability.

### Task walkthroughs

The person in every task: in their first week with the app, 360-wide phone, a food database installed. Positions are logical pixels (render pixels divided by 2).

#### Task 1. Log a packaged food by typing what its label says

Render and source both available. **Walked.**

1. **Open the sheet. FAILS (PD-02; MM-213 seen here).**
   - Sees: title "Add food"; a "Search foods" field; three outlined buttons reading "Scan", "Save / d", "Esti / mate"; an unlabeled row of chips ("Greek yogurt", "Chicken and rice", "Oats" cut by the right edge); a "Food" field; "How was it measured?" with seven chips on three rows; "Servings eaten 1"; "The numbers below are for" with a two-part control; three number fields; "Includes alcohol?" in Ember; the top edge of one more field at the bottom (render `add_food_opened_dark`).
   - Must decide: which of five stacked kinds of control starts "type what the label says". Nothing says so.
   - "Search foods" (y about 130) and "Food" (y about 305) are the same component, with the same fill, border, height and placeholder style; only the word differs (`add_food_sheet_state.dart:437-442`, `568-573`).
   - No heading or gap separates "find it" from "type it"; the gaps are 8 to 12 throughout (`:435`, `:445`, `:527`, `:567`).
2. **Name the food. FAILS for the person who types in the first field (PD-02).**
   - Action: type the product name in "Food".
   - Feedback in "Food": the placeholder floats up to become the label.
   - If typed in "Search foods" instead: the buttons, the recents and the entire form are replaced by results (`:443`, `:489-524`). The way back is "Enter manually", which appears only when nothing matches (`food_search_results.dart:30-48`), or clearing the field.
3. **"How was it measured?" Passes.**
   - "Label serving" is preselected with a check and a filled chip (`:53`; render). No action is needed.
   - Cost: the block takes about 150 of the first 800 vertical pixels (y 345 to 500) before any number can be typed.
4. **"Servings eaten". Passes as a field.** It holds "1" with a floating label (`:52`, `:657`; render y 520-573).
5. **"The numbers below are for: Everything I ate | One serving". FAILS (PD-01).**
   - "Everything I ate" is preselected (`:58`).
   - A label states its numbers per serving, and the method chip two groups above says "Label serving", but the default basis is the opposite.
   - In the default state no line says what will be logged; "Logs ..." is drawn only for "One serving" (`:590-600`).
   - With "Servings eaten" at 2 and the label's numbers typed, the entry keeps the typed numbers unscaled (`:186`, `:302-308`). No element on screen says the 2 is ignored.
   - The person cannot tell which value will be kept.
6. **Type protein, carbs, fat. Passes.**
   - Three equal fields with the unit in the label (`:713-721`).
   - The fields do not change label with the basis; only the calories label becomes "Calories per serving" (`:743`).
7. **Calories. Passes, with an ordering cost (PD-10).**
   - At first paint the field is cut by the fold (render `add_food_opened_dark`, bottom edge).
   - It comes last, after an Ember "Includes alcohol?" button (`:734-739`) that separates it from the other three numbers.
   - The FDA sample label puts calories directly after serving information, then Total Fat ... Total Carbohydrate ... Protein (see Sources). The person therefore transcribes in a different order from the one printed.
   - "Leave blank to calculate from macros." is present (render `add_food_form_end_dark`).
8. **Meal. Passes.**
   - Four chips, one preselected by the clock (`:114-119`, `:579-589`; render).
   - The group has no heading, unlike the two groups above it; "Snacks" wraps alone onto a second row.
9. **"Log it". FAILS (PD-03).**
   - It is not on screen when the sheet opens. It is reached after about 240 of scrolling: the two renders share the "Servings eaten" field at y 520 and y 278.
   - When it is in view, the "Food" field is cut off at the top (render `add_food_form_end_dark`, y 64-90).
   - Disabled, it is a grey slab with no line saying what is missing (`:606`; render y 736-784).
   - A missing name has no helper line at all (`:568-573`).
10. **Result. Not assessed from my remit.** The sheet closes (`:344`); there is no render of the list afterwards.

#### Task 2. Find a food by searching and log how much was eaten

Render and source both available. **Walked.**

1. **Find the search field. Passes.** It is the first control under the title (render `add_food_opened_dark`; `:437-442`).
2. **Type "chicken". Passes for finding a result.**
   - The sheet shrinks to its content and the form disappears (render `add_food_search_dark`).
   - Results are three rows with no dividers.
   - "Chicken and rice / Your recent food · 610 kcal": 610 is what was logged that time.
   - "Chicken breast, raw / 120 kcal per 100 g / Food database · Reference" and the cooked row: 120 is per 100 g.
   - Both bases are said in words, so the two energies can be told apart.
   - The mark "Reference" is not explained on this screen or the next (`food_trust_mark.dart:24-41` explains only "Check this"). No decision in this task depends on it; referred to UX.
3. **Tap a row. FAILS at the recent row (PD-06).**
   - The recent row sits first and is the same row component as the database rows.
   - Tapping it does not open the amount step. It fills the long typed form and clears the search (`:511-516`, `:210-231`).
   - On that form, changing the amount does not change the numbers (basis is set to entered totals, `:220`), and no line says what will be logged.
   - Tapping a database row opens the amount step (`:517-519`), where the opposite is true.
   - Nothing in the results distinguishes the two outcomes.
4. **Amount step: say what the food is. Passes.** "Banana" in title type with "Food database · Reference" under it (render `add_food_amount_dark`; `food_amount_step_state.dart:304-307`).
5. **Choose a unit. Passes on the default.**
   - Six chips on three rows with no heading: "1 medium (118 g)" (selected), "Grams", "Ounces", "Palms", "Cupped hands", "Thumbs" (`:309-319`).
   - One chip is a serving and five are units, and three of the six are hand portions. The group takes about 130 vertical (y 277-407). (PD-11.)
6. **Type how many. Passes.**
   - The label "How many servings" floats in Ember with a 2-wide light border when focused.
   - The helper gives the grams, "236 g" (`:340-354`).
   - In the render the text-selection handle covers the helper (y 465-490). I cannot say how long that lasts on a device; see limitations.
7. **Read what will be logged. Passes.**
   - "210 kcal · 3 g protein · 54 g carbs · 1 g fat" in heading type directly under the field, changing as the amount changes (`:356-363`).
   - It is the strongest non-action element on the screen.
   - At 360 wide it wraps and leaves "fat" alone on a second line (render y 523-548).
8. **Meal. Passes.** Same as Task 1 step 8.
9. **"Log it". Passes.** Ember, full width, on screen without scrolling in this render (y 688-736). "Back to search" is beneath it as an Ember text button (`:396-406`).
10. **Result. Not assessed from my remit.** The sheet closes (`:271`).

#### Task 3. Log a restaurant meal without knowing its numbers

Render and source both available for the maintenance-known state. **Walked.**

1. **Find the route. FAILS (MM-213 and PD-05).**
   - The route button reads "Esti" over "mate" beside a fork-and-knife icon (render `add_food_opened_dark`, y 167-213; `:468-476`). MM-213 already tracks the break.
   - On the same first screen a chip in "How was it measured?" is also labelled "Estimate" (`quantity_source_label.dart:11`; render y 467-500).
   - The chip leads to "Enter calories and macros for everything you ate." (`:624-631`), which needs exactly the numbers this person does not have.
2. **Read the screen. Passes.** Title "Estimate a meal" and a three-line caption in the smallest type role, quieter text colour (`estimate_meal_step_state.dart:66-73`; render `add_food_estimate_dark`).
3. **"How big was it?" Passes.**
   - Four chips, each on its own row, each carrying its energy ("Regular · about 800 kcal"); "Regular" is preselected (`:85-97`).
   - Widths are ragged because each label is a different length.
4. **"What kind of meal?" Passes for choosing.**
   - Four chips, "Balanced" preselected (`:99-111`).
   - The kind sets the protein, carbohydrate and fat that will be logged (`:31`), and those numbers are shown nowhere before logging (PD-09).
5. **"Name (optional)". Passes** (`:113-118`).
6. **Meal. Passes.** Same as Task 1 step 8.
7. **Log. FAILS (PD-04).**
   - "Log the estimate" and "Back" are not on screen (`:131-142`).
   - The 800-tall render ends with the "Snacks" chip complete and blank sheet beneath it (y 741-774, then empty to 800). No edge of the button shows and nothing is cut.
   - The screen looks finished with no action on it.
8. **Before the app has a maintenance estimate. FAILS in a small way (PD-15). Source only.**
   - A notice replaces the size chips and says to enter the food by hand (`:77-83`).
   - The kind chips, name field and meal chips are still drawn and still respond (`:99-130`).
   - The log button, below them, is disabled (`:136`).

#### Task 4. Correct an entry logged earlier today

The render shows a legacy entry only; the other states are from source. **Walked.**

1. **Find the entry and open it. Not assessed.**
   - The Food screen's layout is out of scope.
   - From source, the row is tappable and carries no visible sign that it is (`meal_section.dart:144-150`; `food_entry_tile.dart:23-63`).
2. **Read the sheet's head. FAILS (PD-07).**
   - "Edit food" in title type; directly under it "‹ Today ›" in the same title type (render `add_food_edit_dark`, y 64-145; `:434`, `:480-488`; `day_stepper.dart:33-37`).
   - It is the same component, wording and size as the day header of the screen behind (render `add_food_search_dark`, y 10-45), where it means "show another day".
   - Here it means "move this entry to another day" (`:483`, `:327`).
   - It has no label and is the second thing the eye meets.
3. **Name. Passes.** The "Food" field is filled, with a floating label.
4. **Legacy state (the render). FAILS in a small way (PD-13).**
   - "How was it measured?" shows "Weighed" selected.
   - A notice directly below says "This entry was logged without an amount. Choose how it was measured to add one." (`:614-623`; render y 407-495).
   - The instruction to choose sits under a row in which a choice already appears made.
   - The notice is the heaviest block on the screen; the numbers the person came to correct are below it.
   - A person in their first week would not have such an entry: everything the built sheet logs has a portion (`:277-309`).
5. **Correct a number, entry typed with "Everything I ate" or logged from Estimate. Passes. Source only.** Protein, carbs, fat and calories are fields holding the logged values (`:89-91`, `:210-219`, `:713-753`).
6. **Correct a number, entry typed with "One serving". FAILS (PD-08). Source only.**
   - It reopens as a calculated entry (`:84-88`): name, one "Servings" chip, a "How many" field, "Enter the totals myself", meal chips, the "Logs ..." line (`:758-822`).
   - The per-serving protein the person typed, the number MM-48's own scenario corrects, is not on screen.
   - "Enter the totals myself" then shows totals for the whole amount (`:242-254`), not the per-serving figures that were typed.
7. **Correct the amount, entry logged from search. Passes. Source only.**
   - Unit chips, an amount field and "Logs N kcal ..." that follows the amount (`:590-600`, `:786-815`).
   - The serving chip reads "1 medium" here and "1 medium (118 g)" on the amount step (`:792-794` against `food_amount_step_state.dart:281-285`). (PD-11.)
8. **Save. Passes, weaker than it could be.**
   - "Save changes" is below the fold in the render.
   - The meal chips are visibly cut at the bottom edge (y 770-784), so the screen does not look finished.
9. **Leave without saving. FAILS in a small way (PD-14).**
   - The root sheet has a drag handle and no visible close or cancel (render; `:429-545`).
   - Every sub-step has "Back", "Back to search" or "Cancel".

## Findings

Ordered by severity. "Requirement" names where a change would have to be made when the built behaviour is what a ticket asks for.

### PD-01. The typed numbers default to "Everything I ate" under "Label serving", and that state shows no result
- **Domain:** product design (hierarchy, grouping), with UX and product.
- **Classification:** usability problem found by inspection.
- **Severity:** high. It sits on the main path for a packaged food and recurs on every such entry. It is not "hard to get past": it is silent, and the wrong entry looks plausible.
- **Confidence:** high for what is drawn (source and render agree). No claim is made about how many people would mislog.
- **Evidence:** Task 1 step 5; `add_food_sheet_state.dart:53`, `58`, `186`, `590-600`, `699-711`; render `add_food_opened_dark` y 590-655.
- **Expected:** a person copying a label can tell, before logging, what will be kept. **Observed:** the method says "Label serving", the basis says "Everything I ate", and "Logs ..." appears only in the other basis.
- **Rule:** the contract's "which value will be kept"; `design/screen-direction.md:249-250` (visible uncertainty where it changes interpretation).
- **Requirement:** MM-167 owner decision 3 sets this default (`STORY...MM-167.md:217-218`). It does not make the step pass; it is where a change would have to be made.
- **What would have to be true:** in both bases, the sheet states the totals it will log and whether "Servings eaten" multiplies them.
- **Verification:** source inspection plus render. Not run.

### PD-04. On "Estimate a meal" the action is off screen and the screen looks complete
- **Domain:** product design (density, fold).
- **Classification:** usability problem found by inspection.
- **Severity:** medium to high. It is met every time this route is used at this size; it is passed by scrolling, with no cue to scroll.
- **Confidence:** high at 360 x 800, default text size, dark. Unknown at other sizes or with the system navigation inset.
- **Evidence:** Task 3 step 7; `estimate/estimate_meal_step_state.dart:85-97`, `101-111`, `131-142`; render `add_food_estimate_dark` y 741-800.
- **Cause visible in the render:** eight chips each take a full row (y 187-592).
- **Rule:** `design/interaction-and-motion.md:84`.
- **What would have to be true:** at 360 x 800 the log action, or an unmistakable cut edge of further content, is visible when the step opens.

### PD-03. On the typed form and in editing, the action is a scroll away, cannot be seen with the name field, and gives no reason when disabled
- **Classification:** usability problem found by inspection.
- **Severity:** medium (every typed entry; passed by scrolling).
- **Confidence:** high.
- **Evidence:** Task 1 step 9, Task 4 step 8; `add_food_sheet_state.dart:568-573`, `602-607`, `824-832`; renders `add_food_opened_dark`, `add_food_form_end_dark`.
- **Rule:** `design/interaction-and-motion.md:84`; `design/screen-direction.md:131-132` (an Ember bar as the sheet's primary action).
- **Not inspected:** with the keyboard open the visible height is less (`:829`); no render exists for that.
- **What would have to be true:** the person can see the action and what still blocks it without scrolling between the two.

### PD-02. Nothing separates finding a food from typing one; the two text fields are twins
- **Classification:** usability problem found by inspection.
- **Severity:** medium (first decision of every visit; recoverable).
- **Confidence:** high for the render. The cost of the wrong field depends on what the database returns.
- **Evidence:** Task 1 steps 1-2; `add_food_sheet_state.dart:437-442`, `443-479`, `526-541`, `568-573`; render `add_food_opened_dark`.
- **Also seen:** the recents row has no heading, and its chips are the same shape as the choice chips below it (`:526-540`; `mm_theme.dart:180-185`).
- **Rule:** `design/visual-language.md:31-32` (one grouping surface per idea), `:130` (one strongest element per view).
- **What would have to be true:** the first screen reads as a small number of named groups, and the search field cannot be mistaken for the name field.

### PD-06. The same act, saying how much was eaten, has two opposite behaviours that look alike in the results
- **Classification:** usability problem found by inspection.
- **Severity:** medium (met whenever a recent matches a search, and recents rank first).
- **Confidence:** high from source. The typed form after a recent tap has no render with values in it.
- **Evidence:** Task 2 step 3; `add_food_sheet_state.dart:210-231`, `511-519`; `food_search_results.dart:56-69`; render `add_food_search_dark`.
- **Requirement:** MM-167 section 5: "Search, barcode and manual entry behave the same way" (`STORY...MM-167.md:114-116`). Whether a recent food is covered by that sentence is an owner question (see Unresolved product decisions).
- **What would have to be true:** a person can tell from a result row what kind of screen follows, and on any screen that takes an amount, whether the numbers follow it.

### PD-05. "Estimate" is the name of two different controls on the opening screen
- **Classification:** usability problem found by inspection.
- **Severity:** medium (Task 3's first step; the wrong one asks for the numbers the person lacks).
- **Confidence:** high.
- **Evidence:** Task 3 step 1; `add_food_sheet_state.dart:468-476`, `624-631`; `format/quantity_source_label.dart:11`.
- **Rule:** `design/voice-and-wording.md:27`.
- **What would have to be true:** each word on the screen names one thing.

### PD-07. The day control in "Edit food" is unlabeled, title-sized, and identical to the day navigation behind it
- **Classification:** usability problem found by inspection.
- **Severity:** medium (every edit; the result is an entry moved to another day).
- **Confidence:** high for appearance. I did not check how a moved entry is then presented.
- **Evidence:** Task 4 step 2; `add_food_sheet_state.dart:480-488`; `ui/day_stepper.dart:25-46`; renders `add_food_edit_dark`, `add_food_search_dark`.
- **Rule:** `design/visual-language.md:130`.
- **Requirement:** MM-48 asks that an entry can be moved to another day; it does not say how the control is shown.
- **What would have to be true:** the control says what it changes, and does not outrank the fields a correction is usually about.

### PD-08. An entry typed with "One serving" reopens without the numbers that were typed
- **Classification:** usability problem found by inspection.
- **Severity:** medium (only for entries typed per serving, and then every time).
- **Confidence:** medium. Source only; no render.
- **Evidence:** Task 4 step 6; `add_food_sheet_state.dart:84-88`, `143-156`, `242-254`, `574-577`, `758-822`.
- **Requirement:** MM-167 section 5, "shows the same controls as when the entry was logged" (`STORY...MM-167.md:106-108`), and MM-48's "Fixing a number". I class this as a usability problem and not a confirmed violation because I have not seen it rendered or run.
- **Request to the chair:** a render of this state, by logging a typed entry with "One serving" and reopening it.

### PD-09. What will be logged is shown four different ways
- **Classification:** usability problem found by inspection (the two states with nothing shown); the placement differences are design/usability improvement.
- **Severity:** low to medium.
- **Confidence:** high.
- **Evidence:**
  - Typed form, "Everything I ate": no line.
  - Typed form, "One serving", and calculated edit: "Logs N kcal · ..." after the meal chips (`add_food_sheet_state.dart:590-600`).
  - Amount step: the totals with no "Logs", before the meal chips (`food_amount_step_state.dart:356-363`).
  - Estimate: energy inside the chip, macros nowhere (`estimate_meal_step_state.dart:88-96`).
- **What would have to be true:** one place and one wording for it on every screen that ends in a log action.

### PD-12. Route labels break inside the word (already MM-213)
- **Classification:** reproducible implementation defect, already ticketed. No new finding.
- **Severity:** as the ticket sets it.
- **Evidence:** I confirm the render shows "Save / d" and "Esti / mate" (render `add_food_opened_dark`, y 167-213; `add_food_sheet_state.dart:446-477`).
- **Limit:** the ticket states that `apps/mobile/test/add_food_route_labels_test.dart` failed when run enabled; I did not open or run that test.

### PD-10. Emphasis on the opening screen goes to things that are not the action
- **Classification:** design/usability improvement (a preference informed by the design rules, not a violation).
- **Severity:** low.
- **Confidence:** medium.
- **Evidence:** render `add_food_opened_dark`, with these observations:
  - The only Ember on first paint is a selection state ("Everything I ate") and an optional rare question ("Includes alcohol?"), while the primary action is off screen.
  - Two adjacent single-choice groups show selection differently: a chip with a white label on a filled chip, a segment with an Ember label (`mm_theme.dart:171-185`).
  - "Includes alcohol?" stands between the three macro fields and calories, at a different left inset (`add_food_sheet_state.dart:713-753`).
  - Calories is last and the same size as the rest, where the direction asks for "a large kcal field" (`design/screen-direction.md:139-141`).
  - The segment says "Everything I ate" and the static text says "Everything you ate" (`:704`, `:711`).
- **Rule:** `design/visual-language.md:104-105`, `:128-134`.

### PD-11. Chip groups: headings, density, wording
- **Classification:** design/usability improvement.
- **Severity:** low.
- **Confidence:** high for the facts.
- **Evidence:**
  - The unit chips on the amount step and every meal group have no heading, while "How was it measured?", "How big was it?" and "What kind of meal?" do (`food_amount_step_state.dart:309-319`, `384-394`; `add_food_sheet_state.dart:579-589`).
  - "Snacks" wraps alone on all four screens.
  - Three of the six amount chips are hand portions.
  - The serving chip is "1 medium (118 g)" when logging and "1 medium" when editing.
  - The totals line orphans "fat".

### PD-13. Legacy notice
- **Classification:** usability problem found by inspection.
- **Severity:** low (not met by entries the current sheet creates).
- **Confidence:** high for appearance.
- **Evidence:** Task 4 step 4; `add_food_sheet_state.dart:614-623`; render `add_food_edit_dark`.

### PD-14. The root sheet has no visible close; the direction for this sheet no longer describes it
- **Classification:** documentation or requirement gap.
- **Severity:** low.
- **Confidence:** high.
- **Evidence:**
  - `design/interaction-and-motion.md:48-49` asks for "a visible close action"; none is drawn on Add food or Edit food.
  - `design/screen-direction.md:129-143` describes a segmented set of routes, 64-high result rows with energy at the right, a four-field quick add and an "Add" bar. The built sheet has none of these, and MM-38, MM-150 and MM-167 have since added to it.
- **Disposition needed:** the owner decides whether the direction or the screen is current. The close action is referred to UX.

### PD-15. Estimate before maintenance is known leaves live-looking controls above a disabled button
- **Classification:** usability problem found by inspection.
- **Severity:** low.
- **Confidence:** medium. Source only; I did not check when `coachProvider` first gives a value beyond what the notice says.
- **Evidence:** `estimate_meal_step_state.dart:61`, `77-83`, `99-137`.

## Sources and evidence

- **Source:** "How to Understand and Use the Nutrition Facts Label", US Food and Drug Administration, https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label.
- **Dates:** content current as of 2024-03-05 (as reported by the fetch); accessed 2026-10-11.
- **Source finding:** the sample label is ordered serving information, calories, then nutrients; the nutrient rows run Total Fat ... Total Carbohydrate ... Protein.
- **Applicability:** US packaged foods, which is the app's stated first market (MM-42).
- **Interpretation (mine):** the form's order of protein, carbs, fat, calories differs from the printed order (Task 1 step 7, PD-10).
- **Limitation:** retrieved through a summarising fetch tool, not read by me line by line. It supports an ordering observation only; no claim about error rates is made or supported.
- **Conflicting evidence:** none found.
- **Revalidate if:** the label format changes.

No other external source was used. `docs/evidence.md` was not consulted.

## Research

- **Status:** performed, one question.
- **Question:** in what order does a US Nutrition Facts label print calories, fat, carbohydrate and protein?
- **Trigger:** a factual claim used in Task 1 step 7.
- **Surface and tools:** this subagent's own WebSearch for discovery (restricted to fda.gov and ecfr.gov) and WebFetch for retrieval; direct path, not chair-delegated.
- **Query sent:** public and generic; no repository content or personal data.
- **Not researched:** no Flutter or Material platform convention is asserted in this report.
- **For `state.json`:** the chair should record the URL, the dates above and the supported claim.

## Confidence and limitations

- **Overall:** high for what the six renders and the cited lines show; medium for the states walked from source alone (PD-08, PD-15, Task 4 steps 5-7).
- **Edit render does not match the person in the brief.** It shows a legacy entry (`screen_goldens_test.dart:58-71`). A person in their first week would have typed, calculated or estimate entries, and no render of those edit states was supplied.
- **One palette, one size, default text size.** No Light or Martian, no larger text, no keyboard-open state, no system insets. Fold findings (PD-03, PD-04) are stated for 360 x 800 only.
- **A golden is not a device.** In `add_food_amount_dark` the selection handle covers the helper "236 g"; I cannot say whether a person would see that for long. It is recorded as a limit of the render, not as a finding.
- **Colour and size readings are by eye.** I did not measure contrast; that is UX and accessibility's remit.
- **Not checked:** I did not compute hashes, run tests, or confirm the commit. I did not open the HTML drawing, so MM-211 fidelity is unchecked.
- **Self-review:** this is a single pass by one model instance. Agreement with any other reviewer would not be independent proof.

## Acceptance criteria and edge cases

**Existing criteria traced**

| Ticket criterion | Trace |
|---|---|
| MM-167 "The basis is stated" | Met in words on the typed form (`add_food_sheet_state.dart:699-711`). PD-01 is about the default and the missing result line, which the criterion does not cover. |
| MM-167 "Editing restores the portion" | See PD-08 for the per-serving typed case; source only. |
| MM-48 "Fixing a number" | Passes for entered-totals entries (Task 4 step 5); see PD-08 for the other case. |
| MM-150 | No criterion covers what the Estimate step shows before logging (PD-04, PD-09). |
| MM-213 | Both scenarios stand; confirmed by render. |

**Proposed criteria (not approved; for the owner to accept, change or decline)**

- At 360 x 800 and default text size, each screen that ends in a log or save action shows that action, or a visibly cut next element, when it opens.
- Whenever a log action is enabled, the sheet states the energy and macros it will log, in one place and one wording.
- The opening screen carries no word that names two different controls.
- A result row tells the person whether an amount step or a typed form follows.
- The edit sheet's day control carries a label.

**Edge cases noted, not walked**

- Fraction and invalid amounts (helper wording differs between `add_food_sheet_state.dart:667-671` and `:812`).
- Past-day logging.
- Changing method clears the amount (`:233-239`) with no "Enter how much again" line. MM-167 section 5 asks for that wording; I did not see it in source. Referred to QA.
- Nothing-found and no-database states.

## Dependencies

- **ux-accessibility:**
  - Challenge PD-01, PD-03, PD-04 and PD-06 from the task-flow side.
  - Owns the missing close action (PD-14), the unexplained "Reference" mark, contrast, text scaling of the chip rows, and whether the entry row signals that it is editable.
- **product:** MM-167 decision 3 (PD-01); whether recents fall under "behave the same way" (PD-06).
- **flutter:**
  - A pinned action area and a labelled day control would be changes to shared components (`MmButton`, `DayStepper`), not to the screen.
  - Confirm whether tapping an already-selected chip re-runs `_selectMethod`. `mm_choice_chip.dart:17-21` suggests it does; I did not verify.
- **qa:** renders requested below; the "Enter how much again" wording.
- **Tickets:** MM-38, MM-42, MM-48, MM-150, MM-153, MM-167, MM-213; MM-211 for the drawings if any screen changes.

## Safety concerns

- None found within this remit. This is not clinical clearance.
- PD-01 can leave a day's intake under-recorded without the person knowing, which feeds the expenditure estimate. Whether that matters to coaching safety is for the coaching and safety roles, which this run omits.
- No privacy issue seen; fixture data only.

## Unresolved product decisions

1. **Default basis under "Label serving" (PD-01).**
   - Alternatives: keep "Everything I ate" and state the result; default to "One serving" for this method; ask each time.
   - Impact: every typed packaged food.
   - Authority: product owner (the current default is MM-167 decision 3).
2. **Recents from search (PD-06).** Should a recent food open the amount step when it has a stored reference, or always the typed form? Authority: product owner.
3. **`design/screen-direction.md` Food logging flows (PD-14).** Is that the target, or is it superseded by what was built? Authority: product owner.
4. **Maurice.** No mascot appears in any render or source read; the standing prohibition (`design/visual-language.md:124-126`) is untouched and nothing here proposes one.

## Verification

- **Executed by me:** none. No tests run, no app run, no commands.
- **Inspected:** the six renders named above; the source files listed under Scope; `screen_goldens_test.dart:53-72` and `:573-654` to learn how each render was made.
- **Stated by a ticket, not verified by me:** MM-213's regression test failed once when enabled.
- **Requested from the edit owner (renders at 360 x 800):**
  1. Edit of an entry typed with "One serving" (PD-08).
  2. Edit of an entry logged from search and of one logged from Estimate.
  3. The typed form after tapping a recent row in results (PD-06).
  4. Estimate with no maintenance estimate (PD-15).
  5. The typed form and the Estimate step with the keyboard open, and at the largest supported text size (PD-03, PD-04).
  6. Light and Martian for at least the opening screen.

## Targeted challenges

none

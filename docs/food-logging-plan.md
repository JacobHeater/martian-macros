# Food logging: from one food at a time to the eating occasion

A product improvement plan, written 2026-10-26 from a review of main at
`f5a08b4e87c267468dfb372dbd6a54b217e82d3e` (#317). It is a plan, not a
build: nothing in the app was changed. The confirmed defects it found are
ticketed (MM-623 to MM-626), each with a regression test skipped under its
ID, as `AGENTS.md` requires. Everything else here is a finding or a
proposal, and no feature ticket has been allocated for it yet.

**Built since (2026-10-26):**

| Increment | Ticket |
| --- | --- |
| W-A, the four defects | MM-623 to MM-626, with one all-or-nothing batch write, `FoodEntryBatchWriter`, so a deleted meal goes in one redraw |
| B1, a unit change keeps the portion | MM-628 |
| B2, recents say their amount, this meal's first | MM-629 |
| B3, copies said, made once, to any day | MM-633 |
| B4, a whole meal's time, meal or day | MM-630 |
| C1, the meal session | MM-631 |
| C3, choosing foods to change together | MM-634 |
| C4, search by match first, part 1 | MM-627 |
| The cup a digit short | MM-632 |
| B5, Saved logs a food (owner's answer) | MM-635 |
| C2, volume through a serving the source states as one, read from its words, no pack rebuild | MM-636 |
| Own results apart from the database's (the owner's ask) | MM-637 |
| W-D, typo tolerance | MM-638 |
| C5, what is usual at a meal first | MM-639 |
| The chosen count said as it changes | MM-640 |
| W-D, one food taken out of a logged meal | MM-641 |
| The owner's choices on the sheet: About this food folds, calories first, Cancel while choosing | MM-642 to MM-644 |
| W-D, saved meal templates (schema 30) | MM-645 |
| F-19, a food typed by hand into a meal says how it was measured; Look up offers its matches | MM-646, MM-647 |
| F-20, extras follow the amount, never a corrected calorie (the recommendation taken) | MM-648 |
| MM-634's follow-up: focus after the chosen row is gone; the choosing bar at 200% text, a story | MM-649 |
| C2's liquids half: the pack states a drink per 100 mL with its serving in millilitres (format 5); a drink by the fluid ounce, the millilitre or its own can; the H-06 check first (2026-10-27) | MM-650, MM-651 |

Not built, and why:
- **W-D, favorites pinned by the person.** Not built as a third thing: Saved foods and meals log in one press
  (MM-635, MM-645) and sit first in search (MM-637), and what is usual at a meal comes first among the recents
  (MM-639). If the owner still wants a star, it is a ticket of its own.
- **W-D, a persisted session draft:** only if D-1's in-memory list proves fragile on devices. Not seen yet.
- **W-D, the manual form redesign (F-14)** beyond calories first (MM-643): the owner's call on the rest.
- **F-21** (a re-logged analysed food becomes a label serving): the owner's call, recorded in MM-623.
- **Device checks**: every new screen on a phone and with a screen reader; the checklist in `requirements/HANDOFF.md`.

How the evidence was gathered, and what it does not cover, is in
[Coverage and limits](#coverage-and-limits). In short, it rests on source
inspection plus a bounded panel. Nothing ran locally (CI validates), and no
render, device or screen reader was used.

---

## 1. Executive assessment

**What the current model does well.**
- **Trustworthy arithmetic for a single food.** One function scales
  nutrition (`scaleNutrition`), and it applies the scaling once, to
  reference values (MM-167). Each entry stores its reference, its amount
  and its basis. Unknown is never zero. Volume never converts without a
  food-specific basis. Weight ounces and fluid ounces are distinct units.
- **Honest provenance.** Each entry records its trust tier, its origin
  (pack and food), its preparation (raw or cooked), and the hand model's
  version and implied grams.
- **The sheet says what it will log** before logging (MM-218). The action
  says what it still needs (MM-220).
- **Search behaves well while typing.** It is debounced, results never
  blank between keystrokes, results are paged, and a failed read is said
  with a retry.
- **The log can already hold a meal.** Since MM-586/587 there is a
  meal-shaped model: `MealDraft`, `logMeal`, which is all or nothing, a
  `LoggedMeal` as one row, and View meal, which renames, moves, and adds
  or removes foods.

**Its principal limitations.**
1. **The workflow is one food per sheet.** Every path except AI analysis
   and "log a meal again" closes the sheet after one food. Dinner of three
   foods means three sheet openings, three searches, and the meal and time
   asked three times (F-10).
2. **Reuse is the weakest path, and it is where most logging happens.**
   Recents and log search refill a typed form instead of the food.
   - The re-logged entry silently loses sugar alcohols and every
     micronutrient.
   - A label serving or analysed food also loses fiber and sodium.
   - A weighed pack food stops following its amount and forgets which
     food it was (F-01, MM-623).
   - The recents list has no amount, no meal awareness and no frequency
     (F-09).
3. **Pack search ranks by source before match.** A well-documented food
   that matches loosely outranks the food the person typed (F-07). The
   owner rates search and recents well behind MyFitnessPal and MyNetDiary.
4. **Volume is supported in the domain but unreachable.** The pack build
   never produces a density or a structured household measure, and the
   amount step offers no volume units (F-02).
5. **Several kinds of write are not trustworthy.** A failed save says
   nothing, a second press logs twice, and a food can be logged without
   its cooking fat (MM-624). Re-log, copy and meal delete can leave part
   of a meal (MM-625).
6. **There is no way to correct several entries at once.** There is no
   selection anywhere. A logged meal's time cannot be changed at all
   (MM-626).

**Recommended direction.** Keep the per-food arithmetic and provenance
exactly as they are, and change the unit of work from the food to the
eating occasion:
- Fix reuse and write reliability first. They are prerequisites: a faster
  workflow on top of lossy reuse multiplies the loss.
- Then add a **meal session** to the existing Add food sheet, opened from
  the meal's "+" as today (MM-438). The meal and time are set once, foods
  are added to an "in this meal" list and reviewed, and they are logged
  together through one all-or-nothing write.
- Give the amount one **portion control** that converts rather than
  resets, and feed it real volume data from the pack build.
- Add **selection on the Food screen** for time, meal, day, copy and
  delete.
- Rework **search ranking and recents** around the person's own history
  and text relevance.

---

## 2. Current capability map

| Area | What exists (evidence) | Gaps |
| --- | --- | --- |
| **Entry points** | A meal's "+" opens Add food with that meal chosen (MM-438, `MealSection.tsx`). The easy-to-miss chips open it pre-searched (MM-152). A row press edits a food; a meal row opens View meal. | None to change. |
| **Add food choices** | Search field. When empty: AI meal analysis, Scan, Saved, Estimate, then Recent foods (5, then all 20) and "Enter manually" (`AddFoodSheet.tsx:850-964`). | "Saved" opens My foods, which manages foods and does not log them (F-16). |
| **Search** | Saved foods matching by substring. "From your log": every food and meal ever logged (MM-596). Pack results via FTS5 prefix match, bm25, then sorted by `sourceReliability` first (`FoodCatalog.ts:14-22`, `SqliteFoodPack.ts:86-110`). Online results beside them (MM-58). Debounce 150 ms, previous answer kept (MM-408), pages of 20 (MM-410), read failure retry (MM-411). | Ranking (F-07). Every word must prefix-match, with no typo tolerance. Rows show only "kcal per 100 g" (F-08). |
| **Selection → amount** | A pack food opens `FoodAmountStep`: servings from the source, Grams, Ounces, and hand units when a hand size is set. Raw/cooked switch (MM-151), cooking oil none/1 tsp/1 tbsp (MM-152), reference line, Logs line, macro split, Log it. | No volume chips (F-02). Unit change resets the amount (F-11). The hierarchy is dense (F-13). |
| **Portions and units** | Domain: g, oz, cup, tbsp, tsp, mL, fl oz, serving, palm, cupped hand, thumb (`PortionUnit.ts`). Volume needs a density, a serving defined in mL and g, or the source's own serving unit (`gramsFor.ts`, `conversionFor.ts`). | Packs carry neither density nor structured measures (F-02). Open Food Facts liquids are probably stored per 100 mL as per 100 g (F-03). |
| **Manual entry** | Method chips (every `QuantitySource` except photo), then amount and unit, macros, extras at Full, alcohol, calories. A label serving is per serving (MM-226); other methods are entered totals. | Defaults to per-serving; calories come last (F-14). Changing the unit keeps the number (F-11). |
| **Multi-food** | AI meal analysis (a `MealDraft` reviewed in `AnalyzeMealStep`, then `logMeal`, all or nothing). A recent or found meal logged again in one press (`relogMeal`). Copy a slot to today; Copy yesterday (MM-47). | No manual multi-food session (F-10). View meal's "Add a food" takes grams and macros typed by hand (F-19). |
| **Grouped meals** | Entries sharing `loggedMeal {key, name}`. There is no meal table; the meal's day, slot and time are its first item's (`LoggedMeal.ts`). View meal renames, moves slot or day, adds, removes, and saves to Saved. | No time control (MM-626). The invariant is unenforced (A-2). |
| **Reuse** | Recents: 20 distinct names, the 5 newest first, foods and meals mixed (MM-39, MM-439, MM-587). A tap refills the typed form (`filledFrom`). | Loses data (MM-623). Not meal-aware; no amount shown (F-09). |
| **Editing** | The food editor with day stepper, meal chips and time. A calculated entry is edited by amount; "Enter the totals myself" converts it once (MM-204). | An edit can't return to the food's other servings (F-12). A typed-totals edit scales micronutrients by the calorie ratio (F-20). |
| **Copy, move, delete** | Copy a slot to today from a past day. Copy yesterday on an empty day. Delete by swipe or menu, with Undo. Move one food by editing its day or meal. Move a whole meal in View meal. | No copy to another day or meal. No duplicate-and-adjust. Copy gives no feedback (F-17). No multi-select (F-18). |
| **Persistence and recovery** | One SQLite transaction per entry (`AppDatabase.write`). `logMeal` rolls back. The health mirror swallows platform failures (`MirroredFoodLog`). Undo re-adds under new ids. | No batch writer (MM-625). Silent failures; no in-flight guard (MM-624). |

---

## 3. Findings register

**Classification key.**
- **Defect:** a confirmed implementation defect, ticketed.
- **Gap (domain):** the capability exists in the domain but is not exposed.
- **Gap:** the capability is missing.
- **Usability:** a usability problem found by inspection.
- **Ambiguity:** the requirement or interaction is unclear.
- **Hypothesis:** needs runtime or device verification.
- **Latent:** a defect no current path reaches.

"Confidence" is about the code path. None of these was reproduced at
runtime.

### Defects (ticketed, regression tests skipped under the ID)

**F-01 · Defect · MM-623 — A food logged again from Recents or the log loses what it had.**
- **Evidence:**
  - `AddFoodSheet.tsx:385-389` `fill` → `filledFrom` (`:151-210`).
  - `save` (`:482-523`) reads extras from the `entry` prop, which is
    undefined for a new log: `scaledExtra` returns undefined at `:419`, and
    `scaledMicros` is `Micronutrients.none` at `:492`.
  - On the calculated path, `fiberG` and `sodiumMg` use `scaledExtra`
    (`:509`, `:511`).
  - Weighed and household pack foods refill as `enteredTotals` with no
    reference and no origin (`:187-188`, `:453-479`).
  - MM-39 says the form is filled "so the amount can be changed".
  - Tests: `recentFoodsAreRows.test.tsx` checks only the name;
    `searchTheLog.test.tsx:43` checks only kcal and serving.
- **Observed:**
  - Sugar alcohols and every micronutrient beyond sugars and saturated fat
    are always lost.
  - For a label serving or an analysed-meal food, fiber, sodium, sugars and
    saturated fat are lost too.
  - A re-logged 180 g pack food changed to 200 g still logs 180 g's totals
    and forgets its pack food.
  - "Edit nutrition per serving" on a refilled food blanks its extras.
- **Impact:**
  - Sodium and micronutrient totals undercount.
  - Coverage and completeness drop.
  - Under- or over-logging when the amount is changed.
  - Insights that depend on origin or reference lose their input.
- **Confidence:** high. Found independently by the chair, the nutrition
  reviewer and the UX reviewer.
- **Outcome:** the refilled entry is kept as a template, separate from the
  entry being edited. It is scaled once, keeps unknown as unknown, and a
  calculated food stays calculated from its reference and origin.
- **Dependencies:** none. It is the first increment's core.

**F-04 · Defect · MM-624 — Saves fail silently, accept a second press, and can lose the cooking fat.**
- **Evidence:**
  - `MmButton.tsx:39-40` is disabled only when `onPress` is undefined.
  - No catch in `AddFoodSheet.save`, `FoodAmountStep.log`,
    `EstimateMealStep.log`, `logAgain`, or `ViewMealSheet`'s writes.
  - No `unhandledrejection` listener under `src/`.
  - `FoodAmountStep.tsx:208-262` writes the food, then the preference, then
    the fat. Contrast `AnalyzeMealStep.tsx:350-368` (MM-591).
- **Observed:**
  - A failed write leaves the sheet open, saying nothing.
  - A double press while a write is pending writes twice.
  - If the fat or the preference fails after the food is written, the food
    stays alone, and "Log it" again logs it a second time.
- **Impact:** duplicate or partial intake feeding targets and the coach.
  The person cannot tell "not yet" from "failed".
- **Confidence:**
  - High for the missing guard and catch.
  - How often a double press lands on a device is a hypothesis: the window
    is the SQLite write plus the awaited health-platform write.
- **Outcome:** a pending state on the action, the failure said inline, and
  food and fat written together.
- **Dependencies:** the batch writer (MM-625) for food plus fat.

**F-05 · Defect · MM-625 — Multi-entry writes can leave part of a meal.**
- **Evidence:**
  - `relogMeal.ts:16-18`, `copyEntries.ts:8-10`, `removeMeal.ts:11-17` and
    `ViewMealSheet.updateAll` (`:71-73`) loop over single-entry
    transactions.
  - `FoodEntryWriter` has no batch method.
  - Only `logMeal` cleans up.
- **Observed:**
  - **Seen by the owner on the phone, 2026-10-26:** a deleted meal's rows
    vanish one at a time. Each delete is its own transaction, so the Food
    screen redraws once per food. `MirroredFoodLog` also awaits the health
    platform before the loop moves on, so the rows go at the platform's
    pace (architecture A7).
  - A failure part way leaves a partial meal.
  - For a delete, the foods already deleted have no Undo.
  - A meal split across two slots or days shows as two rows.
- **Impact:**
  - A visibly slow, piecemeal delete, observed by the owner.
  - Data loss or corruption, rare but silent.
- **Confidence:**
  - High on the path.
  - The visible symptom is observed by the owner.
  - Failure frequency is unknown.
- **Outcome:** a narrow, consumer-owned batch writer: one transaction, one
  watcher notification, health mirror after the commit. Every multi-entry
  operation, and every bulk edit proposed here, goes through it.
- **Dependencies:** none. Bulk edit (W-C3) and the meal session (W-C1)
  depend on it.

**F-06 · Defect · MM-626 — A logged meal's time cannot be changed; a day move loses it.**
- **Evidence:**
  - `ViewMealSheet.tsx` has no `TimeEatenRow`.
  - `moveToDay` clears `eatenAt` (`:81-84`).
  - A meal's foods never open in the food editor.
  - MM-570 says a time "can be changed, never cleared".
- **Impact:**
  - An AI meal logged at the wrong time (MM-594) cannot be corrected.
  - The owner's priority, correcting a whole occasion's time, fails on
    exactly the grouped case.
- **Confidence:** high.
- **Outcome:** a Time eaten row in View meal that writes to every food of
  the meal.

### Other confirmed findings

**F-02 · Gap (domain) plus ingestion gap — Volume is supported in the domain but unreachable.**
- **Evidence:**
  - Domain units and gates: `PortionUnit.ts`, `gramsFor.ts:36-46`,
    `conversionFor.ts:31-40`.
  - The pack format has a density column (`FoodPackFormat.ts`,
    `SqliteFoodPack.ts:197`). Nothing in `foodPipeline/` or `extract.sql`
    produces it. Only `FixturePack` has densities.
  - FDC portions keep `amount`, `measure_unit` and `gram_weight`, but the
    build flattens them into a description string (`extract.sql:241-253`).
    `CatalogServing` is `{description, grams}`.
  - Branded servings are kept only when the unit is g (`extract.sql:74-79`),
    so mL-served drinks get no serving.
  - `FoodAmountStep.tsx:119-134` offers no volume chips.
  - The edit path offers cup, tbsp, tsp and mL when a density exists
    (`AddFoodSheet.tsx:236-247`, `:756`), which for pack foods is never.
  - `fluidOunce` is offered on no path.
- **Observed:** "half a cup" works today only through a source serving that
  is already a cup ("1 cup (158 g)" × 0.5). A tablespoon of something whose
  source lists only cups is not offered.
- **Impact:** the owner's volume priority. Liquids are the hardest case.
- **Confidence:** high.
- **Outcome:** see §5.2. Carry the source's structured measures into the
  pack, and offer volume only from a food-specific basis.
- **Correction to the designer's report:** the "edit path offers volume"
  inconsistency has no effect on pack foods today, because none has a
  density.

**F-07 · Usability (confirmed behavior, owner-reported) — Pack search ranks by source before match.**
- **Evidence:**
  - `FoodCatalog.ts:14-22`, `byReliabilityThenMatch`: reliability first,
    bm25 only to break ties.
  - `sourceReliability.ts:11-18`: per-source bases (95/90/80/65/40,
    MM-383) plus bonuses for stating fiber and sodium, and sugars and
    saturated fat.
- **Observed:** text relevance decides only between foods with the same
  reliability score. A complete generic record that matches the words
  loosely outranks a closer match from a lower tier, or a less complete
  record from the same source.
- **Impact:**
  - The owner: search is weak next to MyFitnessPal and
    MyNetDiary.
  - The size of the effect on real queries is unmeasured. There is no
    query set to measure it against: hypothesis H-07.
- **Confidence:** high on the ordering rule; unmeasured on its effect.
- **Outcome:** relevance first, reliability as a boost and a tie-break,
  personal history merged in. This needs the owner, because MM-383's bases
  are an open "say if any is wrong" (D-3).

**F-08 · Usability — Search matching and result rows.**
- **Evidence:**
  - `SqliteFoodPack.ts:102`: every word is a quoted prefix term, implicitly
    ANDed. One misspelled or extra word ("chickn", "grilled chicken breast
    skinless") can empty the results.
  - Rows show "N kcal per 100 g" and the trust mark only
    (`FoodSearchResults.tsx:100-104`). No serving, and no per-serving
    figure for a branded item.
- **Impact:** queries fail where a person expects a near match. Choosing
  between look-alike results needs the amount step.
- **Confidence:** high for the matching rule; the impact is a hypothesis.
- **Outcome:** §5.4.

**F-09 · Usability — The recents list.**
- **Evidence:**
  - MM-39's decisions: 20 distinct names, newest first, the meal not
    copied. MM-39 itself calls recents "a stopgap for saved foods with
    servings".
  - Five rows show at first (MM-439), foods and meals mixed (MM-587).
  - `RecentFoodRow.tsx:25` shows kcal only, no amount.
  - A tap always refills the typed form, even for a pack food that has an
    amount step.
- **Impact:**
  - Recents is not meal-aware (breakfast foods at dinner) and not
    frequency-aware.
  - The portion to be repeated is invisible.
  - A pack food re-logged from recents loses its unit choices.
- **Confidence:** high.
- **Outcome:** §5.4.

**F-10 · Usability — One food per sheet; meal and time asked every time.**
- **Evidence:**
  - `FoodAmountStep.tsx:262` and `AddFoodSheet.tsx:520` call `onDone`,
    which closes the sheet (`showAddFoodSheet.tsx:22`).
  - Meal chips and `TimeEatenRow` are on every amount step (`:306-307`).
  - Time defaults to now for today (`eatenAtWhenLogged.ts`), so dinner
    logged at 9 pm says 9 pm on each food until changed.
- **Impact:** adding three foods to dinner takes at least 12 presses and 3
  searches, plus setting the time up to 3 times (analytical count).
- **Confidence:** high.
- **Outcome:** the meal session (§5.1).

**F-11 · Usability (and one small defect-like mismatch) — Unit changes behave three ways.**
- **Evidence:**
  - The amount step resets to 100 g, 4 oz or 1 (`FoodAmountStep.tsx:81`,
    `:265-270`).
  - Editing a calculated entry clears the field and shows the warning
    before any typing (`AddFoodSheet.tsx:766`, `:776-777`).
  - The typed form keeps the number (`:641`). With entered totals, "2 cups"
    becomes "2 tbsp" while the totals stay, so the recorded portion
    disagrees with the totals.
  - Leaving weight resets raw or cooked, and returning doesn't restore it
    (`FoodAmountStep.tsx:268`).
- **Impact:** a novice expecting 180 g to become about 6.3 oz loses the
  value.
- **Confidence:** high.
- **Outcome:** the semantics in §5.2.

**F-12 · Gap (domain) — A calculated entry can't be edited back onto the food's other servings.**
- **Evidence:** the stored reference keeps only the serving chosen when
  logged (`FoodAmountStep.tsx:174-181`). An entry logged in grams has no
  serving at all.
- **Outcome:**
  - The edit path reads the food again from its origin, when the pack is
    installed, to offer its servings.
  - Otherwise it offers what the reference supports.

**F-13 · Usability / proposal — The amount step's hierarchy.**
- **Evidence:**
  - `FoodAmountStep.tsx:295-411`, in order: name, brand, trust mark, grade
    plus caption, meal, time, unit chips, weighed as, amount, oil and which
    fat, reference line, Logs line, rounding notice, macro split, Log it,
    Fix this food, Back.
  - The detail level removes only carbs, fat and the chart, never a
    decision (`DetailLevel.showsCarbsAndFat`).
- **Impact:** in a multi-food session, identity rows and meal and time
  repeat for every food.
- **Confidence:** the order is a source fact. Crowding, scrolling and
  reachability are hypothesis H-05.
- **Outcome:** §5.1. Meal and time move to the session. Grade, reference
  line and chart go behind one "About this food" disclosure while in a
  session. The hand-estimate wording, the rounding notice and the
  "plus oil" sentence stay visible because they change what is logged.

**F-14 · Usability — The manual form.**
- **Evidence:** `blank` defaults to label serving with per-serving numbers
  (`AddFoodSheet.tsx:115-135`). The method row comes before the numbers.
  Calories come last.
- **Impact:** typing totals means first understanding and changing the
  method, and changing the method clears the amount.
- **Outcome:** keep MM-226's rule. Lead with "what you ate" totals for
  Quick add, and put the method behind the amount. This is a small
  redesign: proposal only.

**F-15 · Gap — Cooking fat.**
- **Evidence:**
  - None / 1 tsp / 1 tbsp only (`FoodAmountStep.tsx:347-356`).
  - Logged as its own unlinked entry with entered totals (`:245-260`), so
    it can't be scaled later, can't be found as "this food's fat", and is
    not moved or deleted with its food.
  - It is offered for any cooked generic food, including one whose source
    name already says it was fried or cooked with oil.
- **Outcome:** §5.2.

**F-16 · Usability — "Saved" in Add food manages foods and doesn't log them.**
- **Evidence:**
  - `MyFoodsStep.tsx:69`: pressing a saved food opens its edit form.
  - The caption says saved foods "appear first when you search".
  - A label read after a scan saves the food and returns to the list, not
    to logging it.
- **Outcome:** in Add food, pressing a saved food opens its amount step;
  edit and delete become row actions.

**F-17 · Gap / usability — Copy and move.**
- **Evidence:**
  - Copy only a slot, only to today, only from a past day
    (`MealSection.tsx:128-134`). No snack, no Undo, no pending state, so a
    second press copies again (QA-4).
  - The per-entry menu holds only Delete (`:176-183`).
  - MM-47 records "copying a meal to a day other than today is not
    offered".
- **Outcome:** §5.3.

**F-18 · Gap — No selection; a meal's foods can't be moved one by one.**
- **Evidence:**
  - No selection cell in `state/`.
  - Giving three entries one time takes about 15 interactions.
  - `MealItemForm` has no slot control; View meal moves the whole meal.
- **Outcome:** §5.3.

**F-19 · Usability / provenance — The meal item form.**
- **Evidence:**
  - Grams only (`MealItemForm.tsx`).
  - "Look up" takes the first search hit without asking (`:101-108`).
  - The usual-portion fields sit among the correction fields.
  - The detail level is ignored.
  - A food typed by hand in View meal is stored with method `photoEstimate`
    (`entryOfMealItem.ts`), though its evidence says "yours".
- **Outcome:**
  - Correcting an AI item should reuse the portion control and search.
  - Hand-added items get their real method.
- **Built (2026-10-26):** MM-646 asks how a food typed by hand was measured and logs it that way; MM-647 makes
  Look up offer its matches. The portion control itself is not reused in the item form: grams stay its one
  amount, as the analysis gives grams.

**F-20 · Ambiguity — A typed-totals edit scales some extras by the calorie change.**
- **Evidence:** `AddFoodSheet.tsx:492`, `:510`. A calorie typo corrected
  from 200 to 400 doubles calcium and sugar alcohols. Fiber and sodium are
  read back from their fields and don't change.
- **Outcome:** decide whether a calorie correction is an amount change.
  The plan recommends not: extras follow the amount, or are kept as stated.
- **Built (2026-10-26):** MM-648 takes the recommendation. Typed per serving, the servings say the amount;
  typed totals keep the extras as stated.

**F-21 · Ambiguity — A re-logged analysed food becomes a label serving.**
- **Evidence:** `filledFrom` sets `source: 'labelServing'` for a
  photo-estimated food (`AddFoodSheet.tsx:173`). Evidence is not carried.
- **Impact:** the estimate's uncertainty is understated.
- **Outcome:** an owner call, recorded in MM-623's decisions. The plan
  recommends keeping the estimate's method and evidence.

**A-1 · Ambiguity — Two rules for time on a day move.**
- MM-570 keeps a food's minute when it moves day (`AddFoodSheet`).
- MM-587 clears a meal's (`ViewMealSheet`).
- Bulk move needs one rule (D-4).

**A-2 · Gap — The grouped-meal invariant is not enforced.**
- Nothing requires a meal's foods to share day, slot, time and name
  (`LoggedMeal.ts:16-37`).
- Bulk edits must treat a selected meal row as all its foods.

**A-3 · Ambiguity — Weight ounces beside fluid-ounce servings.**
- The "Ounces" chip and the "Amount (oz)" field don't say "weight", while
  a drink's source servings say "fl oz". Labelling is distinct in code,
  not on screen.

### Hypotheses needing runtime or device verification

| ID | Hypothesis | How to check |
| --- | --- | --- |
| F-03 / H-06 | Open Food Facts liquids are stored per 100 mL as per 100 g, and their `serving_quantity` (mL) as grams. The OFF schema says `_100g` means "100 ml for liquids". The online path also strips "(240 ml)" from descriptions. USDA Branded mL basis is unconfirmed. | **Confirmed on both sources, 2026-10-27** (queries and counts in `docs/food-packs-data.md`, "Liquids, measured"). Branded: 13.5% of US rows are stated in mL (`ml` and `MLT`), their per-100 figures are per 100 mL, and the extract drops the serving on every one of them, because it keeps only `g`/`GRM`. OFF: 8% of US servings are in mL, `serving_quantity` is the mL number in 99.9% of them, and the per-100 figures are per 100 mL. Coke, 2% milk and Tropicana match their labels in both. |
| H-01 | While a corrected query loads, the previous empty answer shows "Nothing found for" the new query. | Story or test with a delayed catalog. |
| H-02 | A failed log search (`searchLoggedFoods`) is silent and leaves the previous "From your log" rows up. | Test with a rejecting reader. |
| H-03 | A single delete shows "Removed" and Undo before the delete has worked; if it fails, Undo duplicates the food. | Test with a rejecting `deleteFood`. |
| H-04 | Rewriting a health record under the same id replaces it on both platforms. Sequential mirroring makes large bulk edits slow. | Integrations review; device check on Health Connect and HealthKit. |
| H-05 | At 200% text, or with the numeric keyboard open, "Log it" on the amount step and the manual form is far below the fold. | A large-text story for AddFood and FoodAmountStep (only `FoodLargeText` exists, for the Food screen); a device pass. |
| H-07 | The reliability-first order puts a worse match first for common queries. | The query evaluation set in §8. |

### Latent (no path reaches them today)

- **L-01.** A saved food with no serving weight would lose fiber, sodium
  and micronutrients in the amount step (`FoodAmountStep.tsx:201-225`,
  `customCatalogFood.ts:13`).
  - The form requires a weight, and recipes store no extras, so nothing
    reaches it now.
  - This corrects the nutrition and measurement reports, which called it a
    live defect.
  - Guard it if recipes gain extras.
- **L-02.**
  - `unitsOffered`'s reference branch disagrees with `scaleNutrition`
    (per 100 mL, serving mL only), but no caller passes a reference.
  - `PortionUnit.ts:5` calls 236.588 mL the "US legal cup"; that is the
    customary cup. The label cup is 240 mL (21 CFR 101.9(b)(5)(viii)).
  - `ReferenceNutrition.servingUnit` already counts a source's own cup as
    stated.

---

## 4. The owner's priorities and the prior review, consolidated

### The owner's priorities

| Priority | Disposition | Why |
| --- | --- | --- |
| First-class multi-food logging | **Confirmed missing** for manual and search logging. **Partially supported** by AI analysis, log-again and copy. | F-10. Reuse `MealDraft` and `logMeal`'s pattern (§5.1). |
| Alternate units | **Partially supported.** The domain is complete; the UI exposes servings, g, oz and hands. Conversion on change is missing. | F-02, F-11. |
| Volume as well as mass | **Domain present, data missing.** Reachable only through a source's own cup or tbsp serving. | F-02, F-03. Ingestion first, then the UI. |
| Bulk editing of shared fields, especially time | **Confirmed missing.** View meal moves a meal's slot or day but has no time. | F-06 (MM-626), F-18, §5.3. |
| Efficient logging and correction of an occasion | **Blocked by reliability.** Reuse loses data; writes can split or duplicate. | MM-623 to MM-626 first. |
| Recents and search quality (added 2026-10-26) | **Confirmed.** Reliability-first ranking, strict matching, recents without amount or meal awareness. | F-07, F-08, F-09, §5.4. |

### The prior review's leads

| Lead | Disposition | Correction or detail |
| --- | --- | --- |
| 1. Multi-food: one food then `onDone`; manual completes after saving | **Confirmed.** | "Log and continue" exists nowhere. The multi-food paths that do exist are AI analysis, relog of a meal and copy of a slot. Search text is cleared on `fill`, and the sheet closes after each log. |
| 2. `unitsOffered` covers volume and hands; amount step omits volume | **Confirmed, and the cause is earlier than the UI.** | The packs carry no density and no structured volume measures, so adding chips alone would offer nothing. Branded mL servings are dropped. fl oz is offered nowhere. |
| 3. Amount step resets on unit change; manual keeps the number | **Confirmed, plus a third behavior:** editing clears it. | Keeping the number on the typed path mismatches portion and totals (F-11). |
| 4. Bulk editing | **Confirmed absent.** | Grouped meals already move slot and day together in View meal (that is a bulk move for one meal); time is missing there (MM-626). |
| 5. Save, retry, failure | **Confirmed after tracing the shared controls.** | `MmButton` has no guard, nothing catches, and only MM-591's path says failures. The health mirror is not a failure source (it swallows). |
| 6. `filledFrom` vs save extras on re-log | **Confirmed and wider.** | The calculated path also loses fiber and sodium; weighed foods lose reference, origin and amount-following; analysed foods lose their method. Edit, catalog pick, relog of a meal and copy are correct (N4, N5, N7). |
| 7. Amount-screen hierarchy | **Partially confirmed.** | The order is a fact. Detail level reduces macro depth, not decisions. Crowding is unverified (H-05). |
| 8. Cooking fat | **Confirmed and extended.** | It is unlinked to its food, entered totals, and written after the food without rollback (MM-624). |
| 9. Search freshness | **Mostly already addressed** (MM-408, MM-410, MM-411). | Picking a stale non-empty result is accepted MM-408 design, and it still picks a real food. Residual: H-01, H-02. The bigger problem is ranking (F-07), which the lead did not name. |
| 10. Reuse and correction | **Confirmed.** | Copy is to today only, gives no feedback, and repeats on a second press. The per-entry menu has Delete only. |

---

## 5. Recommended experience

### 5.1 The meal session (multi-food)

**What it is.** Several independently logged foods, entered in one sitting
for one slot and time. It is not a recipe (a saved food with ingredients),
not a meal template (Saved meals, later), and not an AI estimate (a
`LoggedMeal` with evidence).

**Shape.**
- The meal's "+" opens Add food as today.
- The meal, time and (for an edit) day sit **once** at the top, as
  `AnalyzeMealStep`'s review does (the MM-318 sibling).
- In a session, the amount step's primary action becomes **"Add to
  dinner"**. It returns to search with the query kept, so a second food
  from the same results is one press away.
- An **"In this meal · 3 foods · 640 kcal"** group sits under the search
  field. It folds to its summary past two foods and is drawn as
  `MealItemRow`-style rows with Change and Remove.
- The single primary in search becomes **"Log 3 foods"**, with a check
  icon on the button, as the owner's result-on-the-button rule asks.
- Recents gain a one-press **add** that puts the food in the list at its
  last amount, so a usual breakfast is three presses and one Log.
- One food alone still logs in one press. "Log it" stays when the list is
  empty, so nothing gets slower for one food.

**Continuous save vs draft.**

| | Continuous (each food saved as added) | Draft (the list saved together) |
| --- | --- | --- |
| Cancel | Foods already added stay logged; cancel means delete each, or Undo. | Nothing is logged until "Log N foods". The sheet's ✕ asks before discarding a non-empty list. |
| Recovery if the app is killed | Nothing lost. | The list is lost. It is in memory, and a persisted draft would put half-entered health data on disk and in backups (architecture P3). Sessions are about a minute long. |
| Duplicates | Each add is a write that can double on retry (needs MM-624). | One all-or-nothing write (needs MM-625), guarded once. |
| Understanding | "Added" and "logged" are the same thing, simple. Totals on the Food screen move during the session. | One review point matching the AI flow the person already knows. Totals move once. |
| Fit with the code | Reuses today's per-food writes. | Reuses `MealDraft` and `logMeal`'s shape and the review sibling. |

**Recommendation: the draft.** The owner asked for correcting a whole
occasion efficiently, and a reviewable list is where correction is
cheapest. It matches the AI meal review the app already has. It makes
"Log N foods" one write with one failure message. The loss on a killed app
is small and is said: the ✕ confirms, and nothing pretends to be saved.
This is decision D-1.

**The draft item.** Today's `MealItemDraft` is grams plus typed macros.
The session needs an item that carries the food's reference, origin and
portion: in effect the `FoodEntry` the amount step would have written,
without a day.

Proposal: a `SessionItem` that wraps an unsaved `FoodEntry`. The session
writes them through the batch writer. It does not extend `MealItemDraft`,
which stays the AI answer's shape. Cooking fat becomes a second item linked
to its food (§5.2).

**What the logged foods become.** Loose entries (recommended), or a named
`LoggedMeal`. Loose entries keep "several foods" distinct from "a meal" and
leave every food individually editable from its row. A "Save as a meal"
action can come later (D-2).

### 5.2 Portion and unit model

**One portion control.** A quantity field and a unit field on one line.
The unit field opens grouped choices:
- **Servings** — the food's own, by their source names: "1 cup, chopped
  (128 g)", "1 container (170 g)".
- **Weight** — g, oz, with "oz (weight)" written out wherever a fluid
  ounce could also appear.
- **Volume** — cup, tbsp, tsp, fl oz, mL (US customary), only with a
  food-specific basis.
- **Hand** — palm, cupped hand, thumb, only with a hand size.

The last unit used for this food comes first. The helper keeps saying
"≈ N g". Two or three suggested-unit chips plus "More units" is the
fallback if a dropdown tests worse for discoverability (UX question U-1 in
the appendix).

**When volume is offered** (no food-specific basis, no volume):
1. **A source serving defined in a volume unit**, such as FDC's portion
   "1 cup, chopped = 128 g".
   - The pack build keeps its unit and amount instead of flattening them
     into text.
   - Other volume units are then offered by exact US-customary ratio
     **for that same form**: 1 tbsp = 1/16 of that cup, labelled "tbsp,
     chopped".
   - No generic density is derived when the measure has a modifier such as
     chopped, sliced or packed.
2. **A density** stated by the source, or derived from an unmodified
   volume measure ("1 cup = 244 g" for milk).
3. **A per-100 mL source** (a drink): volume is exact. Weight is offered
   only with a density.

Branded servings stated in mL are ingested with their mL. Open Food Facts
liquids are read per 100 mL (H-06 confirmed both on 2026-10-27; built as
MM-650 and MM-651).

A label's own cup (240 mL) and a customary cup (236.6 mL) are never mixed:
eating the source's own unit scales by its count (`servingUnit`, as
today).

**Transition semantics.**

| Change | Proposed behavior |
| --- | --- |
| A unit with a gram or mL equivalent to another with one (g → oz, cup → tbsp of the same form, a serving with grams → g) | **Converts the same portion**: 180 g becomes 6.35 oz. The figure is rounded for display, and the exact grams are kept. A short status says what was converted. Totals don't change. |
| To a serving or unit with no common basis (g → palm, serving without grams → g) | The amount is cleared and the helper asks for it again. That is said, as MM-216 does for a method change. |
| A different serving (1 container → 1 cup) | Converts through grams when both have grams; otherwise as above. |
| The measurement method (typed path) | As MM-216: clears and asks again. A descriptive unit change under entered totals also clears, so the recorded portion never disagrees with the totals (fixes F-11's mismatch). |
| Raw, dry or cooked | Keeps the grams and changes the food, with its consequence line (as MM-151). Leaving weight and coming back restores the state chosen. |
| Calculated → entered totals ("Enter the totals myself") | Converts once, keeping alcohol (MM-204) and every extra (MM-623's fix). Never scales again. |
| Entered → calculated | Only by choosing a food again. Typed totals never become a reference silently. |

**Cooking fat.**
- Its own small amount control: tsp or tbsp with a count, and fractions.
- The fat is linked to its food (a shared group key on both entries) and
  written with it.
- The amount is what went with *this portion*. The question says "with
  this serving", never "in the pan".
- When the source names the food as fried or cooked in oil (FNDDS
  descriptions do), the question is not asked first. A line says the
  food's numbers already include its cooking fat.
- No absorbed-fat percentage is invented.
- If the food or its state changes after a fat is chosen, the fat stays
  chosen and its line restates it.
- Removing or moving the food in a bulk edit offers to take its fat with
  it.

### 5.3 Bulk contextual editing, copy and move

**Two ways in.**
1. **The meal section's ⋯ menu** (today only "Macro split") gains "Change
   time", "Move to another meal", "Move to another day" and "Copy to…".
   Each applies to every food in the slot. This needs no selection mode and
   covers the common case.
2. **"Select"** in a food's ⋯ menu enters selection mode on that day:
   - each row's trailing control becomes a checkbox, using the design
     system's check;
   - swipe-to-remove is suspended;
   - a bar says "N selected" with Time, Meal, Day, Copy, Delete and Cancel.

Long press is not the only way in. It is undiscoverable and collides with
swipe.

**Rules.**
- **Only the field chosen changes.** Nutrition, amounts, provenance,
  evidence and grade inputs are untouched. Bulk quantity or macro editing
  is out of scope.
- **Mixed values** show as "Mixed" in the chooser. The clock opens at the
  first selected food's time, or the slot's usual time.
- **A meal row selected means all its foods.** Selecting some foods of a
  meal is not offered in the first version. A meal's foods change
  together, which keeps A-2's invariant.
- **Time is a minute of the entry's own day.** Setting a time never moves
  an entry across midnight. A day move follows D-4.
- **Move** keeps the entries' ids. **Copy** makes new entries (as MM-47)
  with no time unless one is chosen (MM-570). **Delete** is the existing
  delete. These are named and confirmed differently.
- **Atomic and undoable.** One batch write (MM-625). The snack says what
  changed and offers Undo, which restores the entries as they were (an
  update back, not a re-add). A failure leaves everything as it was and is
  said in the bar.
- **Copy** gives a snack with Undo and is inert while it runs (fixes
  QA-4). "Copy to…" offers a day and a slot; "Copy to today" stays as the
  one-press default on a past day.
- **Duplicate with another amount** is a single food's action, "Log
  again…". It opens the amount step on the same food, never a bulk action.

### 5.4 Search, recents and recovery

**Ranking** (decision D-3).
- One list with the person's own foods first:
  - saved foods, then the foods and meals they have logged;
  - deduplicated by name and origin, a logged pack food shown once;
  - then pack results ranked by text relevance (an exact or leading-word
    match first, then bm25), with source reliability as a boost and the
    tie-break.
- Within a near-identical name group, the most reliable record leads, so
  MM-383's intent (a generic "Oats" above a crowd-entered look-alike)
  holds where the names tie.
- MyNetDiary documents exactly this personal-first rule: "your recently
  logged foods at the top", up to 5 recent matches, with the person's own
  short names ([finding foods][mnd-find]).

**Matching.**
- Keep prefix matching.
- Add a fallback when all-words matching finds nothing: the best partial
  match, said as "No exact match for … — closest". Never a silent empty
  list.
- Typo tolerance and synonyms ("chickn", "garbanzo"/"chickpea") are later
  work (W-D).

**Result rows.**
- Name, brand, and the first serving with its kcal ("1 cup (158 g) ·
  205 kcal").
- Per 100 g stays as the second figure for comparing.
- The trust mark and grade as today.

**Recents.**
- Meal-aware first: foods logged in this slot in the last weeks, by
  frequency and recency.
- Then other recents.
- Each row shows the amount it will repeat ("170 g · 100 kcal").
- A tap opens the food's own amount step at that amount: for a pack or
  saved food through its origin, otherwise the typed form (fixed by
  MM-623).
- A trailing add puts it straight into the meal session.
- Meals stay as one row (MM-587).
- MyNetDiary's Favorites, Staples, Meals and Recent ([logging food][mnd-log])
  and MyFitnessPal's meal-specific recents (user reports only, not
  official) support meal awareness. The evidence for MyFitnessPal is
  weak.

**Recovery.**
- No results: "Enter manually" carries the query (as today), and the
  closest-match fallback above.
- A failed log search is said like MM-411 (H-02).
- A failed save is said inline, with the form kept (MM-624).

### 5.5 Distinctions to keep on screen

| Thing | What it is | Where it lives | How it is labelled |
| --- | --- | --- | --- |
| Food entry | One food, one amount, one time | A row in its slot | Its name and amount |
| Foods logged together (session) | Several entries, the same slot and time | Rows in the slot (loose, D-2) | Each its own row |
| Logged meal | Entries sharing a meal key, from AI analysis or "Log again" | One row that opens View meal | Its name and "N foods" |
| Saved food or recipe | A reusable definition, never a log | Saved (My foods) | "Your food" / "Your recipe" |
| Meal template (later) | A saved set of foods to log again | Saved | "Your meal" |
| AI estimate | A logged meal whose foods carry evidence and the photo-estimate method | As a logged meal | Its evidence and "estimate" |

---

## 6. Prioritized workstreams

Effort is relative: **S** is one small PR, **M** is a PR with a new
component or domain function, **L** is several PRs or a data-format
change. Each increment gets its ticket when it is scheduled, not before.

### W-A · Correctness and reliability (prerequisites; ticketed)

**A1. MM-623 — re-log keeps what it reuses.** S–M.
- **Scope:**
  - `fill` keeps a template entry.
  - Extras are scaled once.
  - A calculated food stays calculated, with its reference and origin.
- **Non-goals:** recents ranking.
- **Acceptance:** the ticket's three scenarios.
- **Data:** none.
- **Validation:** `relogKeepsWhatItReuses.test.tsx` un-skipped.
- **Parallel with:** A2 and A4.

**A2. MM-625 — an all-or-nothing batch writer.** M.
- **Scope:**
  - A consumer-owned `FoodEntryBatchWriter` (add, update and delete in one
    transaction, one notification), with SQL and in-memory implementations
    and a contract suite.
  - `relogMeal`, `copyEntries`, `removeMeal` and its Undo, and
    `ViewMealSheet.updateAll` move onto it.
  - `MirroredFoodLog` tells the health platform after the commit, without
    the screen waiting for it.
  - Acceptance includes the owner's report: a meal disappears in one
    redraw, never row by row.
- **Data:** no schema change.
- **Validation:** contract cases, plus `mealWritesAllOrNothing.test.ts`
  un-skipped.
- **Parallel with:** A1 and A4.

**A3. MM-624 — pending, failure said, food and fat together.** S–M.
- **Builds on:** A2 for food plus fat.
- **Scope:**
  - A pending state in the design system: `MmButton` busy, or a guard
    component.
  - An inline failure Notice like MM-591's in AddFood, the amount step,
    Estimate, relog and View meal.
  - The usual-fat preference no longer blocks the fat.
- **Validation:** `foodSaveFailures.test.tsx` un-skipped; stories for the
  pending and failed states (the `unseen` check will require them).
- **Design:** UX guard review of the busy state, including focus.

**A4. MM-626 — a meal's time in View meal.** S.
- `TimeEatenRow` writes to every food, through A2 once it exists.
- **Validation:** `loggedMealTime.test.tsx` un-skipped.
- **Decision:** the day-move rule (D-4) can land separately.

### W-B · Small, high-value improvements (need tickets)

**B1. Unit change converts the same portion.** S–M.
- **Scope:** §5.2's table, in the amount step and the edit path, with the
  conversion said in a status line.
- **Non-goals:** new units.
- **Acceptance:**
  - 180 g → oz shows 6.35 and logs the same totals.
  - g → palm clears and says so.
  - A typed unit change under entered totals clears.
- **Validation:** tests on each row of the table; a story for the
  converted state.

**B2. Recents show their amount and open the food's own amount step.** S.
- **Builds on:** A1.
- **Acceptance:** the row says "170 g · 100 kcal". A pack food reopens on
  its amount step with its servings.

**B3. Copy gives feedback; copy to another day or slot.** S.
- **Builds on:** A2.
- **Scope:** snack and Undo, inert while running, a "Copy to…" chooser.
  MM-47's "today only" limit is lifted.

**B4. A slot's ⋯ menu changes time, meal or day for all its foods.** S–M.
- **Builds on:** A2, A4.
- **Scope:** the first way into §5.3, with no selection mode.
- **Acceptance:**
  - Dinner's three foods (one of them a logged meal) all move to 6:30 PM
    in one action, with Undo.
  - Nutrition and provenance are unchanged.

**B5. "Saved" in Add food logs the food.** S.
- A press opens its amount step; Edit and Delete become row actions. A
  label read after a scan returns to that food's amount step.

**B6. Fluid ounce offered for drinks with a mL basis.** S.
- **Builds on:** C2's data, or the per-100 mL sources.
- **Built (2026-10-27):** MM-651, with C2's liquids half.

### W-C · Larger workflow changes (need tickets, stories and the panel's design pass)

**C1. The meal session.** L.
- **Builds on:** A1 to A3.
- **Scope:** §5.1 with the D-1 and D-2 answers.
  - Meal and time hoisted to the session.
  - "Add to dinner" in the amount step.
  - The "In this meal" list in search, with Change and Remove.
  - "Log N foods" as one batch write.
  - One-press add from recents.
  - The ✕ confirms before discarding a list.
- **Non-goals:** saved meal templates; a persisted draft.
- **Acceptance:**
  - Three foods to dinner with one sheet opening and the time set once.
  - Cancel logs nothing.
  - A failure logs nothing and keeps the list.
  - One food alone still logs in one press.
- **Data:** in-memory session state in `state/` or the sheet. No schema
  change.
- **Validation:**
  - Tests on each acceptance line.
  - Stories: empty session, one food, many foods (folded), failure.
  - Product designer plus UX pass, per `apps/mobile/AGENTS.md`.
- **Parallel:** with C3 and C4; not with B1 (the same files; land B1
  first).

**C2. Volume from the source, and the portion control.** L.
- **Scope:**
  - Pack build: keep FDC portions' unit and amount (a `CatalogServing`
    gains `unit?`, `amount?` and `milliliters?`).
  - Derive density only from unmodified volume measures.
  - Ingest Branded mL servings and OFF's per-100 mL basis for liquids.
  - Bump the pack format.
  - Then the grouped unit control (§5.2) in the amount step, edit and the
    meal item form.
- **Migration:**
  - A new pack format. The app must still read format-4 packs, which
    simply offer no structured volume.
  - Stored entries are unchanged: their reference already stores
    `servingMilliliters`, `servingUnit` and density.
  - The owner rebuilds and publishes the packs (`mm food build`, as in the
    handoff).
- **Validation:**
  - Pipeline tests on real FDC portion rows.
  - The fixture pack gains structured servings.
  - H-06's pack query.
  - Three spot-checked drinks against their labels.
- **Parallel:** the pipeline half is independent of every W-B item; the UI
  half follows B1.
- **Built:** volume through a serving's words, no rebuild (MM-636,
  2026-10-26); the liquids half after the H-06 check, as format 5 (MM-650)
  and the drink's amount step, edit and rows (MM-651), 2026-10-27; the packs
  rebuilt as format 5 the same day. Not built: the grouped unit control as
  one dropdown (the chips stayed, as MM-636 chose); density derived from
  unmodified volume measures (no source states one; nothing is guessed).

**C3. Selection mode and bulk actions.** M–L.
- **Builds on:** A2, B4.
- **Scope:** §5.3's second way in.
- **Acceptance:**
  - Time, meal, day, copy and delete over a mixed selection, with "Mixed"
    shown.
  - Only the chosen field changes.
  - Undo restores exactly.
  - A failure changes nothing.
- **Design:** a new composite for the selection bar (it must clear the
  snack and navigation-bar insets, MM-302), a selectable row variant, and
  the full panel pass.
- **Health:** sequential mirroring of N records (H-04); an integrations
  review before building.

**C4. Search ranking and result rows.** M.
- **Decision:** D-3.
- **Scope:**
  - Personal-first single list.
  - Relevance with a reliability boost.
  - The closest-match fallback.
  - Serving and kcal on each row.
- **Validation:** an evaluation set of about 40 everyday queries with
  expected top-3, run as a test against the fixture pack and, by the
  owner, against the installed packs. The current order is recorded first
  as the baseline.
- **Parallel:** fully parallel with C1 to C3.

**C5. Meal-aware, frequency-aware recents.** M.
- **Builds on:** A1, B2.
- **Data:** read-only queries over the log (`RecentFoodReader` gains a slot
  and frequency); no schema change.

### W-D · Later or optional

- Typo tolerance and synonyms in pack search (a spelling index or trigram
  table in the pack).
- Saved meal templates ("Save as a meal" from a session or a slot).
- Favorites, pinned by the person.
- The amount step's progressive disclosure beyond the session (the "About
  this food" fold everywhere).
- Moving some foods out of a logged meal.
- A persisted session draft, only if D-1's draft proves fragile on
  devices.
- The manual form redesign (F-14).
- F-19's meal item form on the portion control.

**Order.**

```
A1 ─┐          ┌─ B2 ── C5
A2 ─┼─ A3 ─────┼─ B3, B4 ── C3
A4 ─┘          └─ C1 (after B1)
B1 ── C2 (UI half)       C2 (pipeline half), C4: any time
```

The first increment is **A1 (MM-623)**: the smallest change that stops
reused entries losing nutrients, and every later reuse path builds on it.
A2 is the first new interface, and it unblocks the rest.

---

## 7. Product decisions

**Already settled by instructions or evidence (not asked):**
- Food is added only from a meal's "+" (MM-438). The session lives inside
  that sheet.
- The unit is never invented: volume only on a food-specific basis
  (MM-167), with no generic density.
- Undo by snack, as MM-48. Sheets keep 28 px sides; results go on the
  button with an icon (owner, 2026-10-22).
- No persisted draft store; the session stays in memory (architecture P3;
  privacy of half-entered data).
- Bulk edits change context only (time, meal, day), plus copy and delete.
  Never quantities or macros.
- Selecting part of a logged meal is not in the first version.

**Asked of the owner** (through the question tool, as `AGENTS.md`
requires). Recorded here as asked, with the recommendation first:

All four were answered on 2026-10-26; the answers follow the table.

| ID | Question | Options (recommended first) | Tradeoff |
| --- | --- | --- | --- |
| D-1 | Does a meal session save each food as it is added, or the list together? | **Together, on "Log N foods"**; or each as added | Together: a review point, one write and nothing logged on cancel, but the list is lost if the app is killed mid-session. Each as added: nothing lost, but cancel means deleting. |
| D-2 | What do foods logged together become? | **Loose entries**; or a named logged meal | Loose keeps each food a row and "meal" meaning a meal; named groups them as one row like AI meals. |
| D-3 | Should search rank by match first, with source reliability as a boost? | **Match first, reliability boosts and breaks ties**; or keep reliability first (MM-383) | Match-first fixes the owner's complaint but can put a crowd-entered record above a generic one with a similar name. Grouping near-identical names by reliability limits that. |
| D-4 | When a food or meal moves to another day, does it keep its time eaten? | **Keep it**, for foods and meals alike; or clear it, for both | Keeping matches MM-570 and "dinner yesterday was still at 7". Clearing matches MM-587's caution that a time belongs to its day. |

**Answered by the owner on 2026-10-26, each as recommended:**
- **D-1:** a session's foods are saved together, on "Log N foods".
- **D-2:** they are loose entries, not a named meal.
- **D-3:** search ranks by match first, with reliability as a boost and the
  tie-break. This supersedes MM-383's reliability-first order for search;
  the bases still decide barcode lookups.
- **D-4:** a food or a meal moved to another day keeps its time eaten.
  This supersedes MM-587's clearing.

The tickets that build C1, C4 and B4/C3 cite these answers.

---

## 8. Evaluation plan

**Task walkthroughs.**
- Counted from source today (analytical, not observed).
- Re-counted on the built increment in a story walk, then on the owner's
  phone.

Synthetic examples only.

| # | Task | Today | Target | Integrity check |
| --- | --- | --- | --- | --- |
| 1 | Add three foods to dinner | 3 sheet openings, 3 searches, ≥12 presses, time set up to 3× | 1 opening, 3 searches, ~9 presses, time set once | 3 entries, the same slot and time, one write |
| 2 | 180 g of a pack food | 4 presses + typing (grams default 100) | The same, or 3 when g was last used | Reference per 100 g, origin, `quantity 180` |
| 3 | Change that to ounces | The amount is cleared, oz worked out by hand | 1 press, 6.35 oz shown | Totals unchanged; grams exact |
| 4 | Half a cup where a basis exists | Only via a "1 cup" serving × 0.5 | Cup (and tbsp) offered | Conversion recorded as a serving or a density |
| 5 | A food with no volume basis | No volume offered (correct) | No volume offered, and why, in one line | Nothing guessed |
| 6 | 1.5 package servings | 2 presses + "1 1/2" | Unchanged | `serving × 1.5`, label method |
| 7 | Manual totals | Method change first; calories last | Totals-first for Quick add (F-14) | Entered totals, never scaled |
| 8 | Change measurement after an amount | Cleared and said (MM-216) | Unchanged | No mismatch of portion and totals |
| 9 | 2 tsp of oil with a cooked food | Not possible (1 tsp or 1 tbsp) | Count with fractions | Food and fat written together, linked |
| 10 | Repeat a recent food | 3 presses; extras lost (MM-623) | 1 press into the session, amount shown | Every extra kept and scaled once |
| 11 | One time for three entries | ~15 interactions; impossible for a logged meal | 3 (slot menu) or 5 (selection) | Only `eatenAt` changes; Undo exact |
| 12 | Move two foods to lunch | 2 × 3 presses; not possible inside a logged meal | Selection: 4 presses | Ids kept; the meal stays whole |
| 13 | Correct an AI item's amount | Grams only; lookup takes the first hit | The portion control; lookup asks | Evidence kept |
| 14 | Missing results; a failed save | Recovery is good; failure is silent | Closest match offered; failure said | Nothing duplicated or half written |

**Misunderstanding checks** (story walk, then the owner):
- Does "Add to dinner" read as already logged? Watch whether the list's
  count and "Log N foods" make the difference clear.
- Does a converted unit read as a changed portion?
- Does "Mixed" read as an error?

**Data integrity** (tests, CI):
- The batch writer's contract (a failure mid-batch leaves the log exactly
  as it was; one notification).
- Every row of §5.2's transition table.
- MM-623 to MM-626's regression tests un-skipped.
- Bulk edits leave nutrition, portion, origin and evidence byte-for-byte
  equal except the chosen field.

**Accessibility and device obligations** (add to the handoff's phone
checklist when each increment ships):
- TalkBack and VoiceOver announce the conversion, the session count, the
  selection count and the bar's actions.
- Selection mode is reachable without long press.
- A 200% text story for AddFood and FoodAmountStep, keeping "Log it" or
  "Add to dinner" reachable with the keyboard open (H-05).
- The selection bar clears the snack and the navigation bar (MM-302).
- The pending state keeps focus.

**What would show improvement.**
- Task 1 and task 11 counts at or under target in the walk.
- The search evaluation set's top-3 hit rate above the recorded baseline.
- No regression in any MM-167 test.
- The owner, logging real days on the phone, no longer needing the typed
  form for a food the app already knows.

---

## Coverage and limits

**Baseline:** main at `f5a08b4`. The working tree held only the owner's
`.claude/settings.json` edit, which was left untouched.

**Read by the chair:**
- `AGENTS.md`, `apps/mobile/AGENTS.md`, HANDOFF's "Where things stand",
  `agents/README.md`.
- `AddFoodSheet.tsx` and `FoodAmountStep.tsx` in full.
- `FoodSearchResults`, `TimeEatenRow`, `MealSection`, `ViewMealSheet`,
  `MyFoodsStep`, `showAddFoodSheet`.
- The portion domain (`unitsOffered`, `PortionUnit`, `conversionFor`,
  `gramsFor`, `scaleNutrition`, `Portion`, `ReferenceNutrition`).
- `customCatalogFood`, `copyOfPackFood`, `CustomFood`, `FoodEntry` (fields
  and `copyWith`).
- The meal domain (`MealDraft`, `MealItemDraft`, `entryOfMealItem`,
  `mealItemOfEntry`, `logMeal`, `relogMeal`, `removeMeal`,
  `entriesCopiedTo`, `copyEntries`).
- `FoodEntryWriter`, `FoodRepository`, `FoodCatalog.search`,
  `SqliteFoodPack.search`, `sourceReliability`.
- `extract.sql`'s serving rows; `candidateFromRow`.
- MM-39, MM-47, MM-167 (part), MM-438, MM-570 and MM-587 (by grep).
- The tests named in the findings.

**Read by the panel** (each report lists its own coverage):
- **Measurement:** units from source to UI, OFF and FDC sources.
- **Nutrition:** reuse paths.
- **Architecture:** writers, grouped meals, health mirror, state.
- **QA:** failure paths and test coverage.
- **UX and accessibility:** nine task walks.
- **Product designer:** hierarchy and siblings.

**Not inspected:**
- The running app, any story render, a device, a screen reader, or large
  text. Every layout statement is from source order.
- `OnlineSearchResults`, `BarcodeScanStep`, `EstimateMealStep` (beyond its
  save), `HandModel`, `MealSplitSheet`.
- The native health adapters' upsert semantics.
- `RecipeForm`'s ingredient units.
- The real installed packs' data (no query was run against them).
- MM-383, MM-408, MM-591 and MM-595 in full.

**Not run:** any test, check or build (the owner's rule). The four
regression tests were written to fail on main but have not been run. CI
validates them once un-skipped.

**External research** (accessed 2026-10-26):
- MyNetDiary's help on [finding foods][mnd-find] and [logging food][mnd-log]
  (official vendor documentation).
- For MyFitnessPal, only user-forum and competitor sources were found,
  treated as weak and not relied on for any recommendation.
- 21 CFR 101.9 and the Open Food Facts nutrition schema, via the
  measurement reviewer.
- MyNetDiary's own speed comparison was seen but not used (vendor
  marketing).

**Budget:**
- Six read-only specialists ran in parallel: about 4½ minutes of wall
  time, about 18 minutes of agent time summed.
- That is over the five-minute total in `AGENTS.md` "Usage" if that cap
  still applies after the M3–M4 push for which the owner lifted it.
- Reported here rather than hidden.

### Panel record

- **Questions:** each role got its own bounded question with no expected
  conclusion: measurement (units, source to UI); nutrition (preservation on
  reuse); architecture (sessions and bulk edits in the data layer); QA
  (repeat presses and failures); UX (nine tasks); product designer
  (hierarchy and a session shape).
- **Omitted:**
  - Training, coaching and safety: no exercise, behavior or clinical
    question.
  - Micronutrients: nutrition covered the data path.
  - React/Capacitor and integrations: referred, see U-2 and H-04.
  - Privacy: no new data flow; a persisted draft was rejected for privacy
    reasons.
- **Agreements:** F-01 was found independently by the chair, nutrition and
  UX. F-04 by the chair, UX and QA. F-06 by UX and architecture.
- **Disagreements resolved by the chair:**
  - **The designer's PD-1** (volume in edit, not in the amount step) is
    real in code but has no effect for pack foods; the root cause is
    ingestion (measurement).
  - **Nutrition's N5b and measurement's recipe case** are latent, not live
    (L-01): saved foods require a weight, and recipes store no extras.
  - **UX's T5** called the weighed-recent case a defect, and nutrition's N3
    called it an ambiguity. It is a defect, because MM-39's stated reason
    for refilling is that the amount can be changed. It is folded into
    MM-623.
  - **QA-3 (double press)** is kept in MM-624 as a missing guard, which a
    deferred-write test demonstrates. How often it happens on a device is
    a hypothesis.
- **Open referrals:**
  - **U-1 (UX):** a grouped dropdown or suggested chips for units.
  - **U-2 (React/Capacitor):** whether `overlays.options` can group
    headings, and the sheet at 200% text with the keyboard open.
  - **H-04 (integrations):** health-record upsert.

[mnd-find]: https://www.mynetdiary.com/adhelp_finding_foods.html
[mnd-log]: https://www.mynetdiary.com/help/logging-food/

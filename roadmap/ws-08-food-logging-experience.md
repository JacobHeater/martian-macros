# WS-08: Food logging experience

**Order** 8 · **Group** B · **State** partly built · **Risk** medium

## Summary
Make logging a real day fast and honest: search, barcode, edit, copy, custom
foods, rough estimates, and the nutrient detail the targets need.

## Why this is a workstream
Logging is the app's most frequent task and its least developed. What exists:
typing a food's name and macros, recent foods, marking a day complete or
partial, and the day's summary against targets. A logged entry can now be
edited and a delete undone (MM-48), and a meal or a day copied (MM-47). Search of
the installed packs works with trust tiers shown (MM-42, MM-153, both in
progress); a barcode can be scanned or typed (MM-43, in progress, untested with
a real barcode); there is no saved food yet.

The work divides cleanly in two by what it needs, and the order follows that:

- **Track A needs nothing new.** Editing, copying, rough estimates and the
  easy-to-miss prompt work on today's data model.
- **Track B needs the food pack** (WS-04): search, scanning, raw-or-cooked,
  nutrients, hand portions.

Track A is also the cheaper half and, for keeping people logging through a
weekend away, arguably the more valuable.

## Capability it unlocks
A day logged in under two minutes; entries that carry full nutrient data; an
honest record of how each entry was measured.

## Included
- Edit an entry; copy a meal or a day.
- Estimate a meal by size and kind; a light prompt for commonly missed items.
- Custom foods and recipes.
- Search the pack; store every nutrient a source provides; a detail-level
  setting.
- Barcode scanning; a raw-or-cooked switch.
- Alcohol counted honestly; a fiber guide.
- Hand-portion logging.
- Nutrition-label scanning; live lookup with consent.

## Excluded or deferred
- Building the pack, its validation and its trust tiers: WS-04. This
  workstream displays source and tier.
- Bands and rounding on the summary card: WS-06 step 4.
- Insights about intake patterns: WS-09.
- Writing nutrition to a health platform: WS-11 step 6.
- Estimating a meal from a photo: a recorded non-goal.

## Prerequisites
- **WS-03 (MM-104, MM-108, MM-99)**: the Today screen becomes Food and the
  add-food flow is rebuilt from components.
- **WS-01 (MM-61)** from step 3: custom foods, recipes and per-entry
  nutrients are new tables and columns.
- **WS-04 (MM-55)** from step 4: the reader API and a fixture pack are
  enough; the full pack is not required to build.

## Enables
No workstream is blocked on it. It improves WS-07 step 4 (jump explanation)
and WS-09 steps 1 and 8.

## Packages and surfaces
- `apps/mobile/src/food/` (to be the Food screen): `AddFoodSheet.tsx`
  and entry rows
- `apps/mobile/src/domain/FoodEntry.ts`, `QuantitySource.ts`
- `apps/mobile/src/data` (food entries gain nutrients; custom foods and recipes)
- `apps/mobile/src/foodCatalog` (consumer)
- camera and ML Kit plugins (barcode, label text)
- `apps/mobile/src/engine/TdeeEstimator.ts` (logging styles, by
  agreement with WS-02)

## Risks
- **New logging styles change the estimator's input.** The expenditure
  estimate restarts its window when the share of weighed food shifts. It
  knows two styles today. Estimates (step 2) and hand portions (step 7) are
  new ones, each with its own bias. Each needs a simulated user and a full
  estimator run before it ships.
- **The camera is the shell's own plugin.** Barcode scanning and label text
  recognition are `MmScanner` over ML Kit in `apps/mobile/android/`, with
  permissions and, on iOS, work that needs the Mac. What ML Kit sends about
  itself is MM-244's question.
- **Add-food flow sprawl.** Four ways to add food (search, scan, estimate,
  type) plus recents and custom foods. Decide the sheet's structure once, at
  the WS-03 migration, with all of them in mind.
- **Privacy.** Live lookup sends a barcode to Open Food Facts. It is opt-in,
  and it is one of the few network requests the privacy policy must list.

## Sequence
1. **Edit an entry; copy a meal or day (MM-48, MM-47).** M2. No schema
   change. Can start as soon as the component library exists.
2. **Estimated meal; easy-to-miss prompt (MM-150, MM-152).** M2. The estimate
   is a new `QuantitySource` value with 40% uncertainty; teach the
   estimator's style rule about it in the same change. The "cooked with oil"
   control in the prompt ticket needs generic foods and waits for step 4.
3. **Custom foods and recipes (MM-45).** M3. First schema change here.
4. **Search; store every nutrient; detail level; quantity, unit and basis
   (MM-42, MM-49, MM-167).** M2. Build
   against the fixture pack. Storing nutrients is one migration, and the quantity, unit and nutrition-basis
   columns of MM-167 (what was eaten, in what unit, and what the numbers are for;
   proposed, not built) belong in the same one, before MM-46; the display
   setting changes what is shown, never what is stored. Show each food's
   source and trust tier here.
5. **Barcode; raw or cooked (MM-43, MM-151).** M2.
6. **Alcohol and fiber (MM-127, MM-126).** M4. Both read nutrient fields from
   step 4. Fiber is a guide and is never judged. Done 2026-10-21: alcohol typed
   in grams or standard drinks, its line on Food and Today; the fiber line at
   Full detail and its one insight, at most monthly.
7. **Hand portions (MM-46).** M4. The estimator tells hand portions from
   weighing and from labels. Done 2026-10-21: a palm or thumb weighs by the
   food's makeup when the pack has no density, and the fitting portion comes first.
8. **Label scanning; live lookup (MM-44, MM-58).** M4. MM-44 done 2026-10-21:
   columnar panels read, unsure numbers marked; the real camera is owed on a phone.
9. **The Food screen and Add food hierarchy (MM-224) (MM-180, MM-213, MM-223, MM-225, MM-226, MM-227, MM-218, MM-219, MM-220, MM-221).** M2. Placed 2026-10-13.
- Also placed 2026-10-13 in earlier steps: step 1: MM-207; step 4: MM-169, MM-170, MM-202, MM-203, MM-204, MM-216, MM-217; step 6: MM-171; step 8: MM-172.
- Placed 2026-10-19 in step 4: MM-408 (the search results flashed on every keystroke; the packs are now asked once the typing pauses and the last results stay until the next arrive, done); MM-410 ("More results" lengthens the list by twenty while there are more, the first new row focused and announced, now that the 2026-10-19 packs give a common word hundreds of matches; done); MM-411 (a failed page of results says so; proposed, from the panel's review of MM-410).
12. **The grade, the packs' sources and their downloads (MM-380 to MM-388, MM-471).** M4. Of the download follow-ups: re-opening the catalog closes the packs of the one it replaces (MM-386, done); a pack file streams into its partial natively and only counts reach the app (MM-387, done; the release-build memory check is owed on a phone); a cancelled native download settles (MM-471, done).
13. **The camera on iOS (MM-406).** M4. `MmScanner` in Swift in the iOS shell of MM-403: a live barcode scan with AVFoundation and a label read with Vision, both on the device; the ML Kit sentences of the terms are Android's. Done 2026-10-21; its phone checks are owed.
14. **A recipe ingredient keeps the food it came from (MM-456).** M4. Done 2026-10-21: schema 20 adds the source food to `recipe_ingredients`, so a found line's weight changes in place from the food as installed.
15. **AI meal analysis (MM-586, MM-587, MM-588).** The owner, 2026-10-22. Inside Estimate: a fixed prompt for the person's own assistant, its JSON answer pasted back as one meal of several foods, each saying where its numbers came from; the meal as one row that opens to its foods. Schema 26 tags each food with its meal and its source. Then the slot is named `MealSlot` in code (MM-588), alone, once both are merged.
16. **No arrow to nowhere (MM-592).** The owner, 2026-10-22: the day stepper draws no next-day arrow on today, keeping its room.
18. **Logging that keeps what it reuses and says when it fails (MM-623 to MM-626).** Bugs from the food-logging review of 2026-10-26 (`docs/food-logging-plan.md`), each with a regression test skipped under its ID. The prerequisite for the plan's meal-oriented logging; MM-624's food-plus-fat write and MM-625 share one all-or-nothing writer.

## Done enough to unblock others
MM-42 and MM-49 are done: a food chosen from the pack is stored with every
nutrient its source provides.

## Do not start before this
Nothing is hard-blocked. Insight rules about fiber, sodium or meal patterns
are of little use before step 4.

## Parallel with
WS-05, WS-06 and WS-07. With WS-06, share the Food screen by file: the
summary card is theirs, the add-food flow and entry rows are this
workstream's.

## Requirement sources
- Built: MM-38, MM-39, MM-439, MM-40, MM-41 (log by macros, recents listed as rows, day completeness, daily summary), MM-48 (edit an entry, undo a
  delete), MM-47 (copy yesterday, copy a meal), MM-438 (food is added from a meal's "+" only), MM-45 (saved foods and
  recipes; a recipe's ingredient asks raw or cooked and its lines can be reordered).
- In progress: MM-42 (search of the installed packs and the amount step), MM-43 (scan or type a barcode; not tried with a real
  barcode), MM-150 (estimate a meal; the estimator already restarts its window when weighing gives way to estimates, tested; adherence reporting and simulator users are open),
  MM-152 (the easy-to-miss line and its setting; the cooking-fat control is open), MM-151 (raw or cooked switch; the published packs
  need a rebuild), MM-167 (quantity, unit and nutrition basis; the source food is stored, the raw/cooked state is not), MM-49 (detail level Simple/Standard/Full, fiber, sodium and alcohol stored; entry rows and the day's hero follow it; sugars and saturated fat are not in the packs), MM-46 (hand portions through a judgement-based hand model; a palm or thumb weighs by the food's makeup, the fitting portion is offered first, the estimator tells hand portions apart and the coach nudges weighing protein), MM-44 (a label is read on the device into a saved food, columnar panels included, each unsure number marked; not yet tried with the real camera). Epic: MM-37.
- Remaining: MM-58.
- Built 2026-10-21: MM-456 (a recipe's ingredient keeps the food it came from; its weight changes in place).
- Added 2026-10-22 (the owner; step 15): MM-586 (AI meal analysis, in progress), MM-587 (a logged meal as one row, View meal, in progress), MM-588 (the slot named `MealSlot` in code, proposed), MM-589 (Copy prompt refused by Android's WebView, fixed by copying by selection), MM-590 (Paste could not read the clipboard on the phone; read natively through `MmBackup`), MM-591 (Log meal did nothing over http: the meal key needed a secure context, and the failure was dropped).
- Added 2026-10-22 (the owner; step 16): MM-592 (no next-day arrow on today, in progress), MM-593 (a long press selected a control's words, in progress).
- Added 2026-10-22 (the owner; step 15): MM-594 (the assistant asks when the meal was eaten; the answer's date and time go with the meal, in progress).
- Added 2026-10-22 (the owner; step 15): MM-595 (each analysed food carries a usual portion, to be logged again), MM-596 (search finds every food and meal ever logged), both in progress.
- Added 2026-10-22 (the owner; step 15): MM-597 (a slot's ⋯ menu opens its macro split; View meal shows the meal's, in progress).
- Added 2026-10-23 (the owner; step 15): MM-598 (AI meal analysis on Add food, not inside Estimate, in progress).
- Added 2026-10-24 (the owner; step 15): MM-599 (the questions and photos in the app, sent to the assistant in one share, the photos kept by none, in progress).
- Added 2026-10-24 (the owner; step 15): MM-600 (AI meal analysis spaced from the search, the row under it full width, in progress).
- Added 2026-10-24 (the owner; step 15): MM-602 (one more question: anything else that would help the assistant, put in the prompt in the person's words; in progress).
- Built 2026-10-21: MM-127 (alcohol in standard drinks, its line on Today too), MM-126 (the fiber insight).
- Placed 2026-10-13 (MM-245), from the React conversion onward: MM-207 (Food entry deletion lacks a visible alternative to swipe, done); MM-169 (Editing a logged pack food dropped the record of which food it came from, done); MM-170 (Choosing "Raw" while weighing, then a serving, logged the raw food, done); MM-202 (An unchanged food edit rounds stored quantity and totals, done); MM-203 (Per-serving alcohol grams are not scaled with consumed energy, done); MM-204 (Converting a calculated entry to typed totals drops alcohol, done); MM-216 (Changing how a food was measured clears the amount without saying so, done); MM-217 (A found food logged by palm, cupped hand or thumb reads as an exact amount, done); MM-171 (The fiber and alcohol lines sat against the meals card, done); MM-172 (The Android release build failed after the label reader was added, done); MM-180 (Give each meal its own card); MM-213 (Saved and Estimate break mid-word at the top of the Add food sheet, done); MM-223 (Add food search and manual entry compete on the opening screen, done); MM-225 (Preview the macro-energy split before logging food, done); MM-226 (Manual nutrition does not explain what the entered values represent, done); MM-227 (Add food reference incorrectly centers Back to search, done); MM-218 (Before logging, the sheet says what it will log); MM-219 (Finding a food and typing one are told apart, and every way in stays in reach); MM-220 (The action that finishes a step is in view, says what it is waiting for, and the sheet can be left); MM-221 (Editing an entry shows what was typed, and says what its day control does).
- Placed 2026-10-19: MM-408 (The search results flash on every keystroke, done); MM-410 (See more than the first twenty results, done); MM-411 (A failed page of search results says so, proposed).
- Added 2026-10-14 (the owner, MM-305 water, sodium and micronutrients; step 10): MM-305 (epic), MM-306 (the micronutrient
  non-goal overruled), MM-308 (the log keeps micronutrients), MM-309 (labels and own foods), MM-310 (the Micros segment),
  MM-311 (the sodium limit), MM-313 (water).
- Built 2026-10-14: MM-325 (version 5: the sodium limit's column for a phone that ran the first version 4).
- Added 2026-10-21 (step 12): MM-471 (cancelling a pack download on the phone never settled it, done).
- Added 2026-10-19 (step 13): MM-406 (the camera on iOS).
- Added 2026-10-24 (step 17): MM-611 (mark a day as a Refeed or a Day off).
- Added 2026-10-26 (step 18, the food-logging review): MM-623 (a recent food logged again loses its nutrients and its food), MM-624 (a save that fails says nothing; pressed twice it logs twice; the fat can be lost), MM-625 (meal writes can leave part of a meal), MM-626 (a logged meal's time cannot be changed), all proposed.

## Notes for whoever builds it
- There is one data model for every way of logging. A hand portion or an
  estimate is an amount of food with a record of how it was measured and how
  uncertain that is. Do not add a second entry type.
- A day containing estimates can be marked complete and counts as usable. A
  rough entry is worth more to the estimator than a missing one.
- The energy check (energy must roughly match 4P + 4C + 9F, plus 7 per gram
  of alcohol and 2 per gram of fiber) has one implementation in
  `apps/mobile/src/domain`, shared with the pipeline. Today's `macrosMatchEnergy`
  is its starting point.
- Search names always state the preparation state ("Rice, white, cooked").
  The raw-or-cooked switch appears only when logging by weight a food with a
  linked pair.
- Never call a food good or bad, and never describe an entry as verified.
- The easy-to-miss prompt is suppressed for a user with the under-eating
  notice active or an eating-disorder history; it reads those flags from the
  coaching policy (WS-05) and the notice state (WS-09 step 2). Until those
  exist, suppress on the screening answer alone.
- The existing known gaps on this screen (the over-target wording, viewing a
  past day against earlier targets, the day picker, swipe to delete) are in
  the coverage ticket in WS-01. Close them when touching the code.

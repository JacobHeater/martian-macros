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
- `apps/mobile/lib/src/today/` (to be the Food screen): `add_food_sheet.dart`
  and entry rows
- `packages/domain/lib/src/food_entry.dart`, `quantity_source.dart`
- `packages/data` (food entries gain nutrients; custom foods and recipes)
- `packages/food_catalog` (consumer)
- camera and ML Kit plugins (barcode, label text)
- `packages/engine/lib/src/tdee_estimator.dart` (logging styles, by
  agreement with WS-02)

## Risks
- **New logging styles change the estimator's input.** The expenditure
  estimate restarts its window when the share of weighed food shifts. It
  knows two styles today. Estimates (step 2) and hand portions (step 7) are
  new ones, each with its own bias. Each needs a simulated user and a full
  estimator run before it ships.
- **Camera plugins on the pinned Flutter version.** Barcode scanning and
  label text recognition bring native dependencies, permissions and, on iOS,
  work that needs the Mac. Check plugin support early in step 5.
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
4. **Search; store every nutrient; detail level (MM-42, MM-49).** M2. Build
   against the fixture pack. Storing nutrients is one migration; the display
   setting changes what is shown, never what is stored. Show each food's
   source and trust tier here.
5. **Barcode; raw or cooked (MM-43, MM-151).** M2.
6. **Alcohol and fiber (MM-127, MM-126).** M4. Both read nutrient fields from
   step 4. Fiber is a guide and is never judged.
7. **Hand portions (MM-46).** M4. Needs food densities in the pack and a
   third logging style in the estimator.
8. **Label scanning; live lookup (MM-44, MM-58).** M4.

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
- Built: MM-38, MM-39, MM-40, MM-41 (log by macros, recents, day
  completeness, daily summary).
- Remaining: MM-48, MM-47, MM-150, MM-152, MM-45, MM-42, MM-49, MM-43,
  MM-151, MM-127, MM-126, MM-46, MM-44, MM-58. Epic: MM-37.

## Notes for whoever builds it
- There is one data model for every way of logging. A hand portion or an
  estimate is an amount of food with a record of how it was measured and how
  uncertain that is. Do not add a second entry type.
- A day containing estimates can be marked complete and counts as usable. A
  rough entry is worth more to the estimator than a missing one.
- The energy check (energy must roughly match 4P + 4C + 9F, plus 7 per gram
  of alcohol and 2 per gram of fiber) has one implementation in
  `packages/domain`, shared with the pipeline. Today's `macrosMatchEnergy`
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

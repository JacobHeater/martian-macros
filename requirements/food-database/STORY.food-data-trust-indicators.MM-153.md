---
id: MM-153
status: in-progress
component: food-database
related: [MM-50, MM-42, MM-43, MM-44, MM-45, MM-51, MM-52, MM-53, MM-55, MM-57, MM-58, MM-123, MM-139, MM-150, MM-151]
---

# Story: Show where a food's numbers came from and how far to trust them

## Context
The complaint users make most about food-tracking apps is not missing foods. It is wrong ones: crowd-entered items with impossible
macros, five versions of the same product that disagree, and no way to tell the good entry from the bad. The pipeline drops the worst
(MM-53) and records provenance for each food (MM-52). None of that is visible when a user chooses a food, and a user who cannot see why
one entry is better than another cannot choose well.

How good the sources actually are:
- **USDA FoodData Central, Foundation and SR Legacy** (generic foods): laboratory analyses and curated compilations. The best data
  available; values are averages of samples, and a given chicken breast varies around them.
- **USDA Branded Foods**: label data supplied by manufacturers through an industry data pool. As good as the label.
- **Open Food Facts**: label data transcribed by volunteers and by label photography, with variable completeness and occasional
  transcription errors; no systematic verification.
- **The label itself**: US regulations treat a product as misbranded only when calories, fat, sugars or sodium exceed the label by more
  than 20%, and protein and fiber need only reach 80% of it (**strong**: 21 CFR 101.9(g)). Values are also rounded (calories to 5 or 10;
  under 5 kcal may be declared as zero), which matters for foods eaten in many small servings: cooking spray, sweeteners, "zero-calorie"
  dressings.

## Decisions
Choices I made without asking (say if any is wrong):
- **Every food shows its source in words**, in search results and on the amount step: "USDA, lab-analyzed", "Manufacturer label (USDA)",
  "Community label (Open Food Facts)", "Your label scan", "Your food", "Estimate".
- **Three trust tiers, shown as one quiet mark, not a score**:
  - **Reference**: USDA generic foods.
  - **Label**: manufacturer data, a user's own scan that passed validation, community data that is complete and passes every check in
    MM-53 comfortably.
  - **Check this**: community data that passes MM-53 only near its tolerance, is missing fields, is older than five years, or disagrees
    with another source's entry for the same barcode by more than 20% in energy.
- **Search ranks by tier within relevance** (which is why generic foods come first, MM-42), and when several entries share a barcode the
  highest tier is used and the others are hidden.
- **The amount step shows what the food's label would show and nothing invented**: per 100 g and per serving, and when the tier is "Check
  this", the reason in one line ("Energy and macros barely agree: compare with the package").
- **A user can correct any food for themselves**: "Fix this food" copies it into their own foods with the edits (MM-45), and their copy is
  used for that barcode from then on. Nothing is uploaded; contributing corrections back to Open Food Facts is a later, opt-in feature
  (MM-58).
- **Rounded-to-zero foods are flagged**: an entry with 0 kcal per serving, a serving under 5 g, and fat or carbohydrate as its first
  ingredient class gets a note: "Labels may round small servings to zero. Many servings add up."
- **One standing line, in "How this works" and not on every screen**: labels are allowed to be 20% off; the coach is built to cope with
  that as long as you log the same way from week to week (MM-23, MM-123).
- **The tier of what a user eats can inform confidence later** (MM-139): a log that is mostly "Check this" entries is weaker evidence. Not
  in the first version.

Where the experts disagreed:
- The product strategist wanted a "verified" badge, as competitors have. The data-trust reviewer: nobody is verifying; "Reference" and
  "Label" say what is true. No badge that implies a check that did not happen.
- The UX strategist worried that showing doubt on a third of branded foods makes the database look bad. The engineer: it is that good,
  and users find out anyway. Showing it is what earns belief in the rest.

## Description
A tier computed in the pipeline and stored in the pack (MM-55) with its reason; source and tier shown in search and the amount step; a
local "fix this food" action.

## Acceptance Criteria
```gherkin
Scenario: Source is visible
  When a food is shown in search or the amount step
  Then its source is stated in words

Scenario: Reference first
  When "oats" is searched
  Then a USDA generic entry is listed before branded and community entries

Scenario: A doubtful entry
  Given a community entry whose energy differs from its macros by 14%
  Then it is marked "Check this" with the reason

Scenario: One barcode, two sources
  Given a barcode with a manufacturer entry and a community entry that disagree by 30% in energy
  Then scanning it returns the manufacturer entry

Scenario: Fixing a food
  When the user corrects the protein value of a scanned product
  Then their copy is saved locally and is what that barcode returns from then on
  And no network request is made

Scenario: Rounded to zero
  Given a cooking spray labelled 0 kcal per 0.25 g serving
  Then the amount step notes that labels may round small servings to zero

Scenario: No false verification
  Then no food is described as verified
```

## Notes
- Priority: should-have, with the food database (MM-50). The tier is cheap to compute in the pipeline and expensive to add later.
- The 20% cross-source disagreement rule interacts with the open question in MM-51 about which source wins on conflict; this ticket
  assumes manufacturer data wins on a barcode, which is that spike's recommendation and not yet the product owner's decision.
- Licensing: showing "Open Food Facts" as a source also serves attribution (MM-57).

## Progress
Done: the tier and its reason are computed in the pipeline and stored in the pack (MM-52, MM-55); source wording
(`food_source_label.dart`), tier wording with no "verified" (`trust_tier_label.dart`), the rounded-to-zero rule
(`rounded_to_zero_note.dart`) and the `FoodTrustMark` widget, with tests.

Not done, because the screens they belong on do not exist yet (MM-42, MM-43): ranking by tier in search, the amount-step display,
hiding lower-tier duplicates of one barcode, "Fix this food" (MM-45), the "How this works" line, and the pipeline rules still
provisional in `pack_entry_for.dart` (near-tolerance, missing fields, older than five years). The ticket stays in progress.

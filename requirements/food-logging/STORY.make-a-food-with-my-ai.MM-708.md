---
id: MM-708
status: in-progress
component: food-logging
related: [MM-43, MM-44, MM-45, MM-53, MM-153, MM-586, MM-589, MM-590, MM-599, MM-602, MM-603, MM-616, MM-642, MM-703, MM-706, MM-709, MM-710]
---

# Story: Make a food with my AI

## Context
A food with no label, a biscuit on a plate, a dish from a restaurant, something homemade, can only be typed in by hand
today. The owner (MM-703): feed a photo to a frontier model with a prompt the app writes, have it answer with the app's
own JSON, paste it back. The meal flow (MM-586, MM-599, MM-602) already does this for a sitting; this does it for a
food that is saved to be logged any number of times.

## Decisions
The owner's (MM-703): copy-paste only, never a model call; photos held only while sent; the app asks name, brand or
restaurant, what one serving is, a barcode scan, anything else, and whether it is homemade; a homemade food comes back
with the assistant's ingredients, corrected in the review, saved as one food; every food in the answer becomes one
saved food, ticked; nothing is logged; a same-name food offers Update it or Keep both; Save ends in the Library's Foods
fold; offered only from the Library's New food.

Choices made without asking (say if any is wrong):
- **`MakeFoodWithAiScreen`** (`apps/mobile/src/food/ai/`), a pushed `Screen` titled "With my AI", is the sibling of
  `AnalyzeMealStep`, in the same three parts: **Ask** (the questions and the photos, then "Send to my assistant" through
  `MealShare`, or "Copy prompt" when there are no photos or the share sheet cannot open, MM-599, MM-589), **Paste**
  ("Paste from clipboard" and the field, MM-590), **Review** (the foods, their problems, "Copy fixes for AI", Save).
- **The questions**, in order: Name (text; may be blank with a photo, the assistant names it); **Homemade** (`MmSwitchRow`;
  on, the brand field is hidden and its hint says the assistant will list what likely went into it); Brand or
  restaurant (text, optional); One serving is (text, optional, "1 biscuit") and Weighs g (optional); Barcode (a row with
  "Scan", MM-43's scanner, the code shown once read, "Remove" to drop it); Anything else (multi-line, MM-603, in the
  person's words, MM-602); Photos (up to 6, `MealPhotoCamera`). The prompt (MM-709) carries the answers and today's date
  and nothing about the person.
- **The review** lists each food as a row (the sibling of `MealItemRow`) with its name, brand, group, serving, calories
  per serving and its evidence line ("Cited: …", "Matched in your foods", "AI estimate, unverified"), expanding to a form
  (the sibling of `MealItemForm` and `CustomFoodForm`): name, brand, **group** (a chooser over `FoodGroup`), serving
  description and grams, the per-100 g numbers and micronutrients, and for a homemade food its **ingredients** as lines of
  name and grams, each removable, one addable. Every row has a check "Save this one", on by default. A problem (MM-709)
  is said on its row and the row cannot be saved until fixed or unticked.
- **A same-name food** ("You have Buttermilk biscuit already") offers two chips on the row, **Update it** (the default)
  and **Keep both**. Updating keeps the saved food's id and barcode, and never touches entries logged from it.
- **The scanned barcode** goes on the food when the answer holds one food; with several, on none, and a line under the
  barcode row says so.
- **Save** writes every ticked food (MM-710's columns: group, evidence, ingredients), closes the screen with their ids,
  and the Library opens its Foods fold on them with "Saved 3 foods" (or "Saved Buttermilk biscuit").
- **Everything the phone was handed to share is deleted** when the screen closes (`MealShare.clear`), as MM-599.
- **The copy and the send say so on their own button**, a refused copy as a notice; a screen reader hears each as a
  status (MM-586's rule).

## Description
From the Library's New food, "With my AI" asks about the food, takes its photos, sends them with the prompt to the
person's assistant, reads the answer pasted back, shows each food for review and correction, and saves the ticked ones.

## Acceptance Criteria
```gherkin
Scenario: Offered from the Library
  When "New food" is pressed in the Library
  Then "With my AI" is offered and opens the screen

Scenario: The prompt carries the answers
  Given the name "Buttermilk biscuit", homemade on, one serving "1 biscuit", "60" g, and "extra flaky" as anything else
  When "Copy prompt" is pressed
  Then the clipboard holds the prompt with those answers, today's date, the homemade instruction, and nothing about the person

Scenario: Sent with photos
  Given two photos
  When "Send to my assistant" is pressed
  Then the prompt and both photos are offered to the share sheet, and the button says it was sent

Scenario: A clean answer
  Given an answer with two foods, each cited and complete
  When it is pasted and read
  Then both rows show their name, group, serving, calories and "Cited" lines, ticked

Scenario: A homemade food's ingredients
  Given an answer for a homemade biscuit with four ingredients
  Then its form lists the four with their grams, one can be removed and one added

Scenario: A problem blocks that row
  Given a food whose calories disagree with its macros
  Then its row says so and Save is refused until it is fixed or unticked

Scenario: Same name
  Given a saved food "Buttermilk biscuit" and an answer with one by that name
  Then the row offers "Update it" and "Keep both"
  And Update it keeps the saved food's id and leaves logged entries unchanged

Scenario: Saved
  Given a clean review of three foods
  When "Save" is pressed
  Then three saved foods exist with their group, evidence and ingredients
  And the Library's Foods fold is open on them and "Saved 3 foods" is said

Scenario: Fixes go back
  Given a flagged row and a row whose grams the person changed
  When "Copy fixes for AI" is pressed
  Then the clipboard names the problem and the foods as they stand

Scenario: Unreadable
  Given text with no JSON in it
  Then the person is told the answer could not be read, and why
```

## UI/UX
- With my AI — apps/mobile/src/gallery/screens/MakeFoodWithAi.stories.tsx (Stories: MakeFoodAsk, MakeFoodAskHomemade,
  MakeFoodSent, MakeFoodCopyRefused, MakeFoodUnreadable, MakeFoodReview, MakeFoodReviewHomemade, MakeFoodReviewSameName,
  MakeFoodReviewProblems). The owner dictated the feature, so the panel pass is skipped; siblings followed:
  `AnalyzeMealStep` for the three parts, `MealItemRow` and `CustomFoodForm` for the review.
- At phone width — the same file (Story: MakeFoodReviewSmallPhone, `viewport: 'smallPhone'`), with the longest food
  name, a same-name row with both chips, the group chooser open, and every unit chip.

## Notes
- Tests: `test/food/makeFoodWithAi.test.tsx` (every scenario above), `test/format/foodPrompt.test.ts` (the prompt's own
  example reads back clean through MM-709).
- Not run locally; CI validates. Owed on the phone: the share sheet with photos, the paste, the barcode scan from here.

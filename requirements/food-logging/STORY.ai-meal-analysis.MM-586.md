---
id: MM-586
status: in-progress
component: food-logging
related: [MM-44, MM-45, MM-53, MM-141, MM-150, MM-167, MM-370, MM-382, MM-587, MM-588]
---

# Story: Analyse a meal with my own AI and paste it back

## Context
Logging a plate of six things is six searches. The person already uses an AI assistant (ChatGPT, Claude,
Gemini) that can look at photos of the plate. The app never calls an AI and never sees the photos: it
writes a prompt the person gives their assistant with the photos, and it reads back the answer the
assistant writes in a fixed format. Everything that is logged is reviewed by the person first.

**This reopens a recorded non-goal, by the product owner's decision (2026-10-22).** "No calorie or macro
estimation from a meal photo" (MM-44, `docs/non-goals.md`) was set because the app's own estimate from a
photo would have a large, unvalidated error. Here the app estimates nothing from a photo: the person's own
assistant does, outside the app, and every number is shown with where it came from and can be changed
before it is logged. The non-goal is amended to say so; the app still does no photo estimation itself.

**It does not reopen MM-141** ("No AI-generated advice at run time"). Nothing is generated in the app; only
names and numbers are imported, and any prose the assistant writes outside the code block is dropped.
Nothing the assistant writes is ever shown as advice.

## Decisions
Made with the product owner (2026-10-22, a question-and-answer session):
- **The group is called a "meal"** in what the person reads ("View meal"). In code it is a `LoggedMeal`,
  apart from the breakfast/lunch/dinner/snack slot, which the code calls `Meal` today (renaming that to
  `MealSlot` is MM-588).
- **One import is one sitting**: everything eaten, however many photos or plates (a buffet, seconds,
  dessert), as one flat list of items. Plates are not kept apart.
- **It lives inside Estimate**: Estimate opens with the choice of AI meal analysis or the hand estimate
  (MM-150). The add-food sheet's row of buttons does not grow. *Superseded by MM-598 (owner, 2026-10-23):
  the analysis is offered on the add-food sheet's first view, and no longer inside Estimate.*
- **The prompt is fixed** and holds nothing about the person (no targets, diet or history), since it goes
  to a third party. It works with any assistant and cannot be edited in the app.
- **The prompt makes the assistant ask** for the meal's name (required), how much was actually eaten, and
  the brand or restaurant when there is one. *Superseded by MM-599 (owner, 2026-10-24): the app asks these
  itself and puts the answers in the prompt; and the app may hold the photos while it sends them, keeping
  none.*
- **The answer is JSON in a code block**, with `"format": "martian-macros-meal"` and `"version": 1`. Not
  YAML: chat apps break indentation on copy, and YAML needs a parser the app does not have.
- **Every item must carry** name, grams, kcal, protein, carbohydrate, fat, fiber, total sugars, saturated
  fat and sodium (the grade's inputs, MM-382), and a source. Other micronutrients are optional.
- **Where the numbers come from, for each item:**
  1. the assistant's numbers are kept when it marks them `verified` **and** cites a specific source: a
     FoodData Central id, a brand and product (a label in the photo counts), a restaurant's published
     item, an Open Food Facts code or national database entry, or a page on a well-known nutrition site;
  2. otherwise the app looks the item up in its own food packs by the plain name the assistant gives
     (`lookup`), scaled to the grams, and uses that when found;
  3. otherwise the assistant's estimate is kept, said to be unverified.
  Each item says which of these it is, in a line under it. An unverified estimate is graded like any
  other item.
- **Pasting**: a "Paste from clipboard" button, and a field the answer can be pasted into by hand. The
  JSON is found even when the assistant's chatter came with it.
- **Problems are shown on the item they belong to**, and the meal cannot be logged until each is fixed or
  the item removed. **"Copy fixes for AI"** copies a message for the assistant listing each problem and the
  meal as it stands now (the person's edits included), asking for the whole meal back, corrected, in the
  same format. Pasting that answer replaces the preview.
- **In the preview** the person can change any item's grams and numbers, remove an item, add one (typed,
  or looked up in the food packs), rename the meal, and choose "Also save to Saved".
- **It is logged to the slot the sheet was opened for, at now** (as other entries are, MM-570); both can
  be changed in the preview.

Choices I made without asking (say if any is wrong):
- **Every item is an ordinary food entry** that also carries the meal's key and name, and where its
  numbers came from. So the day's totals, the micronutrients, health writing (MM-70), the backup and the
  grade work as they do for any food.
- **A new way of measuring, "Photo estimate"**, with a relative uncertainty of 30% (between a palm and an
  estimate, MM-46, MM-150): the grams are judged from a photo even when the per-100 g numbers are cited.
  It is not offered in the typed form's "How was it measured?", since only an import makes one.
- **Changing an item's grams scales its numbers** with them and keeps where they came from (they are still
  that source's per gram); typing a number makes the item the person's own, "Entered by you", as is an item
  they add. An added item can be looked up in the app's foods by its name.
- **The checks** are the app's single energy rule (MM-53), no negative numbers, grams above 0 and at most
  3,000, no more than 900 kcal per 100 g, and the required fields present.
- **A specific citation** is one with a URL, an FDC id, a barcode, or at least three words that are not
  just a source's name ("USDA" alone is not specific). The app cannot check a citation offline; this rule
  only refuses the vague ones.
- **Saved as a recipe** of one serving made of the items (MM-45). A recipe keeps calories and macros only,
  as recipes do today.
- **A copy says so on its own button** (a check and "Prompt copied"), heard by a screen reader as a status;
  a refused copy is a notice with its warning icon. No caption is squeezed between two buttons (the owner,
  2026-10-22).
- **The clipboard is the phone's own** (the WebView's clipboard). If reading it is refused, the person is
  told to paste into the field.

## Description
Estimate offers "AI meal analysis". Its step explains the three steps, copies the prompt, reads the answer
from the clipboard or the field, and shows the meal as a preview: its name, slot and time, each item with
its grams, calories, macros, grade, source line and any problems, and the meal's total and grade. "Log
meal" logs every item as one meal (MM-587).

## Acceptance Criteria
```gherkin
Scenario: Add food offers the analysis (MM-598; was "Estimate offers the analysis")
  Given the add-food sheet is open
  Then "AI meal analysis" is offered

Scenario: The prompt is copied
  When the person presses "Copy prompt"
  Then the clipboard holds the fixed prompt
  And the prompt asks the assistant to ask for the meal's name, how much was eaten, and any brand or restaurant
  And the prompt holds nothing about the person

Scenario: A clean answer
  Given an answer with two items, each cited and verified, named "Taco night"
  When it is pasted and read
  Then the preview shows "Taco night" with both items, their numbers as the assistant gave them, and "Cited" lines
  And the meal can be logged

Scenario: Chatter around the code block
  Given an answer with a sentence before and after the JSON code block
  Then the JSON is read and the sentences are ignored

Scenario: A vague source falls back to the food packs
  Given an item marked verified whose source is only "USDA"
  And the food packs have a food whose name matches its lookup name
  Then the item's numbers are the pack food's, scaled to its grams
  And its line says it was matched in the app's foods

Scenario: Nothing to fall back to
  Given an item that is not verified and has no match in the food packs
  Then the assistant's numbers are kept and its line says "AI estimate, unverified"

Scenario: A problem blocks logging
  Given an item whose calories disagree with its macros
  Then that item is flagged with the reason
  And "Log meal" cannot be used until the item is fixed or removed

Scenario: Fixes go back to the assistant
  Given a preview with a flagged item, and an item whose grams the person changed
  When the person presses "Copy fixes for AI"
  Then the clipboard holds a message naming the problem and the meal with the changed grams

Scenario: Unreadable
  Given text with no JSON in it
  Then the person is told the answer could not be read, and why

Scenario: Logged as one meal
  Given a clean preview opened from lunch
  When the person presses "Log meal"
  Then every item is logged to lunch at the current time as one meal, under its name

Scenario: Saved for later
  Given "Also save to Saved" is on
  When the meal is logged
  Then a recipe of the meal's items is saved under its name
```

## UI/UX
- AI meal analysis — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Stories: AnalyzeMealStart,
  AnalyzeMealPromptCopied, AnalyzeMealCopyRefused, AnalyzeMealUnreadable, AnalyzeMealClipboardRefused, AnalyzeMealReview,
  AnalyzeMealChangeFood, AnalyzeMealAddFood, AnalyzeMealProblems). The owner dictated the feature, so the
  panel pass is skipped (`apps/mobile/AGENTS.md`); siblings followed: a food of the meal is a row as a
  recipe's ingredient is, and is changed under its row as a recipe line's weight is (MM-456).

## Notes
- The prompt is `apps/mobile/src/format/mealAnalysisPrompt.ts`; a change to it is reviewed here.
- Out of scope: storing the photos (they never reach the app), editing the prompt, any network call.
- Built in the owner's checkout on 2026-10-22, not yet run: tests are written for CI (owner's rule), and
  nothing has been tried on a phone. Owed on a phone: the clipboard read and write on Android and iOS.
- Where: the format and its checks in `apps/mobile/src/domain/food/meal/`, the prompt, the JSON written back
  and the fix message in `apps/mobile/src/format/`, the step in `apps/mobile/src/food/meal/AnalyzeMealStep.tsx`,
  the clipboard in `apps/mobile/src/platform/NavigatorClipboard.ts`. Schema 26 adds `logged_meal_key`,
  `logged_meal_name`, `evidence_kind` and `evidence_citation` to the food log.
- Tests: `test/domain/mealAnalysis.test.ts` (reading, the citation rule, the checks, the entry, the fix
  message, the prompt's own example), `test/food/analyzeMeal.test.tsx` (every scenario above),
  `test/platform/navigatorClipboard.test.ts`, the food repository contract (MM-586 cases) and
  `test/data/upgrade.test.ts` (version 25 to 26).

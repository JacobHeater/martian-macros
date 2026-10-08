---
id: MM-44
status: proposed
component: food-logging
related: [MM-37, MM-38, MM-43, MM-45, MM-53]
---

# Story: Read the nutrition label when the barcode is unknown

## Context
No database has every product. The fallback for a missing packaged food should not be typing eight numbers off a label.

## Decisions (made with the product owner)
- **The label is read on the device** (ML Kit text recognition), and fills in a custom food.
- **What it reads passes the same energy check as any other entry** (MM-53).
- **Estimating a meal from a photo is out of scope** for the first version: it needs a server or a large on-device model, and its error
  (about 30%) is too high.

Choices I made without asking (say if any is wrong):
- **The user always reviews the numbers before saving.** Fields the reader was unsure of are marked.
- **It reads the US Nutrition Facts layout**: serving size, calories, total fat, total carbohydrate, protein, and where present fiber,
  sugars, saturated fat and sodium.
- **The result is saved as a custom food tied to the barcode** (MM-45), so the next scan of that product finds it.

## Description
From an unknown barcode, or directly from the add-food sheet, the user photographs a Nutrition Facts panel. The app fills a form with what
it read, the user corrects it, names the food, and saves or logs it.

## Acceptance Criteria
```gherkin
Scenario: A clear label
  Given a flat, well-lit Nutrition Facts panel
  When it is photographed
  Then serving size, calories, fat, carbohydrate and protein are filled in correctly

Scenario: A misread digit
  Given the reader returns 800 kcal for a label whose macros add up to 180
  Then the calories field is flagged and the user is asked to check it

Scenario: Remembered
  Given a label was scanned after an unknown barcode and saved
  When that barcode is scanned again
  Then the saved food is found
```

## Notes
- Open question: offering to contribute the food to Open Food Facts. Good citizenship, but it means a network call and an account or
  anonymous-contribution flow. Decide after the basic path works.

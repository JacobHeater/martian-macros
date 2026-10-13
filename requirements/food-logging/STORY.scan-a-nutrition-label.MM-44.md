---
id: MM-44
status: in-progress
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

## Progress
Built: `parseNutritionLabel` (domain) reads the US Nutrition Facts layout from recognised text: serving size and its weight,
calories (never "calories from fat"), total fat, total carbohydrate, protein, fiber and sodium; it tolerates line breaks between
label and value and the letters o, l and | mistaken for digits, and leaves what it did not find empty. In the saved-food form,
"Read the nutrition label" takes a photo (`image_picker`), reads it on the phone (`google_mlkit_text_recognition`, bundled model, no
upload, the photo is not kept) and fills the form, then says to check every number and names what it did not find. The form's existing
energy check flags calories that disagree with the macros (800 against 182 is flagged). When a scanned barcode is not in the packs,
"Read the label" opens that form with the barcode already attached, so scanning it again finds the saved food (MM-45). Tests:
`parse_nutrition_label_test.dart` and `label_read_test.dart` (clear label, misread digit, unreadable photo, cancelled camera, unknown
barcode read and saved), with the camera and recogniser faked.

Not built or not verified: the real camera and ML Kit have not been run on the emulator or a phone, so how well the parser copes with
real photographs is unknown; panels whose labels and values sit in separate columns are not read; sugars and saturated fat are not
read (a saved food has no place for them yet); unsure fields are not individually marked, only the calories-versus-macros check and
the missing-fields note; the iOS build with ML Kit is untried; contributing to Open Food Facts is undecided.

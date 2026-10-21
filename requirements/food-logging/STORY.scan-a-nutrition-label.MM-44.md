---
id: MM-44
status: done
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

Built (2026-10-21, React app): **columnar panels and per-field unsure marks.** `readLabelColumns` reads a panel whose
labels and values the recogniser returned in separate columns: a run of three or more label lines, then the value
lines, paired in order with percent-only lines set aside. It pairs only when the two runs are the same length; a column
it cannot line up is not read at all, and the plain read is kept from taking the number under its last label. A value
whose printed unit does not fit its label (fat in mg) is left empty. `LabelReading.unsure` names the numbers to check:
a value paired by position, a digit repaired from a look-alike letter, more grams of a nutrient than the serving
weighs, or more energy than pure fat could give. The saved-food form says "Unsure: check it" under each marked field,
in the warning style, until that field is changed, and the note says marked numbers were hard to read. Sugars and
saturated fat are read and saved through the food's nutrients (MM-309), so they need no schema change. Tests:
`parseNutritionLabel.test.ts` ("a panel read in two columns", "unsure marks"), `labelRead.test.tsx` ("a panel read in
columns fills the form with each number marked unsure until changed"); story `Food/NewOwnFoodLabelUnsure`. Not run
locally; CI validates.

Choices I made without asking (say if any is wrong):
- **A column is three or more labels in a row**, so a label with its value on the next line is still read as before.
- **Only position-paired, repaired or impossible numbers are marked.** Calories that disagree with the macros keep
  their own warning (MM-53), which says more than "unsure".

Elsewhere: the iOS build of the label reader is MM-406. Contributing a food to Open Food Facts stays undecided (Notes);
it is not part of this story's acceptance criteria and needs its own ticket if the owner wants it.

## Owed on a phone
- A real Nutrition Facts panel photographed with the camera and read by ML Kit on the Android emulator or a phone: how
  well the parser and the column reader cope with real photographs.

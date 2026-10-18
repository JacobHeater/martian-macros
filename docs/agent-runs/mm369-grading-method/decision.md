# Panel decision: how a food is graded (MM-369)

- **Facts versus proposals and traceability.** One read-only research report by the nutrition role at f2e8dfe (8 findings and a recommendation); the chair measured coverage on the published packs and wrote `docs/food-grades.md`.
- **Coverage.** The food data shapes across pack, custom, recipe, entry and portion; the pipeline's extraction; the design seam; the register. Not read by the role: every PDF and DOCX (the official FAQ V11, the Conditions of Use, the update reports); the chair has not read them either tonight.
- **Findings and disposition.**
  - *Fruit grades lower without the fruit, vegetable and legume share* (NU-1): **accepted as a disclosed deviation**; a pack category column is a follow-up for the owner.
  - *Drinks are over-graded on the general table* (NU-2): **accepted as a disclosed deviation**; the owner should see the cola example (B-).
  - *Cheese, red meat, oils and nuts differ from their own tables* (NU-3): **accepted as a disclosed deviation**; the fats table is not implemented.
  - *Scenarios the method needs* (NU-4): **accepted**; alcohol, recipes, unknown grams and the roll-up rounding are tested.
  - *Not a Nutri-Score; trademark* (NU-5): **accepted**; the app never names the mark on a badge, popover or title; one referential entry in the register with the differences; the Conditions of Use read and whether to notify are the owner's and the attorney's.
  - *The tables come from a secondary implementation* (NU-6): **accepted as a limitation** recorded in the register ("the official FAQ V11 not yet read").
  - *The register test does not scan the grade file* (NU-7): **accepted**; `foodGradeEvidence.test.ts` enumerates `FoodGradeRule`.
  - *The grade and the coach's lines may conflict* (NU-8): **recorded** for the coaching role; the popover says "the food itself, per 100 g".
- **Chair's measurement.** The packs published 2026-10-09 are format 1: 90.9% of common foods and 84.3% of barcode foods state fiber and sodium, none states sugars or saturated fat, so no pack food is graded until a format 2 pack is published (MM-307).
- **Owner decisions:** none asked tonight; the chair's choices (ship with disclosures; the twelve-step splits; alcohol at 1.2 g per 100 g) are recorded in `docs/food-grades.md` and MM-369.
- **Edit owner:** the parent session (chair).
- **Verification:** `test/engine/foodGrade.test.ts`, `test/engine/foodGradeEvidence.test.ts`, the Food tests and stories with the engine's grades. Not verified on a phone.

# Product-designer review: Add food says what it does (MM-218, MM-219, MM-220, MM-221, MM-411)

**Role:** product-designer, read-only. **Mode:** change; `feat/m2` working tree, 2026-10-19. **Render:** none; stories and components read from source.

## Walkthroughs
**(a) Granola from its label, two servings, calories typed against the macros.** Enter manually; the form with "Label serving" chosen and one serving; the name, two servings, the macros; "Logs 580 kcal · … (2 servings)" in heading weight once the totals are known, the caption gone, Log it in Ember. Then Calories 400: the helper says "Macros add up to 290 kcal; the 400 kcal typed will be logged." while the Logs line says 800. **Fails: two lines name two different figures as logged (PD-1).**
**(b) A two-serving per-serving entry corrected and moved to yesterday.** The sheet with Close, "Logged on", the stepper, "Servings" chosen, "How many" 2, the caption "Per serving: 199 kcal · …", "Edit nutrition per serving" (closes the earlier PD-08); the fields refill per serving; the Logs line without the servings bracket on a calculated edit (PD-9); Previous day, Save, the snack "Moved to Yesterday." (undrawn, PD-4).

## Findings
**PD-1 (high).** With more than one serving the calorie caution ("the 400 kcal typed will be logged") and the Logs line (800) disagree; the test uses one serving so cannot see it. Recommend the helper name the kept basis, not a logged figure: "Macros add up to 290 kcal per serving; the 400 typed is kept. Double-check the label."; one line says what is logged.
**PD-2 (medium).** "Totals only" is not the domain's word; the tile and the portion line still call the method "Estimate"/"Estimated totals" (MM-167: "Estimate means estimated totals… entered by the user"). Recommend "Estimated totals" on the chip, or one word carried through `quantitySourceLabel`; and "Nutrition for everything eaten" as the numbers' label under it.
**PD-3 (medium).** `EditFoodWithoutAmount`'s `shows` is the old notice sentence (fixed by the chair before this report arrived).
**PD-4 (medium).** States no story draws: the typed form with totals and the servings bracket; the mismatch caution beside the Logs line; "Logs an estimate" for a hand portion; the "Per serving" caption; the move snack; the "an amount" variant of Still needed. `EditFood` opens a legacy entry; `EditFoodFromThePack` draws per 100 g.
**PD-5 (medium-low).** A found own food's row opens the amount step but carries no chevron.
**PD-6 (low-medium).** The caption sits with the meal chips, the gap between it and the button; the saved-food form places it the other way; the empty name field has no helper of its own.
**PD-7 (low).** The list's last item contains a comma: "calories above zero, typed or from the macros".
**PD-8 (low).** The amount step explains an inert action in heading weight ("Enter an amount to see what it logs.") where the other forms use the caption pattern.
**PD-9 (low).** The servings bracket is missing on a calculated edit.
**PD-10 (low).** The day stepper remains a second title-size line; a `DayStepper` variant would be the owner's call.
**PD-11 (low).** The saved-food form's caution does not say which figure is kept; the estimate notice says "by hand" above a button reading "Enter manually".
**PD-12 (low).** Under results only two of the four ways in are offered, and "Estimate" changes weight from a secondary with an icon to a text action without a written reason.
No finding on MM-411.

## Audit coverage
Source inspection of the sheet, both steps, the results, the custom form, the tile, the labels, the design-system parts, the stylesheets and type roles; the Food stories; the batch's test; the earlier run's reports; MM-167, MM-223, MM-271; the direction documents. Not inspected: `MyFoodsStep`, `RecipeForm`, `BarcodeScanStep`, `MacroSplitChart`, the snack; palettes, large text, the keyboard. Referrals: ux-accessibility (the reader questions, PD-12's flow), react-capacitor (PD-10, PD-2's one home), QA (PD-3, PD-4).

## Research
Unnecessary: every claim rests on repository rules, tickets or cited source.

## Chair requests
(1) Nutrition/measurement: is `quickAdd` an estimate in the domain's sense or exact totals with the amount unknown? It decides the chip's word. (2) Does a snack's text count as a state MM-292 requires a story for?

## Unresolved product decisions
The word for the method (PD-2); Scan and Saved under results (PD-12); the day stepper's weight (PD-10).

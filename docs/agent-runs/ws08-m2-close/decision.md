# Panel decision: closing the M2 food-logging tickets (MM-167, MM-151, MM-152, MM-49, MM-150; MM-153's amount-step line)

- **Facts versus proposals and traceability.** Two read-only reviews (product-designer, UX-accessibility) of the change on
  `wt/logging` at 164d118, from source and the stories; no render was available to either reviewer. The edit owner (the WS-08
  logging agent) built the fixes, ran the tests named below and wrote this record. One round, as the brief set.
- **Owner decisions taken by the edit owner ("say if any is wrong")** are written into each ticket's "After the panel's
  review" section: the fat question follows the food's pair, not the state chosen; the Logs line names the second entry and the
  split is the food's own; the Simple form says carbs and fat are logged as 0 rather than making them nullable; "More from the
  label (optional)" unfolded, with the reason; the source's caption follows the level; the chips carry "estimated".
- **Findings and disposition.**
  - *PD-1 / UX-4 (high, blocking): the Simple form warned about hidden macros, offered "from macros" and derived calories from
    protein alone* — **accepted**: bug **MM-428**, fixed with its regression test (`detailLevel.test.tsx`).
  - *PD-10 / UX-1 (medium / high, blocking): switching "Weighed as" to Raw removed "Cooked with oil?"* — **accepted**: offered
    for a food that is cooked or has a cooked form; tested ("rice weighed raw can still add the butter", "the raw food of a
    pair, picked from search").
  - *PD-2 / UX-2 (medium / high): the Logs line, the split and the fat caption disagreed* — **accepted**: the control moved
    above the Logs line; the line ends "Plus butter as its own entry: about 34 kcal · 4 g fat."; the split is the food's own;
    the caption under the chips removed; `describedBy` therefore carries both entries. Tested.
  - *UX-3 (medium): "Which fat" had no visible label; the story's `shows` could not be found* — **accepted**: a `food-label`
    "Which fat" above the chips, as "Weighed as" has; the story shows it. (`aria-labelledby` on `MmSegmented` is a
    design-system change, left to its owner.)
  - *PD-3 (medium): ", as packaged" had no story or test* — **accepted**: story `FoodAsPackaged`; test "a packaged food logged
    by its serving says 'as packaged' on its row". While writing it: a packaged pack food's serving is now a label serving
    (MM-167's rule read from the pack's state).
  - *PD-4 (medium): tickets did not name the siblings or the one different pattern* — **accepted**: each ticket's Progress
    names the sibling; MM-49 gives the written reason for the unfolded group; `## UI/UX` sections link the stories. (The
    reviewer read the tickets before the Progress sections landed; the rest was already there.)
  - *UX-5 (medium): carbs and fat hidden at Simple are stored as 0* — **accepted in part**: the form says so in one line;
    storing unknown is an owner decision (nullable carbohydrate and fat touch the engine's sums) and is left open in MM-49.
  - *UX-7 (medium): the recent-food chips carried no "estimated" mark* — **accepted**: the chip reads "… · estimated"; tested.
  - *UX-8 (high for reader users, pre-existing): a Food row's lines were never read* — **accepted**: bug **MM-429**, fixed
    (the tile's lines describe the press) with its regression test.
  - *PD-5 / UX-10 (low): the source's caption and the fat caption stated carbs and fat at Simple* — **accepted**: both follow
    the level, on the amount step and the edit sheet.
  - *PD-6 (low): "Per 100 ml" versus "Per 100 mL"* — **accepted**: one `referenceBasisLabel`.
  - *PD-8 / UX-6 (low): a remembered Raw start had no sign why* — **accepted**: "Starts on raw, as last time." on the
    consequence caption; tested.
  - *PD-9 / UX-9 (low): "Also on the label" named two sets; the lines were not marked optional* — **accepted**: "More from the
    label (optional)".
  - *PD-7 (low): "Cooked with oil?" answered with butter or ghee* — **left to the owner**, recorded in MM-152.
  - *The UX reviewer's safety question* (should the fat question be withheld for an eating-disorder history, as the
    easy-to-miss line is) — **left to the owner**, recorded in MM-152; the control asks what went into the food, not for more.
  - *UX-3's and the contract's `aria-labelledby` note; APG radio-group note* — recorded for the design-system owner; no change.
- **Edit owner:** the WS-08 logging agent, on `wt/logging` only.
- **Verification:** `test/food/rawOrCooked.test.tsx`, `detailLevel.test.tsx`, `estimateMeal.test.tsx`, `addFoodSays.test.tsx`
  (38 passing after the fixes); the domain and contract tests; the Food stories through `stories.test.tsx`; `npm run unseen`;
  `./mm req`; the whole suite (results in the hand-back). Not verified: a render in the three palettes at 200% text, which
  both reviewers asked for and no reviewer or the edit owner had; a phone.

# Chair's record: the M2 design bugs

- **Scope.** Seven bug tickets from earlier panel runs, each saying "a design fix: drawn in Storybook, reviewed by the panel"; the stories existed, so the fixes were built and reviewed in one batch on `feat/m2`. Two read-only reviews ran in parallel from one brief, neither seeing the other.
- **Reports.** `product-designer.md` (PD-1 to PD-9) and `ux-accessibility.md` (F1 to F10; verdict pass).
- **Edits after the reviews.** The scan step's persistent status region and the `live` prop withdrawn; `HeroFactLine` rows in the hero with "in the total"; one detail pattern on Coach and the target named; the sheet-well exception to the notice hairline and the direction document; hyphenation on the title and the half-row bound on an action; `info` for the empty database row; stories `FoodWithAlcohol` (Full detail), `CoachFewDaysEstimated`, `CoachLargeText`; MM-413 proposed with its skipped guard.
- **Verification.** Typecheck clean; the batch's tests pass; the story walks rerun; `mm check` before the pull request.
- **Limitations.** The chair implements and reviews sequentially; the reviewers did not see the edited tree. No render, device or assistive technology in this session.

# Handoff: a food grade of the app's own (MM-380), fuller food packs (MM-381)

- **What this run was.** The product owner withdrew the published grading tables of MM-369 on 2026-10-18 and asked for the app's
  own method (nutrient density per calorie, with the vitamins and minerals; calories, macros, fiber and sodium required), and
  asked whether more robust food packs were due. Four read-only roles reviewed the chair's draft: nutrition, micronutrients,
  measurement, integrations. All four: build with the listed changes.
- **Where the answers are.** The method: `docs/food-grades.md`; the data: `docs/food-packs-data.md`; the reconciliation of the
  roles' findings: `decision.md`; the tickets: MM-380, MM-381, MM-382 (built), MM-383 (the source and the score, built in the
  next run), MM-388 (the fetch cache bug the next run found).
- **What changed from the draft.** Energy density starts at 3 kcal/g and stops at five points; the sugars waiver became ramps
  gated on energy density; the per-calorie floor (40 kcal) applies only to what counts against a food; the sodium scale runs on;
  the D bands moved; the vitamins and minerals count from four stated, over the stated, bounded by breadth, capped for a
  sweetened food; the popover says how many of the ten are stated; the calibration set grew to 61 foods with inputs; the
  threshold convention and the roll-up's rounding are stated and tested.
- **Open for the owner.** Listed in MM-380 as "say if any is wrong", and in `requirements/HANDOFF.md`.
- **Not verified.** On a phone; the pack build (no DuckDB on this machine).

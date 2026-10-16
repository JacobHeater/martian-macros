# Review: safety

Reviewer: safety role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm305-water-micros`; baseline `14aa735` plus the working tree. A review lens, not a clinical credential.
Saved by the chair, condensed.

## Scope and traceability
Read MM-305, MM-306, MM-310 to MM-313; `domain/food/micros/{ReferenceWithheld,referenceAmount}.ts`,
`food/MicrosPanel.tsx`, `ui/MmNutrientRow.tsx`, `settings/NutritionGoalsSection.tsx`,
`domain/NutritionGoals.ts`, `food/WaterSection.tsx`, `domain/ScreeningAnswers.ts`,
`domain/CoachingPolicy.ts`, `docs/evidence.md`, `test/engine/evidenceRegister.test.ts`. Captures:
micros-care-team martian, nutrition-goals martian. No hashes.

## Existing facts versus proposals
References are withheld for pregnancy or breastfeeding, then CKD, then under 19, each with its own line.
Sodium limit 500-6,000 mg, 2,300 suggested; CKD changes the sodium subtitle. Water goal 500-6,000 ml,
2,000 suggested, no CKD variant or high-intake note. Under-18s are blocked from coaching, so "young"
applies only at 18. The screening has no heart failure, fluid restriction or potassium-sparing medication
item.

## Audit coverage
Mode change. Source and static renders; nothing run. Not inspected: coverage maths, WaterRow, MM-312
(unbuilt), the pipelines.

## Novice mobile experience (when UX/product design is assigned)
Not addressed.

## Findings
- **SA-1 (should-fix).** Potassium and other references reach people with undiagnosed kidney impairment or
  on potassium-retaining medicines; NASEM's AIs are for the apparently healthy population. Add one line:
  "Reference amounts are for healthy adults. If a clinician has given you limits, use theirs."
- **SA-2 (consider).** "With kidney disease, your care team sets these amounts" claims too much; say "some
  of these amounts may be different for you; ask your care team."
- **SA-3 (should-fix).** MM-310 names three reasons and one line; the code has four reasons (under 19)
  and three lines. The 14-18 bands do differ, so the rule is sound but undocumented.
- **SA-4 (should-fix).** No tests for the withholding rules: every branch, precedence (pregnant and CKD),
  18 against 19, and no row given a reference while a reason applies.
- **SA-5 (should-fix).** No high-water note and no CKD or fluid-restriction note on the water goal.
  Hyponatraemia from drinking depends on rate (kidney excretion about 735-970 ml/h; reported cases median
  8 L/day; no safe upper limit set). Add a CKD subtitle; lower the maximum (for example 4 L) or keep 6 L
  with a neutral note above about 4 L.
- **SA-6 (consider).** "2,300 mg is the usual adult limit" reads as a toxicity limit; 2,300 mg is a CDRR,
  sodium has no UL. Say "the US guideline for adults".
- **SA-7 (consider; owner).** A 500 mg floor is far below the 1,500 mg AI and makes nearly every day
  "over", feeding restriction pressure with the coach line. Raise to 1,500 mg or record why 500.
- **SA-8 (should-fix).** The new safety-relevant constants (sodium and water suggestions and ranges, the
  reference table, `ReferenceWithheld`, MM-312's claim) are missing from `docs/evidence.md`.
- **SA-9 (consider; referred).** No upper limits; a supplement label could become a custom food, and the
  bar caps at 125% of the reference so 10x looks like 1.3x.

## Sources and evidence
- NASEM 2019, Dietary Reference Intakes for Sodium and Potassium, Summary,
  https://www.nationalacademies.org/read/25353/chapter/2 (and chapter/1), March 2019, accessed
  2026-10-14: sodium CDRR 2,300 mg (14+, pregnancy and lactation included); sodium AI 1,500 mg;
  potassium AI 3,400/2,600 mg; no UL for either; AIs for the apparently healthy population; caution on
  supplemental potassium with compromised kidney function.
- Rangan et al., BMJ Open 2021;11(12):e046539, https://pmc.ncbi.nlm.nih.gov/articles/PMC8663108/,
  2021-12-09, accessed 2026-10-14: mechanism, excretion rate, case volumes, risk factors, no safe upper
  limit. Read in part.
- Blocked: NIH ODS (403), NCBI Bookshelf (captcha); no claims from them.

## Research
Performed, direct. Drug-interaction evidence unverified.

## Confidence and limitations
Medium. Source inspection only; no clinician sign-off.

## Acceptance criteria and edge cases
Proposed in SA-1, SA-4, SA-5. Edge: pregnant with CKD (pregnancy line wins); 18 against 19; sodium limit
in pregnancy; fl oz bounds 17-202.

## Dependencies
Micronutrients (SA-3, SA-9); coaching (SA-2, SA-5, SA-6, MM-312 claim); UX (SA-1 placement); owner (SA-5,
SA-7).

## Safety concerns
Fluid-restricted people; undiagnosed kidney impairment with a potassium reference; restriction pressure
from a very low sodium limit. None blocking; SA-1 and SA-5 before release.

## Unresolved product decisions
Water maximum or note (SA-5); sodium floor 500 or 1,500 (SA-7); supplement labels as custom foods (SA-9).

## Verification
None run. Requested: tests of SA-4.

## Targeted challenges
None.

# Run brief

- **Task ID and requested outcome:** `mm305-water-micros`. The product owner's new food tracker
  requirements (2026-10-14): track water, track micronutrients, let the user configure a sodium goal,
  and show micronutrients on the nutrition card as a third choice beside Grams and Split. The owner's
  answers to sixteen questions are recorded in MM-305 and each story. Outcome: the design drawn in
  Storybook in every state, reviewed independently, an outcome for every finding, then the build
  finished to the reviewed design (MM-293).
- **Audit mode:** `change`. In scope: the nutrition card's Micros segment (`CalorieHero`,
  `MicrosPanel`, `MmNutrientRow`), the reference amounts and their withholding rules
  (`referenceAmount`, `ReferenceWithheld`, `microsDayOf`, `MicronutrientTotal`), the sodium limit and
  water goal in Settings (`NutritionGoalsSection`, `NutritionGoals`), the water row on the Dashboard
  (`WaterRow`) and the water section on Food (`WaterSection`), and the proposed sodium insight
  (MM-312, ticket only, not yet built). Not in scope: the pack pipeline (MM-307), label parsing and the
  custom food form (MM-309), the health write (MM-314), the Android shell, any device.
- **Baseline:** branch `feature/water-sodium-micronutrients` (stacked on PR #158), commit `14aa735`,
  plus two working-tree changes made by the chair after its own inspection and before the review:
  the water section's Glass, Bottle and Other moved into the first row of the section's group (they
  were bare on the canvas, against MM-291); the over-limit sodium row keeps the day's amount
  ("1,400 of 1,200 mg") and says "200 mg over your limit" in its note.
- **Requirements:** MM-305 (epic), MM-306 (the micronutrient non-goal overruled by the owner),
  MM-310 (Micros), MM-311 (sodium limit), MM-312 (sodium insight), MM-313 (water). Design rules:
  `design/screen-direction.md` (rules 1 to 8, rule 1 as amended by MM-291), `AGENTS.md` rule 8
  (nothing native shows), MM-108 (voice: state, never judge).
- **Existing facts and owner decisions (not for re-argument):** the non-goal is overruled; the
  nutrient list; totals with a reference marker and coverage; Micros at Full detail only as a third
  segment; sodium limit off by default, 2,300 mg suggested, Settings only, with a coach line; water by
  glass, bottle or typed amount, optional goal, plain water only, on Food and the Dashboard with a
  one-tap add.
- **Choices the chair made without asking (open to challenge):** the segment's word "Micros"; the
  three groups and their order; the bar running a quarter past the marker in one colour (`--info`);
  coverage said as "from 4 of 7 foods"; "No data yet" with no number; no reference markers in
  pregnancy, breastfeeding, kidney disease or under 19, with one line instead; sodium "over" needing
  no coverage (missing can only add); the sodium coach line as a multi-day pattern rule rather than a
  same-day line (MM-141 forbids single-day insights); the Dashboard water row's "+" action beside the
  chevron; the Food water section after the meals; the goals in a new "Nutrition goals" section
  after "Today's setup", each a switch then a number row; water amounts as litres or whole fl oz.
- **Renders supplied** (412 by 915, from the static Storybook; the files are in the chair's
  scratchpad and their paths are given in the prompts): Food/Micros (top and scrolled) in Martian,
  Light, Dark; Micros Today, Micros Empty, Micros Care Team, Micros Over Limit (three palettes); Water
  Section (three palettes), Water Goal Reached, Water Other Amount; Today/Water, Water Glass Added
  (three palettes), Water None; Settings/Nutrition Goals (three palettes), Nutrition Goals Off.
- **Roles:** product-designer (hierarchy, density, the design system), ux-accessibility (the UX
  guard: the build waits on no open blocking finding of its), micronutrients (the nutrient list, the
  reference amounts and bands, units, the withholding rules, coverage wording), coaching (the sodium
  insight's rule and words, the over-limit wording, the water goal's framing), safety (pregnancy,
  kidney disease, under 19, an upper limit, what must not be implied).
- **Omitted roles** (the reasons as recorded in `state.json`):
  - chair: The parent session chairs and owns the edits; its synthesis is decision.md.
  - training: No training change.
  - nutrition: Energy and macro targets are unchanged; the micronutrients role covers the nutrient facts.
  - measurement: No estimator or trend change; the coverage rule is a counting rule reviewed by micronutrients and UX.
  - architecture, react-capacitor, QA, privacy-security, integrations, product: the build is checked by
    the test suite and `mm check`; no new data leaves the device; MM-314's health write waits on MM-70.
- **Writer:** the parent session (Claude Opus 5.5) chairs and is the single edit owner for
  `apps/mobile`, `requirements`, `roadmap`, `docs` and this run folder. Reviewers are read-only.

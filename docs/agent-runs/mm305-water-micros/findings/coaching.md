# Review: coaching

Reviewer: coaching role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm305-water-micros`; baseline `14aa735` plus the working tree named in the brief. Report saved by the
chair as returned, condensed only where marked.

## Scope and traceability
Read MM-312, MM-311, MM-313, MM-141, MM-108, MM-126 (threshold), MM-306 and MM-310 (no ED references);
`engine/{InsightRule,InsightPriority,InsightRationing,findInsights}.ts`, `domain/CoachingPolicy.ts`
(90-157), `food/MicrosPanel.tsx`, `food/WaterSection.tsx`, `ui/MmNutrientRow.tsx`,
`settings/NutritionGoalsSection.tsx`, `dashboard/WaterRow.tsx` (grep), `test/coach/insightCard.test.tsx`,
`design/voice-and-wording.md` (glossary). Captures: micros-over-limit light, water-goal-reached martian.
No hashes (no shell).

## Existing facts versus proposals
The catalog has six rules; `proteinShort` is the only `pattern` rule. Sort is by priority then catalog
order (`findInsights.ts:126-135`). The ED filter removes only `aboutWeight` rules (`findInsights.ts:126`),
driven by `limitToProteinAndLogging` from `screening.eatingDisorderHistory` (`AppState.ts:580`). MM-141
line 32: for ED history, "pattern insights about intake are limited to protein and logging (MM-11)". The
over-limit sodium row reads "1,400 of 1,200 mg" with "200 mg over your limit", one colour. Water summary
"1.75 L · Goal reached"; no streak, badge or praise. The glossary (`design/voice-and-wording.md:33-34`)
says "targets", never "goals", for daily numbers; "goal" is the fat loss / recomp / lean gain /
maintenance mode. MM-312 is a ticket only; everything about it is a proposal.

## Audit coverage
Mode change. Inspected the insight framework at engine level, ED handling, the over-limit row, the water
summary. Not inspected: `insightText.ts`, `selectInsight`, the coverage maths, WaterRow render, Settings
render, water and micros tests. Methods: source inspection, captures, one research check; nothing run.

## Novice mobile experience (when UX/product design is assigned)
Not assigned.

## Findings
- **CO-1 (blocking).** MM-312 says the sodium rule is not suppressed for an eating-disorder history; MM-141
  line 32 limits intake pattern insights to protein and logging for that user, and the code filters only
  `aboutWeight`. "Packaged and restaurant food … the usual place to look" is a food-avoidance cue.
  Remediation: suppress `sodiumOverLimit` for ED history and enforce MM-141 in the engine with a per-rule
  property rather than `aboutWeight`. AC: given ED history and 9 of 14 days over, no sodium insight.
- **CO-2 (should-fix).** Over-days always count, under-days only with 70% coverage, so "9 of 14" can read
  as the whole fortnight while the denominator is judged days. Name the denominator ("5 of 8 days with
  enough sodium data"), add evidence rows for days judged and days left out, optionally require judged
  days to be at least half the whole days.
- **CO-3 (should-fix).** The body's health claim has no evidence-register entry (MM-141 requires MM-143).
  The CDC source opened splits sodium by where food was obtained (65% stores, 25% restaurants), not by
  processing; US-only, 2007-08. Soften to "In many diets, most sodium comes from packaged and restaurant
  food"; consider dropping "the usual place to look". Needs a title and evidence rows, and
  `insightCard.test.tsx` must include the rule.
- **CO-4 (consider).** The limit has no history, so lowering it rewrites the past and can produce a card
  the next day. Count days only from when the current limit was set, or keep a history.
- **CO-5 (consider).** State the catalog place: after `proteinShort`, before `proteinByMeal`; test the
  order when both hold.
- **CO-6 (should-fix).** MM-311 still says "Over your limit by 300 mg"; the build is better. Update the
  ticket. Optional: "over the limit you set".
- **CO-7 (should-fix; owner decision).** "Goal" breaks the glossary ("Daily water goal", "Nutrition goals",
  "Goal reached"). Amend the glossary or rename to "target". The owner used "goal".
- **CO-8 (no defect).** "Goal reached" is said once, no colour, icon, streak or badge. The Dashboard row
  never says reached; keep it, and say so in MM-313.
- **CO-9 (should-fix; referred to safety).** A 6 L goal with one-tap adding could reinforce water-loading,
  a recognised ED behaviour, with hyponatraemia risk and fluid limits in kidney disease. Not researched.

## Sources and evidence
- CDC MMWR, "Vital Signs: Food Categories Contributing the Most to Sodium Consumption — United States,
  2007-2008", https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6105a3.htm, updated 2012-02-10, accessed
  2026-10-14: 65.2% of sodium from stores, 24.8% restaurants, 10% other; US ages 2+, NHANES.

## Research
Performed, direct (WebSearch, WebFetch): does a source support the MM-312 body claim? CO-9 not researched.

## Confidence and limitations
Medium-high. Source read, nothing run; `insightText` and `selectInsight` not read; two captures.

## Acceptance criteria and edge cases
Proposed: ED history gets no sodium insight; the denominator and days left out are stated; fewer than 7
days judged gives none; a lowered limit does not reach back; ordering against `proteinShort`; dismissed,
not again for 28 days; partial days excluded.

## Dependencies
Safety (CO-1, CO-9, kidney wording); micronutrients (coverage threshold, source); UX and product designer
(CO-7); owner (CO-7).

## Safety concerns
Food-avoidance cue to ED users (CO-1); water loading (CO-9); overstated certainty (CO-2).

## Unresolved product decisions
CO-7 goal or target; CO-9 water ceiling; CO-1 confirm MM-141's ED limit applies to sodium.

## Verification
Source inspection only. Requested: engine tests for CO-1, CO-2, CO-4, CO-5; `insightCard.test.tsx` with
the rule in `every`; `npx vitest run test/coach`; `mm check`.

## Targeted challenges
None.

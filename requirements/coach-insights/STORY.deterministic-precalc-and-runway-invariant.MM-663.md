---
id: MM-663
status: done
component: coach-insights
related: [MM-604, MM-612, MM-617, MM-141, MM-108]
---

# Story: Deterministic pre-calculation engine, whole-situation archetypes, and the protein-runway mathematical invariant

## Context
On 2026-10-27 the product owner identified a critical mathematical defect and architectural limitation in the coaching analysis:
1. When remaining daily calories are positive (`kcalLeft > 0`) but insufficient to cover the calories required by the remaining protein target (`proteinLeftG * 4 > kcalLeft`, e.g., `114 g` protein remaining inside a `169 kcal` budget, which requires at least `456 kcal` of pure protein), `analyseFoodDay`, `dayAdviceOf`, `foodsThatFit` and `coachAdviceText` still order the user to consume the full remaining protein today ("114 g protein and 169 kcal left today. Get 114 g more protein in today.").
2. The coaching engine needs a unified deterministic pre-calculation layer (`ExecutiveBrief` for the Coach tab and `MealBreakdownAnalysis` for on-demand meal analysis on the Food tab) paired with cohesive, human-written whole-situation paragraph archetypes (`executiveBriefArchetypeText`, `mealBreakdownArchetypeText`) and a strict fact/safety verifier (`verifyCoachNarration`) that guarantees offline deterministic operation and bounds any optional BYOK LLM narration.

## Decisions
By the product owner, 2026-10-27:
- **Hard mathematical invariant (`proteinLeftG * 4 <= kcalLeft`):** Under no circumstances may the coach instruct a user to consume protein whose minimum caloric cost (`proteinLeftG * 4`) exceeds `kcalLeft`. When `kcalLeft >= 0` and `proteinLeftG * 4 > kcalLeft` (outside the eating-disorder `proteinOnly` safeguard where calories are hidden), the engine declares the protein deficit unrecoverable within today's calorie budget, prioritizes holding the calorie cap tonight, and directs front-loading protein in the morning.
- **Deterministic pre-calculation (`ExecutiveBrief` and `MealBreakdownAnalysis`):**
  - `executiveBriefOf` computes the intraday runway state (`onTrack`, `tightRunway`, `proteinUnrecoverable`, `overBudget`, `targetsLocked`), the primary calorie-displacement driver item/meal with its counterfactual and deterministic swap (`swapFor`), and the 7-day accountability metrics (calorie adherence, protein floor hits, logged days, weigh-ins).
  - `mealBreakdownAnalysisOf` computes a meal's share of daily calories and protein, the remaining daily runway and required protein density ($P\% = \frac{4 \cdot P}{K}$), the meal's lowest-efficiency outlier item, and a deterministic higher-efficiency replacement via `swapFor`.
- **Whole-situation archetypes and narration verifier:**
  - `executiveBriefArchetypeText` and `mealBreakdownArchetypeText` synthesize complete, cohesive multi-sentence coaching paragraphs keyed by the composite state rather than concatenating isolated micro-clauses.
  - `verifyCoachNarration` validates any candidate narration against the brief's figures, banned words (`coachBannedWords`), and active safeguards before acceptance.

## Description
1. Enforce `proteinLeftG * 4 <= kcalLeft` across `foodsThatFit`, `analyseFoodDay`, `coachAdviceText`, and `coachPhrasings` (`orderProteinUnrecoverable`).
2. Add `ExecutiveBrief`, `executiveBriefOf`, `MealBreakdownAnalysis`, and `mealBreakdownAnalysisOf` in `apps/mobile/src/engine/analysis/`.
3. Add `executiveBriefArchetypeText`, `mealBreakdownArchetypeText`, and `verifyCoachNarration` in `apps/mobile/src/format/coach/`.
4. Guard with `apps/mobile/test/engine/proteinRunwayInvariant.test.ts`.

## Acceptance Criteria
```gherkin
Scenario: Remaining protein requires more calories than remain today
  Given a day with a 2,175 kcal target and a 170 g protein target
  And logged entries totaling 2,006 kcal and 56 g protein (169 kcal and 114 g protein remaining)
  When the 1d analysis and executive brief are computed
  Then neither instructs the user to eat 114 g more protein today
  And both state that the remaining protein cannot fit inside the remaining calories, advise holding the calorie cap tonight, and direct front-loading protein in the morning

Scenario: Remaining protein fits within remaining calories
  Given a day with 610 kcal and 62 g protein remaining (248 kcal minimum required for protein)
  When the 1d analysis and executive brief are computed
  Then the protein remaining order and fitting foods are given normally

Scenario: On-demand meal breakdown identifies the outlier and a deterministic swap
  Given a logged lunch with high-calorie, low-protein items and a daily target
  When mealBreakdownAnalysisOf is computed for lunch
  Then it reports the meal's share of daily calories and protein, the required protein density for the rest of the day, the lowest-efficiency item, and a higher-efficiency replacement saving calories or adding protein

Scenario: Narration verifier rejects hallucinated numbers or banned words
  Given an ExecutiveBrief with 169 kcal and 114 g protein remaining
  When verifyCoachNarration checks a narration that invents an ungrounded number or uses a banned word
  Then verifyCoachNarration returns false so the caller falls back to the deterministic archetype
```

## Notes
- Built in `apps/mobile/src/engine/analysis/` and `apps/mobile/src/format/coach/`.
- Guarding regression and unit suite: `apps/mobile/test/engine/proteinRunwayInvariant.test.ts`.
- Not run locally; CI validates.

---
id: MM-622
status: in-progress
component: coach-insights
related: [MM-617, MM-610]
---

# Bug: "Sauce on the side" said when nothing had sauce

## Context
On 2026-10-25 at 11:19 the owner's Coach tab said "Sodium 2,522 mg, over your 1,800 mg limit. Plain buttermilk biscuits,
including one extra plain biscuit and Just Bare lightly breaded chicken breast original fillet put it there. Next time, get the
sauce on the side." Neither food had sauce. The owner: "sauce on the side bugged out this morning. it's only relevant now because
i actually had sauce." That evening's line, after sweet sesame chicken sauce, was right. Reading the code found three causes:
- `saucedOrFried` counted fried and breaded food as sauced, so the breaded fillet brought the order.
- Both sodium branches fell back to "sauce on the side" when they had no other order, sauced food or not.
- The biscuits were one food of a meal the AI logged as one (MM-587). The order looked the food up among the day's units by
  name, found no unit by that name (the unit is the meal), and so gave no swap and no half.

## Decisions
Choices made without asking (say if any is wrong):
- "Sauce on the side" and "No sauce" follow sauced food only (the tagger's `sauced`). Fried or breaded food without a sauce gets
  the swap (`swapFor`'s better preparation) or half, as any food does.
- No fallback says "sauce on the side". The sodium fallback is "drink water".
- A food a finding names that is one of the foods of a meal logged as one gets the order on its own, with the meal's name.
- "Excluding" and "not including" negate what follows them, as "without" does ("excluding sauce" is not sauced).

## Description
`sauced` in place of `saucedOrFried`, the fallbacks without the sauce order, the food lookup into meals logged as one, and the
two negation words.

## Acceptance Criteria
```gherkin
Scenario: Sodium over, nothing sauced
  Given biscuits and a breaded chicken fillet, logged as one meal, 2,522 mg of sodium against a 1,800 mg limit
  Then the sodium line does not say "sauce on the side"
  And the biscuits are swapped or halved, under the meal's name

Scenario: Sodium over, sauced food
  Given General Tso's chicken on the buffet day, 3.8x the limit
  Then the sodium line says drink water, and sauce on the side next time

Scenario: Negated sauce
  Given "Battered fried chicken pieces, excluding sauce and sesame garnish"
  Then the food is not sauced
```

## Progress
- Built 2026-10-25: `apps/mobile/src/engine/analysis/food/sauced.ts` (was `saucedOrFried.ts`), `dayAdviceOf.ts` (the lookup
  into meals logged as one, the fallback), `spanAdviceOf.ts`, `analyseFoodDay.ts`, and `excluding` and `not including` in
  `apps/mobile/src/engine/analysis/language/lexicon/sauceWords.ts`.
- Tests: `apps/mobile/test/engine/sauceOnlyWhenSauced.test.ts`; the buffet day's sodium test in
  `apps/mobile/test/engine/coachAdvice.test.ts` is unchanged and still holds.

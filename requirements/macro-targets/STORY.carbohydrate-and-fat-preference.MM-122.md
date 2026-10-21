---
id: MM-122
status: in-progress
component: macro-targets
related: [MM-119, MM-24, MM-28, MM-49, MM-121, MM-123, MM-124, MM-143, MM-486]
---

# Story: Choose my own balance of carbohydrate and fat

## Context
After protein, the app sets fat to the larger of its minimum and 25% of calories and gives the rest to carbohydrate (MM-24). Every user
gets the same shape. People's preferences differ widely, and the diet a person likes is the one they keep.

Evidence:
- **Strong**: with calories and protein matched, low-fat and low-carbohydrate diets produce nearly the same fat loss (Hall and Guo 2017
  meta-analysis of controlled feeding studies; DIETFITS 2018, 609 adults over a year).
- **Moderate**: for strength training, carbohydrate intake has little effect on performance or long-term strength in most studied
  conditions (Henselmans 2022 systematic review: no effect in 15 of 17 long-term comparisons); benefit appears mainly with very long or
  twice-daily sessions. A 2025 meta-analysis on hypertrophy points the same way.
- **Moderate, men only**: low-fat diets (about 20% of energy against 40%) lowered testosterone by 10 to 15% in controlled studies
  (Whittaker 2021, six studies, 206 men). The practical significance of a change that size is unclear; it supports having a fat floor and
  does not support any particular number above it.

So: a floor under fat is justified, and above it the split is mostly preference.

## Decisions
Choices I made without asking (say if any is wrong):
- **One control: "Carbs and fat balance"**, with three named positions and a free slider between them: *More carbs* (fat at its minimum),
  *Balanced* (the default; fat at 30% of calories), *More fat* (fat at 40% of calories).
- **The slider cannot go below the fat minimum** (MM-28), and the minimum is marked on it.
- **A carbohydrate floor of 100 g** applies unless the user turns it off with a single acknowledged switch ("I eat very low carb on
  purpose"). The floor is **judgement**: it keeps a default user who trains out of the range where training commonly feels worse during
  the first weeks, and has no claim beyond that.
- **Protein and calories are never affected** by this control.
- **The setting is a proportion, not grams**, so it carries across check-ins as calories change.
- **The explanation says the truth**: "For fat loss and muscle, this balance matters much less than calories and protein. Pick what you
  like eating."
- **The default moves from 25% to 30% fat** only when this ships; until then MM-24 stands. Built (2026-10-21):
  until the setting is kept on the phone (MM-486), an unchosen balance stays MM-24's split, and the screen
  says so ("As the app set it until you choose. Balanced is 30%."); Balanced is one tap. Moving everyone's
  default while the choice is forgotten on every restart would change targets nobody asked to change.
- **Applied to the day's targets, not stored in them** (built 2026-10-21). The check-in still issues MM-24's
  split; the balance re-splits the day's calories after protein when the day is shown (`shapedTargets`), with
  the fat minimum for this person now (`TargetShapeLimits`, from the coach's view). So a change takes effect
  today, and a day before it keeps the balance it had (the setting is kept by the day it was set).
- **Where it lives** (built): Settings > Coach > "Carbs and fat balance", a row that opens its screen, built
  like the Training days row of Settings (the control sits in its row): the three named positions, the slider
  between them starting at this person's fat minimum, the switch, and the usual day's calories, protein, fat
  and carbs under it.

Where the experts disagreed:
- The hypertrophy expert: higher carbohydrate supports training volume and should be the default for anyone lifting. The researcher: the
  evidence for that at typical gym volumes is weak. Default is Balanced; *More carbs* is one tap.
- The nutritionist wanted the fat floor raised to 25% for women on hormonal grounds. Evidence in women is thin; left at MM-28's values and
  flagged for MM-29.

## Description
A setting, stored as a proportion; the split after protein and the fat minimum (`splitCarbsAndFat`, which
`computeTargets` also uses for MM-24's default) reads it for each day shown.

## Acceptance Criteria
```gherkin
Scenario: The default
  Given 2,400 kcal and 160 g of protein, with the balance at Balanced
  Then fat is 80 g and carbohydrate is 260 g

Scenario: More carbs stops at the floor
  Given an 80 kg man on 2,400 kcal
  When the balance is set to More carbs
  Then fat is 53 g (20% of calories, which is above 0.5 g per kg) and carbohydrate is the rest

Scenario: Low calories
  Given a 60 kg woman on 1,300 kcal with 115 g of protein
  When the balance is set to More fat
  Then carbohydrate is not below 100 g, and fat takes what remains above its own minimum

Scenario: Very low carb on purpose
  Given the carbohydrate floor is switched off
  When the balance is set to More fat
  Then fat is 40% of calories even if carbohydrate falls below 100 g

Scenario: Calories change
  Given a balance set to 35% fat
  When the calorie target falls by 100 kcal at a check-in
  Then fat is still 35% of the new calories, unless the minimum requires more

Scenario: Protein untouched
  Then no position of the control changes protein or calories

Scenario: Not enough calories for everything
  Given protein, the fat minimum and the 100 g carbohydrate floor do not all fit in the calories
  Then the carbohydrate floor gives way first, and fat stays at its minimum

Scenario: Unchosen
  Given no balance has been chosen
  Then the split is MM-24's, and the screen says it is as the app set it

Scenario: Chosen from today
  When the balance is changed today
  Then today's targets on Today and Food follow it, and the days before today keep the balance they had
```

## UI/UX
- CoachRows — apps/mobile/src/gallery/screens/TargetShape.stories.tsx (Story: CoachRows). The two rows in
  Settings > Coach.
- BalanceUnchosen, BalanceMoreFat, BalanceHeldByCarbFloor — the same file. The screen unchosen, with More fat,
  and on low calories where the carb floor holds fat back and says so.
- FoodWithMoreFat — the same file. Food's hero with the day's split.

## Progress
Built 2026-10-21 against `TargetShapeRepository` and its in-memory fixture (principle 4): another branch held
the schema (MM-71), so the setting is held in memory on the phone until MM-486 adds its table. Not run
locally; CI validates. Guarding tests:
- `test/engine/carbFatBalance.test.ts`: each scenario above (Balanced, More carbs at the minimum, low
  calories, floor off, a proportion across check-ins, the minimum requiring more, the order of sacrifice,
  protein and calories untouched, unchosen = MM-24).
- `test/engine/shapedTargets.test.ts` ("splits a day by the balance chosen"); `test/state/dayTargetsOn.test.ts`
  (a past day keeps its shape).
- `test/settings/targetShape.test.tsx`: unchosen until chosen, kept from today; the floor switched off only on
  purpose.
- `test/contracts/targetShapeRepositoryContract.ts`, run in `test/fixtures/inMemoryContracts.test.ts`.
Still owed: MM-486 (the table, and the default moving to Balanced); a look at the stories in all three palettes
(the panel's fast review was source-only; its blocking findings were fixed). Open question for the safety
role: whether the "very low carb on purpose" switch needs a caution line.

## Notes
- Priority: should-have. Cheap to build and the first thing an experienced user looks for.
- When calories are so low that protein, the fat minimum and the carbohydrate floor do not all fit, the order of sacrifice is:
  carbohydrate floor first, never protein minimum, never fat minimum. State it in the code and test it.
- A ketogenic preset was discussed and left out: it is a position on this slider with the floor off, and naming it invites claims.

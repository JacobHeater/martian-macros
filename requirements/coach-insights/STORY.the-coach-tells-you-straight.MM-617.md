---
id: MM-617
status: in-progress
component: coach-insights
related: [MM-604, MM-606, MM-607, MM-609, MM-610, MM-612, MM-108, MM-141, MM-365, MM-11, MM-114, MM-92, MM-608]
---

# Story: The coach tells you straight

## Context
On 2026-10-24 the owner logged a real day and opened the Coach tab:
- breakfast: a sausage, egg and cheese biscuit with extra eggs, 691 kcal, 45 g fat;
- lunch: a Chinese buffet of 13 foods, 2,368 kcal, 103 g fat, General Tso's chicken among them;
- a snack of cookie butter;
- 3,229 kcal against a 2,175 kcal target;
- sodium 6,923 mg against a 1,800 mg limit;
- fiber 14 g against 30 g.

The tab restated the numbers ("Fat 159 g so far, against 60 g") and gave no advice. It never said the day was 1,054 kcal over, or that the buffet did it. The headline read "Protein is holding up; protein per 100 kcal is worth changing."

The owner's words: "Where is the advice? … What would a real coach do? … Tell the user when the direction of their log could've been different if they hadn't eaten so many biscuits and gravy, or so much General Tso's chicken. … You will get this coach honest, terse, direct, blunt, and it will be the equivalent of having David Goggins in your pocket."

The constraints that emptied the coach were never the owner's. Panels proposed them in MM-606, MM-607, MM-610 and MM-612:
- "never say eat less";
- "no verdict words";
- trades only from foods the person logs, or a catalog food with a group;
- a "factual" voice that stated numbers and stopped.

## Decisions
By the product owner, 2026-10-24:
- **Every fix ends in an order, not a number.**
  - The figure is the evidence.
  - The sentence says what to do: skip it, halve it, swap it, add this, stop here, drink water, back to plan.
- **Blunt, terse and direct, in the second person.**
  - "You're 1,054 kcal over. The buffet did it."
  - Verdicts on choices are allowed: "too much", "skip", "cut", "that was the mistake".
  - This overrules MM-610's sentence rules and MM-108's verdict ban for the coach's analysis.
- **Name what went wrong and what it cost.**
  - The coach says which meal and which food drove the miss, and by how much.
  - It says what the day would have been without it: "Without the General Tso's chicken you'd be 310 kcal over, not 1,054."
- **Advice for the rest of today.** When the day is already over target, the coach says how to finish it: "You're done for calories. If you eat dinner, under 400 kcal: lean protein and vegetables. No sauce."
- **Accountability, without profanity.** The owner: "It doesn't need to go so far as insulting everyone and
  swearing every second word, but … how about just some good old accountability?"
  - The coach keeps the record and holds the person to it.
  - It follows up on what it already told them: "Tuesday I told you to skip the General Tso's chicken. It's back: 744 kcal again."
  - It counts the repeats: "Third day this week over by 500 or more." "Peanut butter again: 9 of the last 14 days."
  - When advice was taken, it says so: "You skipped the biscuit three days running. That's 1,400 kcal you didn't eat."
  - This is coach-driven, from the log and the coach's own record of what it said (MM-605's announcement log, plus a record of
    the 1d advice given). It is not goals the person sets.
  - No profanity in the app's text.
- **Swaps may be any food.** Each swap names a concrete replacement, with numbers where they are known.
  - First a food the person logs.
  - Then a catalog food.
  - Then the coach's own swap table: fried → grilled or steamed; biscuit → English muffin; sausage → egg whites or turkey sausage; sauce → on the side; regular soda → diet.

Choices made without asking (say if any is wrong):
- **Kept for safety, not softness:**
  - Under 18, an eating-disorder history, the under-eating finding, pregnancy, breastfeeding and underweight keep the protected wording and safeguards of MM-606, MM-607 and MM-612.
  - The coach goes after the choices, never the person's body, weight or worth: no "fat", "lazy" or "disgusting".
- **Tomorrow is back to plan, not a punishment.** "Tomorrow: back to 2,175. Don't skip meals to make up for today." A real coach stops the binge-starve cycle, and the non-goal on compensation stands for across-day changes to targets.
- **Holding up is said bluntly too:** "Protein 155 g. Minimum hit. Keep that."
- **The headline is the day's verdict in one line, about the biggest thing:** "1,054 kcal over. The buffet did it." Strengths come after the problems.

**The voice standard** (the owner, 2026-10-24: "I like that, it's better"). The owner's buffet day must read like this:
> **1,054 kcal over. The buffet did it.** Lunch was the problem. The Chinese buffet: 2,368 kcal, more than your whole day's
> 2,175. General Tso's chicken was the worst of it: {kcal} kcal, {fat} g fat. Skip it next time, or take one spoonful. Fill the
> plate with {the meal's best protein-per-calorie food} and steamed vegetables first. Without the General Tso's you'd be {x}
> over, not 1,054. You're done eating for today. If you're hungry, dinner under 400 kcal: lean protein and vegetables. No sauce.
> Sodium 6,923 mg, 3.8× your 1,800 limit. {Foods} did it. Drink water tonight. Next time: sauce on the side. Breakfast: the
> sausage, egg and cheese biscuit, 691 kcal, 45 g fat. Swap it for two eggs on an English muffin with a slice of cheese: about
> 400 kcal, 25 g protein, half the fat. Fiber 14 g of 30. You ate almost no vegetables. Two cups at dinner. Cookie butter: 170
> kcal, 1 g protein. Does nothing for your goal. Skip it. Protein 155 g. Minimum hit. Keep that. Tomorrow: back to 2,175. Don't
> skip meals to make up for today.

**No model at run time** (MM-618, 2026-10-24): five permissively licensed models of 4B and under failed to phrase the coach
safely. The owner chose language processing, dictionaries and grammar instead: "use NLP, dictionaries, whatever. I want this
done right."

## How the coach understands food and speaks (the owner's choice, 2026-10-24)
- **Numbers first.** Anything a food's nutrients can say is never looked up by name:
  - protein per 100 kcal ("calorie-dense for its protein", "does nothing for your goal");
  - the fat share;
  - sodium per serving;
  - fiber;
  - sugar;
  - the shares of the meal and the day.
- **A food-language tagger for what numbers can't say.** It finds how a food was made and what kind it is, from its name:
  - tags such as fried, breaded, sauced, creamy, processed meat, sugary drink, dessert, pastry, refined grain, lean protein,
    vegetable, grilled, steamed, buffet;
  - deterministic: tokenizing, normalizing case, accents and plurals, and multi-word phrases ("general tso", "sweet and sour",
    "deep dish");
  - a reviewed lexicon, measured against the real catalog's names, with its coverage recorded;
  - the same name always gets the same tags.
- **Swaps found in the catalog, not only a hand table.**
  - Candidates come from the food's group (MM-616), ranked by name similarity: tokens weighted by how rare they are across the
    catalog (TF-IDF cosine).
  - They are kept only when the profile is better (MM-607's rules) and the tags say a better preparation (grilled for fried,
    sauce-free for sauced).
  - A reviewed table of classic swaps covers what name similarity can't (biscuit → English muffin, regular soda → diet).
- **A phrasing grammar, not a model.**
  - Each message is slots: lead, evidence, cause, order, consequence.
  - Each slot has several phrasings in the owner's voice, chosen deterministically for a day and a finding, so the coach doesn't
    read the same words every day.
  - The grammar handles lists ("General Tso's chicken and hot and sour soup"), plurals, number formats and capitalization.
  - Every phrasing is a reviewed string in `format/`.

## Description
1. **An advice layer on the analysis.** Every 'fix' finding (1d and span) carries an action, from:
   - the meal breakdown;
   - counterfactuals (the day without each top contributor);
   - swaps (own foods, catalog, the swap table);
   - adds (fiber, protein, water);
   - limits for the rest of today;
   - the back-to-plan line.
2. **The meal breakdown.** For a day over target, find the meal with the largest share of calories. Rank its foods by calories, fat and sodium against the protein they gave. Name the top one or two and what the day would have been without them. Inside a logged meal of several foods (the buffet), name which foods to keep (most protein per calorie) and which to skip.
3. **The swap table.** A reviewed, deterministic table in the engine. It matches foods by name keywords and food group (MM-616), and gives replacements with typical numbers per serving and a source, with an evidence register row. It is used when neither the person's foods nor the catalog give a trade.
4. **The voice.** Every coach analysis template is rewritten: terse, imperative, second person, with the number and then the order. The voice test keeps its banned list for the rest of the app. The coach's analysis text is checked against a shorter list: slurs, body words aimed at the person ("fat" as a noun or adjective for the person), "cheat", "sinful", "deserve", "earn", "burn off". It is never checked against verdict words about food or choices.
5. **The headline** names the biggest problem and its cause. With no problem, it names the biggest strength.

## Acceptance Criteria
```gherkin
Scenario: The owner's buffet day
  Given the owner's day of 2026-10-24: the biscuit at breakfast, the 13-food Chinese buffet at lunch with General Tso's chicken, cookie butter, 3,229 kcal against 2,175, sodium 6,923 mg against 1,800, fiber 14 g against 30
  When the Coach tab opens on 1d
  Then the headline says the day is 1,054 kcal over and that the buffet did it
  And a fix names General Tso's chicken, its calories and fat, says to skip it or take one spoonful, and says what the day would have been without it
  And a fix tells the rest of today: no more calories needed, and if eating, a limit with lean protein and vegetables
  And a fix says sodium is about 3.8 times the limit, names the sauces' foods, and says to drink water and get sauce on the side
  And a fix says fiber is 16 g short and to add vegetables
  And the biscuit gets a swap with numbers
  And protein is said as held, in one line
  And no line restates a number without an order

Scenario: Every fix has an order
  Given every simulated user and every span
  Then every 'fix' finding's text ends with an action sentence

Scenario: Without it
  Given a day 1,054 kcal over where one food gave 744 kcal
  Then the line says the day would have been 310 kcal over without it

Scenario: Safety holds
  Given an eating-disorder history and the owner's buffet day
  Then no line tells the person to eat less, and only protein lines are shown, as MM-612 says

Scenario: Never the person
  Then no coach analysis text calls the person fat, lazy or any body word, and none says cheat, sinful, deserve, earn or burn off

Scenario: The coach follows up on its own advice
  Given on Tuesday the coach told the person to skip General Tso's chicken
  When it is logged again on Thursday
  Then Thursday's line says it was told on Tuesday and it's back, with its calories

Scenario: Repeats are counted
  Given 3 days this week over target by 500 kcal or more
  Then a line says "Third day this week over by 500 or more" and what drove them

Scenario: Advice taken is said
  Given the coach said to skip a food that was eaten on 5 of the 14 days before, and it has not been eaten for 3 days since
  Then a line says it was skipped 3 days running and the calories that saved

Scenario: No profanity
  Then no coach text contains profanity

Scenario: Back to plan
  Given any day over target
  Then the coach's last line for the day is "Tomorrow: back to {target}. Don't skip meals to make up for today."
```

## Progress
The advice engine, 2026-10-24. Not run locally; CI validates. The words (`format/`) and accountability are next.

- **Where:** `apps/mobile/src/engine/analysis/` and its `food/`, one declaration per file, pure, no words.
  - **Contract:**
    - `CoachAdvice` keeps its shape. It gains training kinds (`train`, `addSets`, `slowDown`, `sleep`, `keepLifting`) and
      the fields the orders need: `addCategory`, `amountCups`, `amountG`, `lowProtein`, `mealName`, `on`, `noSauce`,
      `sodiumMultiple`, `sessions`, `sets`, `group`, `lifts`, `rateFraction`, `minutes`, `amountMl` and `days`. A `halve`
      with no food uses `nutrient` to say what to halve.
    - `CoachFinding` gains `cause?: CoachCause`: the meal, the logged meal's name, its calories and foods, the worst food,
      and, on a span, the day.
    - `CoachFindingKind` `close` is 1d's closing line (signal `backToPlan`).
    - `CoachFindingSections` gains `close` (never hidden) and `verdict`.
  - **The headline's facts:** `CoachVerdict` (`over`, `fix` or `holdingUp`, with the finding, `overKcal`, `targetKcal`
    and the cause), from `coachVerdictOf`, set by `arrangeCoachFindings`.
  - **1d** (`analyseFoodDay(input, today, { nowMinute })`): every fix gets its orders from `dayAdviceOf`, using
    `DayAdviceContext`, `dayUnitsOf` (a logged meal is one unit, except the meal the breakdown takes apart),
    `mealBreakdownOf`, `saucedOrFried` (the tagger, or the swap table's breaded and fried rows) and `swapFor`.
    The safeguards run through `allowedOrders` (`adviceAllowed`, then a fallback), and a fix left with no order is not
    said. Changes:
    - fiber short of the guide by 5 g is a fix by the evening;
    - sodium names the foods giving 10% of it or more, with `sodiumMultiple`;
    - "what is left" carries the rest-of-day limit, or the protein left;
    - the closing line `backToPlan` comes on any day over target;
    - the calorie line comes first on a day over the band.
  - **Spans** (`foodSpanAnalysisOf`): `spanAdviceOf` now swaps with `swapFor`, says sauce on the side only for sauced or
    fried foods, and falls back to an order every safeguard allows. A calorie line driven by one day
    (`dominantDayAdviceOf`: one day with half the span's calories over target, itself over the band) also skips that
    day's worst food, with `on` and the day's `withoutKcalOver`, and names that meal as its cause. Otherwise the top
    food is the cause.
  - **Training** (`analyseTrainingSpan`): each fix gets its orders from `trainingAdviceOf`:
    - T1: two sessions this week;
    - T2: the usual sessions a week;
    - T3: the sets that bring the group to 10 a week;
    - T6: one more set a session on each stalled lift;
    - T7: the slower pace, 7 hours' sleep and protein where the finding found them, then keep the loads;
    - X1: protein on the days it falls short;
    - X3: the water goal on training days.
  - **New `CoachAdviceRule` figures:** `swapDensityShareOfRequired` 0.85, `fiberCups` 2, `dominantDayShare` 0.5,
    `restartSessions` 2, `stalledAddSets` 1, `sleepMinutes` 420.
- **The owner's buffet day gives** (fixture `apps/mobile/test/engine/support/buffetDay.ts`, at 7:40 pm):
  - **Headline:** `verdict` `over`, `overKcal` 1,054, target 2,175. Cause: lunch, "Chinese buffet", 2,368 kcal, 13 foods,
    worst food General Tso's chicken.
  - **The calorie line** (fat 159 g with calories folded in, said first):
    - `skip` General Tso's chicken (744 kcal, 33 g fat, 32 g protein, at lunch in the Chinese buffet), with
      `orOneSpoonful`, `keepFood` "Steamed chicken with vegetables", `overKcal` 1,054 and `withoutKcalOver` 310;
    - then the swap: "steamed chicken with mixed vegetables, sauce on the side" (265 kcal, 35 g protein, 4 g fat),
      the swap table's `generalTso` row, as no food of the owner's and no catalog food qualifies.
  - **What is left:** `limitRestOfDay` 400 kcal at dinner, `noSauce`.
  - **Sodium:** `sodiumMultiple` 3.85; foods: General Tso's chicken; `drinkWater`, then `sauceOnSide`.
  - **Protein per 100 kcal:**
    - `swap` of the biscuit meal (691 kcal, 45 g fat, 31 g protein, at breakfast) for "two eggs on an English muffin
      with a slice of cheese" (390 kcal, 24 g protein, 20 g fat), the swap table's `biscuit` row;
    - `skip` cookie butter (170 kcal, 1 g protein), `lowProtein`.
  - **Fiber:** 14 g against 30.45 g; `add` vegetables, two cups, at dinner.
  - **Holding up:** protein 155 g against the 149 g minimum.
  - **Closing line:** `backToPlan` 2,175.
  - **With an eating-disorder history:** only the protein minimum and "what is left", whose one order is an add of
    32 g of protein naming no food. There is no fix, closing line or cause.
- **Tests:**
  - `apps/mobile/test/engine/coachAdvice.test.ts` covers:
    - each line of the voice standard on the buffet day;
    - before the evening, and with dinner logged;
    - safety (an eating-disorder history, pregnancy, under-eating);
    - "without it";
    - the day that drives a span;
    - every fix has an order over 12 stationary simulated users (1d and every span, food and training) and over the
      owner's fat week.
  - `apps/mobile/test/engine/trainingSpanAnalysis.test.ts` checks the orders of T1, T2, T3, X1 and X3. It now expects
    T1 not to be said under an eating-disorder history: its only order, to train, is one the safeguard forbids.
  - No existing expectation had to change.

Choices made without asking (say if any is wrong):
- **The swaps and skips go on the line they belong to.** The worst food's skip and swap go on the calorie line. The
  biscuit's swap and the cookie butter's skip go on the protein-per-100-kcal line ("calories that carried little
  protein"). The rest of today goes on "what is left", and back to plan goes on the closing line.
- **"Does nothing for your goal"** is never said of a food tagged fruit, vegetable, salad or legume.
- **Sodium under 1.5× the limit** swaps or halves its top food instead of telling you to drink water.
- **T1 under an eating-disorder history or the under-eating finding** is not said, as above.
- **The headline's "over"** needs the day over the band, not just the target. Back to plan and the rest-of-day limit
  come on any day over target.

Remaining:
- the phrasing grammar in `format/` from this data: the orders, the verdict, the closing line and the 1d fiber fix,
  which `foodFindingText` still words as a span;
- passing `nowMinute` from the clock in `CoachAnalysis`. Until then, 1d's fiber fix comes only once dinner is logged;
- accountability: the record of 1d advice given, follow-ups, repeats and advice taken;
- evidence rows for `CoachAdviceRule`;
- the tagger's lexicon, from its builder. `swapFor`'s steps are built (below); `food/ownMealSwapOf.ts` is unused and
  can go, as `swap/ownSwapOf.ts` is the own-food step.

The swaps, 2026-10-24. Not run locally; CI validates.

- **`swapFor(input: SwapInput): CoachAdviceReplacement | undefined`** (`engine/analysis/swap/`), the contract kept,
  takes the first step that gives a replacement:
  1. **The person's own food** (`ownSwapOf`): MM-607's `findTrades`, with every safeguard it keeps, tried for fat,
     calories, protein and sodium. X is the food's entries in the 56 days at its meal, as a one-day span; Y a food
     logged in that slot on 2 days or more, or a saved food logged there. X's rule is loosened for MM-607 too: a
     protein food that is breaded or fried, or has 40% of its energy from fat, can be replaced (MM-607's Progress).
  2. **The catalog's nearest better food** (`catalogSwapOf`) in the food's group (MM-616):
     - ranked by name, TF-IDF cosine over normalized words (`nameTermsOf`: case, accents, possessives, plurals;
       joining words, amounts and cooking methods left out), weighed by the group's document frequencies, which
       `TradeCatalog.nameIndexIn(group)` holds from `CatalogTradeCatalog.load` (`swapNameIndexOf`, `nearestByName`);
     - kept only in MM-607's band of calories, readable, better for a motive by MM-607's matching rules
       (`tradeGainOf`), not mostly fat or light on protein;
     - with a better preparation by the tags (`betterPreparation`): not fried or breaded when the food is, not
       sauced or creamy when it is, a diet drink for a sugary drink, and never one of those the food is not;
     - never a dessert, candy or snack food for a meal food (`sweetForMeal`);
     - the same protein source first (`proteinSourceWords`: chicken, beef, shrimp…), then the nearest name, then
       fewer calories, then the name.
  3. **The table of classic swaps** (`coachSwapTable`, `tableSwapOf`): 45 reviewed rows, matched by whole words in
     the singular and by tags (`CoachSwapMatch`), each with its replacements in order, their words for the person
     (the replacement's `name`), typical figures from USDA FoodData Central and an evidence row
     `coachSwapTable.<key>`. A replacement qualifies when it saves a fifth of the calories or two fifths of the fat,
     keeps 60% of the protein of a food with 8 g or more (`SwapRule.proteinKeptFromG`), adds no calories past
     1.1× (except on lean gain), and is no saltier where the row states its sodium (hot and sour soup).
- **Safeguards** (`swapLimitsOf`, `swapAllowed`): nothing under 18, paused, under-eating, after bariatric surgery or
  with an eating-disorder history; with kidney disease no protein-motivated swap and none adding 8 g of protein or
  more; on insulin or a sulfonylurea no swap lowering carbohydrate by more than 5 g, and none when the food's
  carbohydrate is not known; in pregnancy, breastfeeding, underweight or low body weight no swap with fewer calories.
- **The owner's day:** General Tso's chicken gets "steamed chicken with mixed vegetables, sauce on the side" (265 kcal,
  35 g protein, 4 g fat) from the table, or the catalog's steamed chicken with vegetables where the catalog has one;
  the biscuit gets "two eggs on an English muffin with a slice of cheese" (390 kcal, 24 g protein, 20 g fat); cookie
  butter gets "plain Greek yogurt with berries" (140 kcal, 18 g protein, 1 g fat), or a snack the person logs, or
  nothing with kidney disease.
- **Tests:** `apps/mobile/test/engine/swapFor.test.ts` (the buffet day with and without a catalog, the biscuit, cookie
  butter, the order, the nearest-name ranking, the same protein source, a better preparation for fried and for
  sauced, no dessert for a meal food, the calorie band, every safeguard, 50 classic names to their rows and 6 to
  none, whole-word matching, the egg roll's sodium, the burrito's share, the plain biscuit, every row reviewed and
  in the evidence register); `findTrade.test.ts` (a lean protein food is not X; a fried or fatty one can be); the
  contract `tradeCatalogContract.ts` on both implementations (the name index, its ranking, an empty group, the
  default serving).

Choices made without asking (say if any is wrong):
- **The catalog keeps MM-607's band** (0.6× to 1.1× of the food's calories at the catalog's default serving): a
  catalog food is never "eat less" in disguise. The table is not held to the floor: its rows are classic swaps at a
  typical serving, like the owner's "two eggs on an English muffin" for a 691 kcal biscuit.
- **Cooking words do not count toward the nearest name**, since the tags judge the preparation: "Fried chicken
  thigh" is as near "Chicken thigh, roasted" as a name can be. A word the group's names never use is left out of
  the name's vector.
- **Kidney disease also blocks a swap adding 8 g of protein or more**, whatever it was for, so the person's grilled
  chicken for fried chicken is not offered there but the table's grilled chicken breast, at the same protein, is.
- **The tagger is the parallel builder's.** Until it lands, `foodTagsOf` returns no tags: the table still matches by
  its words, and the preparation and dessert tests of the catalog step wait on it.
- **The table has no profanity, brand or body word in its replacements**; brand names are only keywords for
  matching what the person logged ("Coca-Cola", "frappuccino").


The food-language tagger, 2026-10-24. Not run locally; CI validates. The analysis script was run, against the local
catalog cache.

- **`foodTagsOf(name): ReadonlySet<FoodTag>`** (`engine/analysis/language/`), the contract kept, is the tags of
  `readFoodName(name)`, which also returns the tokens and the phrases found:
  1. **Tokens** (`foodTokensOf`, `foodWordOf`): lower case; accents stripped; "&" and "n" read as "and"; split on
     anything not a letter, keeping an apostrophe inside a word; a possessive dropped ("tso's" → "tso") unless the
     lexicon knows it ("chili's", the restaurant); plurals folded to the singular the lexicon knows ("cookies" →
     "cookie", "fries" → "fry", "quiches" → "quiche"), never for a word that only looks plural ("hummus",
     "asparagus", "gas", `keepPlural`); spellings read as another ("doughnut" → "donut", "barbecue" → "bbq");
     brand and packaging noise ("inc", "oz", "ct", "pack") marked as stop words; "93% lean" read before the digits
     go (90% or more is lean). Commas and brackets split a name's parts.
  2. **Phrases**: the lexicon phrases that cover the most words with the fewest phrases, so a phrase wins over its
     parts; on a tie the later phrase is the longer, as English puts the head last ("dark chocolate chips" are
     chocolate chips). A phrase stays inside one part of the name, except USDA's inverted names written with a
     comma ("cheese, cottage", "milk, chocolate"), read only where they open the name. A part that only repeats
     earlier words ("… SNACK BAR, COOKIES & CREAM") is dropped.
  3. **Cues**: "flavor"/"flavored" makes the words before it a flavor, back to a bar, chip, drink or yogurt;
     "without" and "for" cancel what follows them up to an unknown word, "no" the phrase right after it.
  4. **The head**: the last phrase that says what the food is, in the first part that says anything, before
     "with", "in", "on" or "and"; a catalog's category part ("Snacks, …") and a flavor-name drink or dessert
     ("tropical punch", "cheesecake") give way. When the head is a snack, candy, dessert, drink, sauce, snack bar,
     yogurt, cereal, jerky, protein powder or a pastry that is not bread, the other words' kinds of food are its
     flavor ("strawberry cheesecake Greek yogurt" is a yogurt; "shrimp crackers" are crackers). A dish keeps them
     ("sausage egg and cheese biscuit").
  5. **Rules** (`foodLexicon.rules`, 54, each with its reason): weak cues settle (chips fried unless baked; nuggets
     breaded unless grilled; chocolate candy only when the name is about it; butter a spread only when alone), then
     qualifiers ("diet", "zero", "unsweetened" make a sweet drink or tea a diet drink, never a juice; "lean only" makes
     beef lean), then flavors (a fruit is fruit only when the food is; a vegetable in a cake, a drink or a sausage is
     a flavor), then fried, breaded, creamy, cheesy, processed or fatty is never lean protein, and a fast-food chain
     or buffet is a restaurant.
- **The lexicon** (`foodLexicon`, families in `language/lexicon/`): 2,855 phrases (1,697 of two words or more) in
  cooking, sauce, protein, grain, sweet, drink, dairy, produce, place and qualifier families; 66 stop words, 39
  aliases, 27 words that only look plural; 38 cues (`FoodCue`). Each family's header says its choices.
- **Measured** (`tool/spikes/coach_model/lexicon/analyse.ts`; `concordance.ts` and `probe.ts` beside it) on 83,694
  catalog names: every USDA Foundation, SR Legacy and FNDDS name, 50,000 USDA Branded and 20,000 Open Food Facts
  names, a deterministic sample of the local cache:
  - **coverage**: 84.6% of names get a tag (Foundation 92.5%, FNDDS 89.5%, SR Legacy 87.1%, Branded 87.1%, Open Food
    Facts 75.9%). The untagged are mostly names with nothing to say (water, tea, coffee, oils, spices, sweeteners,
    infant formula, gum) and Open Food Facts names in other languages; `results/untagged-tokens.tsv` lists the 300
    most frequent words of untagged names;
  - **precision**: two fresh samples of 200 tagged names each (seeds `holdout9`, `holdout10`), hand-checked against
    the final lexicon and never used to tune it: **87.8% of 400 names have every tag right; 90.9% of 606 tags are
    right**. That is short of the 95% aimed for. The first hand-check, before any review, was 76.0% of names; ten
    rounds of review and fixing on other samples (`verdicts-*.tsv`) brought fresh samples to 87–92%;
  - **the misses that remain** are branded names whose flavor or brand words read as foods ("Carambar candy cola",
    "veggie bacon frittata", "Mike Ike fruits", "Candy Crush gummies"), heads the word order hides ("buffalo wings
    with ranch flavored potato crisps"), and lexicon gaps for compound product nouns. The wrong tags are mostly
    kinds of food read from a flavor (snack food 6, fruit 6, dairy 5, nut 4 of the 55), rarely a cooking method: a
    wrong fried or breaded tag came up on 3 of the 400 names.
- **Examples**: "General Tso's chicken" → fried, breaded, sauced; "Sausage egg and cheese biscuit with extra eggs" →
  processed meat, egg, cheesy, refined grain, pastry; "Diet Pepsi Cola 12 Fluid Ounce Aluminum Can (Pepsi)" → diet
  drink; "COOKIE BUTTER, CRUNCHY (LOTUS)" → dessert, spread; "Chinese buffet" → buffet, restaurant; "Air fried
  chicken" → baked, lean protein; "Unsweetened iced tea" → diet drink; "Grilled cheese sandwich" → cheesy, refined
  grain, not grilled.
- **Tests:** `apps/mobile/test/engine/foodTagsOf.test.ts`: the ticket's 11 cases and 81 more from the hand-checked
  samples; the tokenizer (case, accents, possessives, "&" and "n", stop words, parts, lean percentages), plural
  folding and the words never folded; the lexicon's hygiene (each phrase in one family, written as the tokenizer
  reads it, in the singular, no stop word alone, only known senses and every cue used); determinism; the evidence
  row `foodLexicon`.
- **To extend the lexicon:** add the phrase, singular, unaccented and lower case, to the family it belongs to in
  `language/lexicon/`; add a whole phrase where its meaning is not the sum of its words ("chicken fried steak",
  "grilled cheese"), and a `weakHead` cue where a drink or dessert is often only a flavor name. Add a case to
  `foodTagsOf.test.ts`. Then run, from `tool/spikes/coach_model/lexicon/`:
  `node --import ./resolve.mjs analyse.ts --seed <new seed>` to see coverage and draw a fresh sample, review it into
  `verdicts-<seed>.tsv` (name, tags, then `ok` or the wrong tags as `-tag`), and run it again for the precision. A
  sample reviewed once is spent: measure on a new seed after changing the lexicon. `concordance.ts` lists the most
  frequent phrases in context, the quickest way to find a word read in the wrong sense.

Choices made without asking (say if any is wrong):
- **One tag added, `nut`** (nuts and seeds): 2,474 of the sampled names name one, and they are neither legume nor
  snack food to the coach.
- **Air fried, air fryer and oven fried are baked**: dry heat with little oil, never fried. Boiled and poached are
  steamed (moist heat, no fat added); broiled, charbroiled and blackened are grilled. Stir fried, sautéed, braised,
  stewed and smoked say nothing. "Pot roast" is braised: fatty meat, not roasted. "Crunchy" is a texture; "crispy"
  is fried only on a meat, fish, egg or vegetable.
- **Chicken and turkey are lean protein** unless the name says a fatty part (thigh, wing, skin) or a fatty way; beef,
  pork and lamb are fatty meat unless the name says lean ("lean only", 90% lean or more, sirloin, tenderloin, round,
  loin, flank) and no fatty cut (shoulder, blade). Deli turkey is processed meat, which outweighs lean.
- **A juice is a sugary drink**, 100% or unsweetened; plain tea, coffee and water get no tag; sparkling water and
  seltzer are diet drinks.
- **A chain's name tags the food as the chain's**, even a product sold in shops ("Starbucks frappuccino"); names that
  are also ordinary words match only in full ("chipotle mexican grill", "domino's").
- **Precision before recall**: where a word is often a flavor, a brand or another sense, the lexicon says nothing
  rather than guess, so some foods are untagged rather than mis-tagged.

Remaining:
- precision at 95%: more review rounds on fresh samples, on the misses above.

The accountability, 2026-10-24. Not run locally; CI validates.

- **The record of advice shown** (schema 29, table `coach_advice_given`): a row for each food key, kind and day, with
  the food's name, the replacement's name (a swap), the food's calories a time and the day. Kinds: `skip`, `halve`,
  `swap`, and `taken` (the coach said the advice was taken, so it is said once).
  - `CoachAdviceRecordRepository` (`engine/analysis/accountability/`): `watchAdviceGivenSince(since)`, oldest first;
    `recordAdviceGiven(entries)`, idempotent per food key, kind and day, the first kept. `SqlCoachAdviceRecordRepository`,
    `InMemoryCoachAdviceRecordRepository`, the contract `coachAdviceRecordRepositoryContract` on both; erased with
    everything and kept in a backup.
  - Written by `CoachAnalysis.keepRecording()`, which the Coach tab's section runs while it is shown: each order about
    a food to skip, halve or swap on the span shown (1d and spans), and each advice taken said, once a day
    (`coachAdviceGivenOf`).
- **The follow-ups** (`coachFollowUpsOf`, pure, `CoachFollowUpRule`): `CoachFollowUp` data in the style of
  `CoachAdvice`, on `CoachFinding.followUps`:
  - `saidBefore`: a food told to skip or swap on day D within the last 14 days, eaten today: `food` (today's portion),
    `order`, `replacementName`, `givenOn`, `byWeekday` (within 6 days), `givenKcal`;
  - `repeatOver`: days this calendar week (Monday first) over target by 500 kcal or more, today among them, from 2:
    `days`, `overByKcal`, and the worst `food` of the biggest meal on 2 of them or more, else that `meal`, with
    `drivenDays`;
  - `repeatFat` (fat over by 1d's margin on 3 of the last 7 days, today among them) and `repeatProteinShort` (protein
    under its minimum on 3 of the 7 whole days before today): `days`, `ofDays`;
  - `adviceTaken`: a food told to skip, eaten on 3 or more of the 14 days before that advice and not for 3 whole days
    running since, nor today: `food` (median a day), `order`, `givenOn`, `days`, `beforeDays`, `ofDays`, `savedKcal`
    (the median times the days it would have been eaten at its old rate, rounded to whole days). Not said again on a
    later day once the record says `taken` since that advice.
  - None on a Refeed or a Day off, and none of a marked day counted.
- **Where they go** (`withCoachFollowUps`): on the finding about the same food or meal (said before: the fix whose
  order or cause names the food; repeats: the calorie line, else the fix about the driver, else the closing line;
  fat: the fat line; protein: a protein line, else what is left today; advice taken: the finding whose order names
  the food), else a finding of its own, today's, of kind 'fix' (signals `saidBefore`, `repeatOver`) or 'holdingUp'
  (`adviceTaken`), id `day:<epochDay>:<signal>:<kind>:<follow-up>[:<food key>]`, priority pattern.
- **Safeguards** (`followUpAllowed`): nothing after bariatric surgery; under 18, paused, an eating-disorder history or
  the under-eating finding, only advice taken of a protein add (the record holds no adds yet, so nothing shows);
  pregnancy, breastfeeding, underweight or low body weight, only protein short; kidney disease, nothing for more
  protein.
- **The clock:** `CoachAnalysisInputs.nowMinute` (`minuteOfDayNow` of the app's clock) reaches `analyseFoodDay`, so the
  evening fiber fix comes at 6 pm without dinner logged.
- **Evidence:** a row for each `CoachFollowUpRule` figure; `coachAnalysisEvidence.test.ts` checks them.
- **Tests:** `test/engine/coachFollowUps.test.ts` (Tuesday → Thursday, the weekday and the date, the 14 days, the buffet
  day's calorie line; the third day this week, the driver food and meal, the calendar week, a Refeed, fat over,
  protein short on what is left; skipped three days running, 1,400 kcal, the 5-of-14 scenario, said once; follow-ups
  of their own; the record of the buffet day; every safeguard); `test/state/coachAccountability.test.ts` (nothing
  recorded unless shown, recorded once a day, the follow-up the next day on the calorie line, fiber at 7:40 pm and not
  at noon); the contract on both implementations; the version 28 upgrade, the fingerprint and the table list.

Choices made without asking (say if any is wrong):
- **`taken` is a kind of the record**, so "advice taken" is said once per piece of advice across app launches.
- **A repeat is said only on a day that is one of them** (today over by 500, today's fat over), so it rides on
  today's line. Protein short counts the whole days before today, as today is still being eaten.
- **Repeats of fat use 1d's margin** (1.25× the target and 15 g over), so "fat over" means what the fat line means.
- **"The days it would have been eaten" are rounded to whole days**, at least one: 10 of 14 days for 3 days is 2 days,
  so a 700 kcal biscuit gives 1,400 kcal.

Remaining:
- the words for the follow-ups in `format/`, including the three signals of their own (`saidBefore`, `repeatOver`,
  `adviceTaken`), which `foodFindingText` has no template for yet.

The coach's voice, 2026-10-24. Not run locally; CI validates.

- **Where:** `apps/mobile/src/format/coach/`, one declaration per file. Every coach analysis template moved there and
  was rewritten on the grammar: `foodFindingText`, `trainingFindingText`, `coachTradeText`, `coachHeadlineText` (now
  from `CoachVerdict`), `coachFindingText`, what is left today and the closing line; `findingSubjectText` (the old
  "X is holding up; Y is worth changing" headline) is gone. The Coach tab's section draws the verdict as the headline
  and the closing line last.
- **The grammar:**
  - **Slots** (`coachPhrasings`, 185 slots, 410 phrasings, 2 to 4 a slot): the lead (the number and the verdict), the
    cause (meal and food, `coachCauseText`), the orders, one sentence each with what each needs around it
    (`coachAdviceText`: the worst food, skip or one spoonful, fill the plate, the swap, then "Without the … you'd be
    … over, not …"), the consequence, the close, holding up, what is left, data quality, training, MM-607's trade and
    the follow-ups.
  - **The choice** (`coachPhrase`, `phrasingIndex`, `coachPhraseKey`): FNV-1a over the slot, the finding's id and its
    last day, so a day reads the same each time and the next day's like finding may read another.
  - **Helpers:** `listText` ("A, B and C"), `pluralText`, `countWord` ("two cups"), `multipleText` ("3.8×"),
    `roughAmount` (an average said to the nearest 5 under 100, 10 from it), `sentenceCase` (a food name that opens a
    sentence is capitalized; a number is left alone), `possessiveText` ("General Tso's" stays), `readableFoodName`
    (brackets, sizes and containers go; a catalog name in capitals keeps its first part in sentence case: "COOKIE
    BUTTER, CRUNCHY (LOTUS)" is "Cookie butter", "Diet Pepsi Cola 12 Fluid Ounce Aluminum Can (Pepsi)" is "Diet Pepsi
    Cola"), `foodInSentence` (lower case mid-sentence unless the name opens with a proper word: "the sausage egg and
    cheese biscuit", "Chinese buffet"), `coachCauseWords` ("the buffet"), `coachMealWords`.
  - **The protected path:** the eating-disorder history and the other protein-only safeguards say protein only,
    calmly ("32 g of protein left today. A protein food at your next meal covers it.").
- **The owner's buffet day reads** (headline, then each line as the tab shows it; its fixture at 7:40 pm):
  - "1,054 kcal over. The buffet did it."
  - What is left ("No calories left: 1,054 kcal over"): "You're done eating for today. If you're hungry, dinner under
    400 kcal: lean protein and vegetables. No sauce."
  - The calorie line ("1,054 kcal over today"): "Lunch was the problem. The Chinese buffet: 2,368 kcal, more than your
    whole day's 2,175. General Tso's chicken was the worst of it: 744 kcal, 33 g fat. Skip it next time, or take one
    spoonful. Fill the plate with steamed chicken with vegetables first. Swap in steamed chicken with mixed vegetables,
    sauce on the side: about 265 kcal, 35 g protein, 4 g fat. Without the General Tso's chicken you'd be 310 kcal over,
    not 1,054."
  - Protein per 100 kcal ("155 g protein in 3,229 kcal so far"): "4.8 g protein per 100 kcal. You need 8.6 g.
    Breakfast: the sausage egg and cheese biscuit with extra eggs, 691 kcal, 45 g fat. Swap it for two eggs on an
    English muffin with a slice of cheese: about 390 kcal, 24 g protein, less than half the fat. Cookie butter: 170 kcal,
    1 g protein. Does nothing for your goal. Skip it."
  - Sodium ("Sodium 6,923 mg so far, over 1,800 mg"): "Sodium 6,923 mg, 3.8× your 1,800 limit. General Tso's chicken did
    it. Drink water tonight. Next time: sauce on the side."
  - Fiber ("Fiber 14 g of 30 g", under "1 more from your data"): "Fiber 14 g of 30. You ate almost no vegetables. Two
    cups at dinner."
  - Holding up ("Protein 155 g, minimum hit"): "Protein 155 g. Minimum hit. Keep that."
  - Last: "Tomorrow: back to 2,175. Don't skip meals to make up for today."
- **The follow-ups** (`coachFollowUpText`, `followUpFindingText`): riding on a finding, said right after its lead; on
  their own, signals `saidBefore`, `repeatOver` and `adviceTaken` are routed by `coachFindingText` (and
  `foodFindingText`) and never throw. "Tuesday I told you to skip the General Tso's chicken. It's back: 744 kcal
  again." "Third day this week over by 500 or more. Lunch keeps doing it." "Peanut butter again: 2 of the 3 days."
  "Fat over target 3 of the last 7 days." "You skipped the biscuit three days running. That's 1,400 kcal you didn't
  eat." A stand-alone fix ends in an order ("Skip it next time.", "Halve the added fats…"); advice taken in "Keep that."
- **The voice test:** `test/voice.test.ts` keeps MM-108's list for the rest of the app; `format/coach/` is held to the
  coach's list instead (`test/support/coachBannedWords.ts`: profanity, "fat" aimed at the person, lazy, weak,
  disgusting, pathetic, worthless, cheat, sinful, deserve, earn, burn off), so verdicts about choices are allowed there
  and banned elsewhere, with its own tests.
- **Cleanup:** `food/ownMealSwapOf.ts` deleted; `CoachAdvice.replacement`'s doc says a table replacement's `name` is
  words; `spanAdviceOf` already swaps through `swapFor` (with its limits) from `foodSpanAnalysisOf`, the only path to
  `tableSwapOf`; an evidence row for each of the 25 `CoachAdviceRule` figures (`sleepMinutes` from the AASM and SRS
  consensus, the rest judgement), required by `coachAnalysisEvidence.test.ts`.
- **Stories:** `CoachAnalysisBuffetDay` (`buffetDayScenario`, from `buffetDayFoods`, the same foods as the test
  fixture); `CoachAnalysisTodayTrade` shows the trade as an order; the fat week's headline is the verdict.
- **Tests:** `test/format/buffetDayText.test.ts` (each phrasing the day picks pinned, one exact line per sentence of the
  voice standard, each whole line and title, every fix ending in its orders, the eating-disorder day);
  `coachPhrasings.test.ts` (every phrasing of every slot: 2 to 4, the coach's list, no exclamation mark, full stops;
  the text over the buffet day, the fat week and simulated users on 1d and every span: every fix carries each order
  sentence and ends in one; the same day reads the same); `coachGrammar.test.ts` (the helpers and food names);
  `coachFollowUpText.test.ts` (each accountability scenario's exact line; every kind, riding on every finding of the
  buffet day and on its own, never throws); `voice.test.ts`'s coach list. Changed: `foodFindingText.test.ts`,
  `trainingFindingText.test.ts`, `coachAnalysisText.test.ts`, `foodDay.test.ts`, `foodSignals.test.ts`,
  `coach/whatYourDataSays.test.tsx`, `coachAnalysisEvidence.test.ts`, `engine/support/buffetDay.ts`.

Choices made without asking (say if any is wrong):
- **"Fill the plate with steamed chicken with vegetables first."** The standard's "and steamed vegetables" is left out
  when the food to keep already has its vegetables, so it is not said twice.
- **The biscuit is named as logged**, "the sausage egg and cheese biscuit with extra eggs", not the standard's
  "the sausage, egg and cheese biscuit": the coach does not rewrite a name beyond making it readable.
- **"Without the General Tso's chicken you'd be 310 kcal over, not 1,054"**: the whole name and the unit, as the
  Decisions have it, where the standard wrote "the General Tso's" and "{x} over".
- **The density line leads with its number** ("4.8 g protein per 100 kcal. You need 8.6 g."), which the standard does
  not have: every fix opens with the number, then the orders.
- **The swap of General Tso's chicken is said** ("Swap in steamed chicken with mixed vegetables…") between the plate
  and the consequence; the standard has no swap there.
- **"Peanut butter again: 9 of the last 14 days"** has no follow-up of its own in the data; it is said as the driver of
  the repeats ("Peanut butter again: 2 of the 3 days").
- **The story is drawn on the stories' day** (Oct 12), so its phrasings are that day's, not the fixture's.

Remaining:
- none for the words; the owner's review of the voice.

Read against the voice standard, 2026-10-24: four corrections.
- **One food named once.** The calorie line no longer adds a swap after "Fill the plate with steamed chicken with vegetables
  first": the meal's own better food is the order, and a second named food was noise.
- **No jargon.** "4.8 g protein per 100 kcal. You need 8.6 g." is now "Too many calories for too little protein." The span
  lines and titles speak plainly too ("Too little protein for your calories", "{meal}: big calories, little protein"). The
  figures stay in "The numbers behind this".
- **Today's view lists every fix.** 1d is uncapped (`arrangeCoachFindings`' `uncapped`), so fiber is no longer folded under
  "1 more". Spans keep 3 a group.
- **The cause before the rest of today.** On a day over target, "what is left" follows the first fix, as the standard reads:
  lunch was the problem, then you're done eating.

Tests updated: `test/format/buffetDayText.test.ts` (the calorie line without the swap; the density lead).

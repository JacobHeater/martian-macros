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

Scenario: Back to plan
  Given any day over target
  Then the coach's last line for the day is "Tomorrow: back to {target}. Don't skip meals to make up for today."
```

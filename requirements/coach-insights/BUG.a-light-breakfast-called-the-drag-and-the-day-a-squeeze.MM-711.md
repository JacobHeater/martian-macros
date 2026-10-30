---
id: MM-711
status: in-progress
component: coach-insights
related: [MM-617, MM-663, MM-681, MM-682, MM-684, MM-689, MM-693]
---

# Bug: a light breakfast called "the drag" and the day "a squeeze"

## Context
The owner's phone, 2026-10-30, a 2,178 kcal and 187 g day, breakfast of oatmeal, maple syrup and butter, 243 kcal for
5 g, nothing else logged. The sheet: "The banana nut with prebiotic fiber superfood oatmeal is the drag: 160 kcal for
5 g. Next time build it around protein: add chicken breast filet". The brief: "Runway is tight with 1,935 kcal left and
182 g of protein still to hit (38% of remaining calories from protein). Breakfast drove the squeeze". Then the three
training rows recited. The owner: "oatmeal is the drag... what fucking squeeze? i fucking ate 243 calories... this is
not coaching." Both texts were the model's, and the built-in words say the same.

The words are not the cause; the verdict is. Three rules declared a problem where there was none, and the prompts then
ordered the model to voice it:
- `executiveBriefOf` called the day `tightRunway` whenever the rest of the day needed over 35% of its calories from
  protein. The owner's own target is 34%, so any breakfast under target density made the day "tight". After 243 kcal
  for 5 g the rest of the day needs 38%: a few points over the plan, with the whole day ahead.
- `mealMovesOf` made any food of 150 kcal under the target density the meal's outlier, however small the meal, and
  then always had a move for it, so every meal got a drag and an order.
- Both prompts demanded the shape unconditionally: "the one food that is the drag", "one order, the best move", "the
  verdict on today, then the order for tonight". Given a fine meal, the model invents the problem the shape needs.

## Decisions
From the owner ("get this right"; the lines are drafted here for the owner to read on the phone, not yet approved):
- **A verdict needs a signal.** Nothing is called a drag, tight or a squeeze unless the engine finds one; a fine meal
  and a day on track are told so, with where the protein comes from, and not a number: the rows under the words hold
  the numbers.
- **The sheet on the owner's breakfast:** "Breakfast is fine. Nothing to fix here. Build lunch around protein."
- **The brief on the owner's morning:** "Breakfast is in and the day is on track. Nothing to fix. Build lunch and dinner
  around protein. Zero lifts of the three you set this week: book one tonight."

Choices made without asking (say if any is wrong):
- **Tight** (`RunwayRule`, `runwayIsTight`): the rest of the day needs over 50% of its calories from protein, or over
  the day's own target density by 15 points, whichever is higher. That is lean-protein-only territory. The owner's
  38% against 34% is on track; 62% is tight; the invariant (protein that cannot fit) is unchanged.
- **A food is worth a drag** (`MoveRule.outlierMinShare`) only when its own calories not backed by protein at the day's
  target density are at least 7% of the day's calories, in a meal under the target density. The owner's oatmeal has
  102 kcal unbacked on a 2,178 kcal day, under 5%; the approved line C's croissant has 215 on 2,400, 9%; the biscuit
  and the fries 20% and 15%; MM-684's loaded nachos 24%. The food itself still has to be 150 kcal and under target
  density. (The meal's own unbacked calories were tried first and separate these cases by a point or two.)
- **Today's order on the sheet** (the "next meal" move) is given with a drag, as line B does, or when the day needs it
  (over, the protein unable to fit, or tight). A fine meal on a day on track has no moves: `MealBreakdownAnalysis`
  carries a `verdict` (fine, drag, order) and the "Highest calorie drag" and "Your move" rows are absent when fine.
- **The brief's on-track line** says which meals carry the protein (`ExecutiveBrief.lastMeal`): after breakfast
  "Build lunch and dinner around protein", after lunch "Build dinner around protein", after dinner "Close it before bed
  with lean protein". "Drove the squeeze" is gone: the drag is said as the owner's approved draft (MM-693) says it,
  "The lunch biscuit, 254 kcal for 5 g, is the drag: build lunch around chicken breast next time" (`briefMoveOrder`).
  The tight lead keeps its two figures and loses the density in brackets.
- **The training line is one line** (MM-693's shape applied to the built-in words too): lifting behind is the line
  ("Zero lifts of the three you set this week: book one tonight."); lifting covered, cardio short is; both covered,
  steps short is; all covered, one sentence says so. The cardio and steps figures stand in the rows under the words.
- **The prompts lead with the verdict.** A fine meal or a day on track: say so, name no drag, give no move, cite no
  totals; "Never call a fine meal a problem, a drag, tight or a squeeze." A fine meal is asked without the day's totals
  and without tools, and a day on track without its totals, and `whyCoachNarrationRejected` lets no number back beyond
  the small ones when the request allows none (an empty list is now strict, not unchecked). The sheet gets the brief's
  kind of bound: 5 sentences and 80 words (the approved line A is five and 64).
- The runway state goes to the model as plain words ("on track: nothing to fix"), never the camelCase state.

## Description
A meal with nothing wrong in it, and a day on track, are told so in one breath and pointed at the next meal; a drag is
named only where the engine finds one worth a move; "tight" means lean protein only from here; the built-in training
line is one order, lifting first.

## Acceptance Criteria
```gherkin
Scenario: The owner's breakfast on the sheet
  Given a 2,178 kcal and 187 g day with oatmeal, maple syrup and butter at breakfast, 243 kcal for 5 g, and nothing else
  When the breakdown is computed
  Then the verdict is fine, there is no outlier and no move
  And the built-in words are "Breakfast is fine. Nothing to fix here. Build lunch around protein."
  And the model is asked without the day's totals or tools, and the words the owner's phone showed are refused

Scenario: The owner's morning in the brief
  Given six days before it eaten on target
  Then the day is on track with no drag, the last meal breakfast
  And the built-in words are "Breakfast is in and the day is on track. Nothing to fix. Build lunch and dinner around
  protein." and with no lift logged of the three set, "Zero lifts of the three you set this week: book one tonight."
  And the model is asked without the day's totals, and the words the owner's phone showed are refused

Scenario: A breakfast built wrong still has its drag
  Given granola, 400 kcal for 8 g, with orange juice
  Then the granola is the drag and a protein food is added next time

Scenario: Tight
  Given 1,200 kcal of pancakes for 60 g at breakfast on the owner's day
  Then the day is tight (978 kcal left for 127 g, 52% protein from here), the pancakes the drag, and no "squeeze"
```

## UI/UX
- The fine sheet — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: MealCoachBreakdownFine). No drag row, no
  move row, the three sentences.
- The on-track brief — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachOnTrackDay). The verdict, the
  carriers, the one training line.

## Notes
- `RunwayRule`, `runwayIsTight`, `MoveRule.outlierMinShare`, `mealMovesOf`, `MealVerdict`, `mealBreakdownAnalysisOf`,
  `ExecutiveBrief.lastMeal`, `executiveBriefOf`; `mealMovesText`, `executiveBriefArchetypeText`, `briefMoveOrder`,
  `trainingBriefText`, both narration requests, `whyCoachNarrationRejected`. Tests: `test/engine/lightBreakfast.test.ts`,
  `test/format/trainingBriefText.test.ts`. Not run locally; CI validates.
- The owner's call-out from the phone: no panel. Done once the owner reads both on the phone.
- The model tier (Haiku 5.5, gpt-4o-mini, Gemini flash) did not produce this: the verdict was handed to it. A stronger
  model would have phrased the same false verdict better.

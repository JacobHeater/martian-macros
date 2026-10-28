---
id: MM-685
status: in-progress
component: coach-insights
related: [MM-244, MM-664, MM-665, MM-671, MM-673, MM-682, MM-684]
---

# Story: The coach's tools: what the model may look up, and the loop that runs them

## Context
The model with the person's key gets one JSON of figures and may cite only those numbers (MM-665, MM-671). The owner's
Q&A (MM-682): give it tools, in the app, that call the deterministic engine, so it can look before it orders; every
number it says still comes from the engine. Not MCP: the app has no server a provider could reach, so each provider's
own function calling carries the tools, and the app runs them.

## Decisions
- **The seam (`domain/integration`):** `CoachTool` (name, what it is for, the JSON schema of its input), `CoachToolAnswer`
  (the answer as JSON and the numbers in it, which the model may then say), `CoachToolbox` (`tools`, `call(name, input)`).
  `CoachNarrationRequest` carries an optional `toolbox`. A request without one is asked as before.
- **The tools (`state/AppCoachToolbox`)**, each answered from the app's own state and engine, no network:
  - `meal_and_day`: this meal's foods with calories and macros, the day's totals, targets, calories left, protein to go.
  - `moves`: MM-684's moves for the meal, ranked, each with its figures and the meal after it.
  - `my_foods_at_meal`: the person's foods logged at this slot in the last 56 days, each with its figures and the days logged.
  - `search_catalog`: foods in the catalog by words, with an optional group, a calorie ceiling and a least protein
    density; up to 10, each at its default serving with its figures. Reads the installed packs (`FoodCatalog.search`).
  - `price_move`: a move the model proposes (a cut to a share, an add of a named food, a swap for a named food), priced
    by the engine: the meal after it, the day after it, whether the safeguards allow it.
  - For the brief: `today_meals` (each meal's foods and figures), `week` (the 7-day figures), `training` (the training
    block), with `search_catalog` and `price_move`.
- **The loop (`HttpCoachNarrator`):** the request carries the tools in the provider's form (Anthropic `tools` and
  `tool_use`/`tool_result` blocks; OpenAI `tools` with `function` and `tool_calls`/`tool` messages; Gemini
  `functionDeclarations` and `functionCall`/`functionResponse` parts). Each tool call is run through the toolbox and
  answered; the loop ends when the model answers in words. The numbers it may say are the request's and every tool
  answer's. A round cap of 8 tool rounds (a choice made without asking, a guard against a model that never answers);
  past it the outcome is `empty`. 429 and 503 retried as before (MM-671).
- **The prompts** tell the model it is the coach of MM-682's lines: look at the meal and the moves, search when the moves
  lack a food it wants, price what it proposes, then give one order in two to four sentences, every number from what it
  was given or looked up, no field names, no exclamation marks, no moralizing (MM-674's rules kept).
- **Privacy (MM-244):** `privacyPolicy.ts` and `termsOfUse.ts` say that with a key the app sends the meal's foods with their
  calories and macros, the foods the person logs at that meal, and what the coach looks up in the food database;
  `test/terms/privacyText.test.ts` and `termsText.test.ts` read it.
- The in-memory narrator and the HTTP fixture keep the tests off the network: `InMemoryJsonHttp` answers a tool call
  first and the words second, by request order.

## Description
A `CoachToolbox` the state builds, carried by the narration request, run by `HttpCoachNarrator`'s tool loop for the
three providers; the model's numbers verified against the figures and the tool answers; the privacy text amended.

## Acceptance Criteria
```gherkin
Scenario: A tool call is answered and the words verified against it
  Given Anthropic answers first with a tool_use of search_catalog and then, given its result, with words citing a food's 165 kcal
  When the narrator is asked with a toolbox
  Then the second request carries the tool_result, the words are shown, and 165 passes the number check though it was not in the figures

Scenario: The same for OpenAI and Gemini
  Then the request carries the provider's own tool form and the loop ends in words for each

Scenario: Nothing leaves the phone without a key
  Then no request is made, as before

Scenario: The privacy policy says what the tools send
  Then the policy and the terms name the meal's foods, the person's foods at that meal, and the food database lookups
```

## Notes
- Tests: `test/format/httpCoachNarratorTools.test.ts`, `test/state/appCoachToolbox.test.ts`, the terms tests. Not run
  locally; CI validates.

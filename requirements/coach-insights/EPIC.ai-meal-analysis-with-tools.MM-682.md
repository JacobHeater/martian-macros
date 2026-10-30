---
id: MM-682
status: in-progress
component: coach-insights
related: [MM-617, MM-663, MM-664, MM-665, MM-666, MM-674, MM-683, MM-684, MM-685, MM-686, MM-687]
---

# Epic: AI-driven meal analysis: deterministic moves for everyone, tools for the coach that has a model

## Context
The owner, 2026-10-28, from the breakfast breakdown on a build of main made moments before: "swapping a biscuit for a
chicken breast is" a poor suggestion. The sheet (MM-666) finds the one worst food in a meal and asks `swapFor`
for a single replacement; its first strategy takes any food the person logs in the same meal slot that trades better,
whatever its kind, so a bread gets a chicken fillet in its place. MM-674 stopped only a food already on the plate. And
the model with the person's key (MM-665) sees nothing but the pre-digested figures and the swap already chosen, so it
can only restate them: the number restatement the owner has said a real coach never does.

The owner settled the design in a four-round interactive Q&A before any ticket (recorded here so nothing is re-asked).

## Decisions (the owner's, 2026-10-28)
- Both tracks, deterministic first: a meal "moves" engine for everyone, then in-app tools for the model that call it.
- The moves the coach may order: cut the portion, add a protein food, a swap within the same food group only, fix it at
  the next meal. Never a food of another kind in a food's place.
- Candidates come from the catalog first, then the person's own foods when the catalog has no good fit. A good fit is
  the same group, inside MM-607's calorie band, better on the day's gap.
- Through tools the model may see the meal's foods with their macros, the person's foods at that slot, and what it looks
  up in the catalog; the privacy policy and terms say so.
- All three surfaces: the breakdown sheet, the inline lines under foods, and the Executive brief, with tools in this push.
- One best move is shown, ranked by the day's gap. The model may pick a different move than the engine's top one, as
  long as every number it says came from a tool.
- No limit on the wait: a spinner, and after 3 seconds an "Answer now" button that shows the deterministic words. The
  same on the Coach tab's brief.
- The cheap models stay (Haiku 5.5, gpt-4o-mini, Gemini flash).
- The inline lines are phrased in one request per day for every food at once, cached by the day's state.
- Not MCP: the app has no server for a provider to reach. Each provider's own function calling carries the tools, and
  the app runs them.

## The coach's lines (approved by the owner as drafted, 2026-10-28)
A. The owner's breakfast (2177 kcal and 187 g targets; 844 kcal and 34 g; the biscuit 541 kcal and 10 g; 347 kcal left
and 100 g to go, which does not fit):

> Breakfast took 844 kcal, 39% of your day, for 34 g of protein. The buttermilk biscuit is the drag: 541 kcal for 10 g.
> 347 kcal left and 100 g of protein to go does not fit. Hold the 347 and spend every one of them on lean protein:
> chicken breast, 165 kcal for 31 g, is the closest you get. Protein first tomorrow morning.

B. Room in the day, the meal built wrong (lunch 700 kcal and 22 g; fries 420 kcal and 5 g; 1,100 kcal left for 110 g):

> Lunch was 700 kcal for 22 g of protein, 13% protein. The fries are the drag: 420 kcal for 5 g. Next time build it
> around protein: add chicken breast, 165 kcal for 31 g, and lunch stands at 53 g. You have 1,100 kcal left for 110 g
> today. Dinner carries it.

C. A same-group swap exists (breakfast 520 kcal and 18 g; croissant 300 kcal and 6 g):

> Breakfast was 520 kcal for 18 g of protein. The croissant is the drag: 300 kcal for 6 g. Swap it for a whole wheat
> bagel, 250 kcal for 10 g: 50 kcal back and 4 g more protein, same breakfast.

Inline, under the biscuit:

> Light on protein: 541 kcal for 10 g. Half of it next time keeps 271 kcal for protein.

## Narrative
- MM-683: the bug as seen on the phone, with its regression test on the owner's breakfast.
- MM-684: the deterministic meal moves (`mealMovesOf`), the one best move, and the approved lines as the built-in words
  on the sheet, under the foods and in the brief.
- MM-685: the coach's tools (`CoachToolbox`) and the tool loop in `HttpCoachNarrator` for Gemini, OpenAI and
  Anthropic; every number the model says comes from the figures or a tool's answer; the privacy policy and terms amended.
- MM-686: the sheet and the brief ask with tools, and "Answer now" after 3 seconds.
- MM-687: the inline lines phrased in one pass a day.

## Acceptance Criteria (narrative)
Done when the owner's breakfast breakdown never offers a food of another kind in the biscuit's place, says line A
without a model, and with a model says words whose every number came from the figures or a tool; when the brief and the
inline lines rest on the same moves; and when a wait on the model can be cut short with "Answer now".

## Notes
- Ships worktree-per-PR from `origin/main` (the owner's choice in the Q&A). Not run locally; CI validates.
- The owner reads the coach's words on the phone before any of this is called done.

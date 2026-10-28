---
id: MM-672
status: done
component: coach-insights
related: [MM-610, MM-617, MM-665, MM-670, MM-671]
---

# Story: "Coach's feedback" findings said in the person's own model's words

## Context
The owner (2026-10-28), after the Executive summary spoke in Gemini's and then Anthropic's words: "the feedback
needs to fallback to what we see today, but i want the ai coach to generate useful feedback here." The findings of
"Coach's feedback" (MM-610) were the built-in coach's sentences only; the narrator (MM-665) phrased the Executive
summary and the meal breakdown and nothing else.

## Decisions
- Each finding's sentence goes to the person's own model through `coachFindingNarrationRequest`: the title, the
  built-in sentence, "The numbers behind this" as label and value rows, the foods and subjects named. The model is
  told it is the coach, direct and accountable (MM-617): what the numbers show, why it matters for the goal, one
  concrete order for the next meal or session, no softening. The numbers it may cite are those in the words and
  rows it was given and the finding's figures, whole. Keyed by the finding's id and its words, so a finding said the
  same way is asked once; a pull to refresh asks again (MM-670).
- The title and "The numbers behind this" stay the built-in coach's, so the finding's figures and evidence never
  come from a model (MM-663). While the model writes, the wait is shown where the sentence will stand (MM-673);
  the built-in sentence shows only when the model is off, fails, or fails the check, as the owner asked.
- `useNarratedFinding` does it for `CoachFindingItem` on Coach and for the Dashboard's insight when it is the
  coach's top finding (`InsightFindingSection`, split out of `InsightCard`), so the two keep agreeing (MM-610).
- The protected path (an eating-disorder history) is read from the Executive brief, so the check keeps calories out
  of the model's words there too.

## Description
On Coach, each finding of "Coach's feedback" reads in the person's own model's voice once it answers: the built-in
coach's title and numbers, the wait and then the model's sentence under them. Without a model, or when its words
fail the check, the finding reads as it did.

## Acceptance Criteria
```gherkin
Scenario: The model answers
  Given a provider and key saved
  When "Coach's feedback" shows a finding
  Then its sentence is the model's words, under the built-in title, with the built-in numbers behind it

Scenario: The model does not
  Given no provider, or one that refuses or fails the check
  Then the finding's sentence is the built-in coach's, as before

Scenario: The Dashboard agrees
  Given the coach's top finding on the Dashboard
  Then its sentence is the same as on Coach
```

## UI/UX
- Coach — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachExecutiveSummary); Today —
  apps/mobile/src/gallery/screens/Today.stories.tsx (the insight). The gallery's narrator answers with the built-in
  sentence, so nothing changes to the eye; the markup is the same.

## Notes
- Tests: `test/format/coachFindingNarrationRequest.test.ts` (the request, the numbers allowed, the key),
  `test/coach/narratedFindings.test.tsx` (the model's words shown, the built-in kept when it fails).
- One request per finding shown, cached; a screen of six findings is six asks the first time.
- An owner's ask: no panel. Not run locally; CI validates. Not yet seen on a phone.

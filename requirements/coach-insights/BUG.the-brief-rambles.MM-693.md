---
id: MM-693
status: in-progress
component: coach-insights
related: [MM-617, MM-663, MM-671, MM-681, MM-682, MM-685, MM-689]
---

# Bug: the brief rambles (a preamble about tools, 170 words, the week's rows recited)

## Context
The owner's Executive summary, 2026-10-28, with the person's own model and the tools of MM-685, opened "The figures are
already in front of me, so I can answer directly without calling tools", ran to six long sentences and 170 words, told
the person that adding a chicken breast filet to lunch "would bring the meal to 1043 calories" on a day with 347 kcal
left, and then recited the lifting, cardio and step figures that stand in the rows under it. The owner: "we've got to
hone in the system prompt for this so we don't get ramblin rose over here."

Three causes. The prompt asked for "2 to 4 short sentences" and nothing enforced it: the check's only length rule is
900 characters, which the brief fit under. The prompt spoke of "the figures" and told the model to hold the person to
"cardio minutes and steps a day against their floors", so the model echoed the word and recited the rows. The
meta-talk check (MM-689) catches "the tools" with an article and "based on the figures", not "calling tools" or "the
figures are in front of me".

## Decisions
From the owner (2026-10-28, one interactive question with three drafts of this day): **verdict, drag, order, one
training line.** At most 4 sentences and 60 words. No preamble. The rows under the words are never recited. The drag
is named once with its two figures and its move is for the next time that meal is built, never for tonight. Training
is one order with at most one number, lifting first. The approved draft of the owner's day:

> 347 kcal left and 100 g of protein to go does not fit. Hold the 347 and spend every one on lean protein; protein
> first tomorrow morning. The lunch biscuit, 254 kcal for 5 g, is the drag: build lunch around chicken breast next
> time. Zero lifts of the three you set this week: book one tonight.

Choices made without asking (say if any is wrong):
- **The limit travels with the request** (`CoachNarrationRequest.maxSentences`, `maxWords`), so the brief's 4 and 60
  do not refuse the breakdown sheet's approved line A (MM-682), which is longer. The sheet and the inline lines keep
  their limits as they are.
- **The check refuses over the limit with "It rambled"**, shown by Settings' test of the voice like the other reasons
  (MM-671); the built-in words stand in its place, as for any refusal.
- **More meta-talk is refused**: "figures" or "tools" as a word at all, "in front of me", "answer directly", "without
  calling" or "without using", and "I can answer".
- **The built-in words (the fallback) are unchanged**: MM-681's training lines and MM-663's brief are the owner's
  drafts and are not the model's rambling.

## Description
The Executive brief's model answer is at most 4 sentences and 60 words, opens on the day, names the drag once and
never recites the rows under it; anything longer or any word about tools or figures is refused and the built-in words
are shown.

## Acceptance Criteria
```gherkin
Scenario: The owner's brief
  Given the owner's brief of 2026-10-28, opening "The figures are already in front of me"
  When the coach's words are checked with the brief's limits
  Then they are refused with "It spoke of its figures or tools instead of the day"
  And the same brief without its first sentence is refused with "It rambled"

Scenario: The approved draft
  Given the owner's approved draft of the day
  Then it passes with the brief's limits

Scenario: The sheet's line
  Given the approved line A of MM-682, which is over 60 words
  Then it passes without limits, as the sheet asks

Scenario: The prompt
  Given the brief's request, with and without tools
  Then it carries at most 4 sentences and 60 words, tells the model never to recite the rows under its words,
  and tells it the move is for the next time the meal is built
```

## Notes
- `whyCoachNarrationRejected` (limits, meta-talk), `CoachNarrationRequest`, `HttpCoachNarrator`,
  `executiveBriefNarrationRequest`; test: `test/format/coachRambling.test.ts`. Not run locally; CI validates.
- The owner's call-out from the phone: no panel. Done once the owner reads the brief on the phone.

---
id: MM-671
status: done
component: coach-insights
related: [MM-665, MM-663, MM-669, MM-670]
---

# Story: "Test AI coach" in Settings, and why the model's words were not shown

## Context
The owner (2026-10-28) pasted a Gemini key and saw the Executive summary still in the built-in coach's words: "the
llm doesn't appear to be the one generating coaching advice on screen … where the save key button is on the api
key section, I want you to add a test ai coach button to test the voice from the llm."

The narrator (MM-665) fell back to the built-in words on any failure without a word of why: a refused key, no
connection, an empty answer, or words that failed `verifyCoachNarration`. With the button built, the owner's phone
showed the cause the same day: Gemini answered 404, "This model models/gemini-2.5-flash is no longer available to
new users. Please update your code to use models/gemini-3.8-flash". Two more would have followed: Gemini spends
its thinking inside `maxOutputTokens`, and 180 left no room for words; and the check rejects any number not among
the brief's figures, which a model summarising "about 60 g short" trips.

## Decisions
- `CoachNarrator.probe(request)` asks the provider afresh and tells what came of it, a `CoachNarrationOutcome`:
  `off`, `narrated`, `unreachable` (the error's message), `refused` (the HTTP status and the provider's own
  `error.message`), `empty`, or `rejected` (the words and the reason). `narrate` is built on it and still always
  answers with words. `whyCoachNarrationRejected` gives the check's reason in a few words; `verifyCoachNarration`
  is its yes or no.
- Gemini is asked as `gemini-3.8-flash` at `thinkingConfig.thinkingLevel: 'low'` (the older `thinkingBudget` is a
  400 on this model, and `temperature` is deprecated), and every provider gets 1,024 output tokens, since Gemini's
  thought counts against the same limit. A thought-summary part, if one comes, is not read as the words.
- A 503 (saturated) or 429 (rate-limited) answer is asked again after 1 s and again after 2.5 s before it counts as
  refused: the owner's second test, on the new model, got 503 "experiencing high demand ... try again later".
- Anthropic is asked as `claude-haiku-5-5`, the current fast model: the owner's third test, with an Anthropic key,
  got 404 "model: claude-3-5-haiku-latest". That model refuses a non-default `temperature` and thinks by default, so
  the request sends neither a temperature nor thinking (`thinking: { type: 'disabled' }`), and the words are read
  from the first text block, past any thinking block. OpenAI's `gpt-4o-mini` is untested and may be retired too.
- The model is given whole numbers, and the check reads a decimal as one number. The owner's first answer from
  Anthropic was good words refused for "903968363784": the brief went to the model unrounded (2176.903968363784
  kcal), the model wrote it back digit for digit, and the check read the digits after the point as a number of their
  own. Both request builders round every figure they send (the engine's figures are untouched), the system prompt
  asks for whole numbers, and `whyCoachNarrationRejected` matches a decimal whole and compares it rounded.
- Settings > Coach > API key: "Test AI coach" beside "Save key", both 12 px under the field (MM-669). It saves the
  key as typed first, as Save key would, then probes with today's Executive brief. What came back is a notice under
  the buttons (`coachAiTestText`): the model's words under "Google Gemini, on your numbers", or a caution naming the
  one reason ("Google Gemini refused the request (HTTP 400)" with its message; "Google Gemini's words failed the
  check" with the reason and the words). Off until the coach has a brief to send.

## Description
In Settings, a person with a provider chosen can press Test AI coach and read, on the spot, what their model says
of their numbers, or exactly why the built-in coach is speaking instead.

## Acceptance Criteria
```gherkin
Scenario: The model answers
  Given a provider and key saved and a brief for today
  When "Test AI coach" is pressed
  Then its words are shown under "<provider>, on your numbers"

Scenario: The provider refuses the key
  When "Test AI coach" is pressed and the provider answers 400 with a message
  Then a caution says "<provider> refused the request (HTTP 400)" and the message

Scenario: The words fail the check
  When the provider's words use a number not in the brief
  Then a caution says "<provider>'s words failed the check", names the number, and quotes the words

Scenario: A saturated provider
  When the provider answers 503 twice and then 200
  Then the words are shown, after two waits, and a provider still busy after the third ask is told as refused

Scenario: Whole figures, and a decimal read whole
  Given a brief of 2176.903968363784 kcal remaining
  Then the model is sent 2177, and words that say "2176.9 kcal" or "2,177 kcal" pass the check

Scenario: Anthropic is asked as a model that answers new keys
  Then the request names claude-haiku-5-5, with thinking off and no temperature, and reads the first text block

Scenario: Gemini is asked as a model that answers new keys
  Then the request goes to gemini-3.8-flash with a low thinking level, no budget, no temperature, and at least 1,024 output tokens
```

## UI/UX
- CoachAiProviderConfigured and CoachAiProviderConfiguredSmallPhone — apps/mobile/src/gallery/screens/Settings.stories.tsx.
  The first presses Test AI coach and shows the notice; the second holds the two buttons at 360 px.

## Notes
- Tests: `test/format/httpCoachNarrator.test.ts` (every outcome, the Gemini model and config, a thought part skipped, fresh asks),
  `test/settings/testAiCoach.test.tsx` (the button, the words, two reasons, the key saved as typed).
- Privacy: the probe sends the same brief the coach sends, to the same host; nothing new leaves the phone (MM-664).
- An owner's ask: no panel. Not run locally; CI validates. The button and the 404 it showed were seen on the owner's
  phone (2026-10-28); the model change is not yet.

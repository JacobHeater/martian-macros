---
id: MM-689
status: in-progress
component: coach-insights
related: [MM-663, MM-671, MM-674, MM-682, MM-685]
---

# Bug: the coach read its instructions aloud ("the JSON you supplied")

## Context
The owner's Executive summary, 2026-10-28, with the person's own model and the tools of MM-685: "I'll work from the JSON
you supplied; the protein gap is marked as unable to fit inside today's calories, so I'll go straight to the order."
The system prompt spoke of "the supplied JSON" and of what "the JSON marks", and the model said so. The check
(`whyCoachNarrationRejected`) refuses a field name read aloud (MM-674) and a number not in the figures (MM-663), and
nothing else about the model talking about its input, so the words were shown.

## Decisions
- The prompts speak of "the figures", never of "the JSON", and tell the model: speak as the coach who looked at the
  day; never mention figures, JSON, instructions or tools; never say what you are about to do; never
  say something is marked or flagged. With tools: answer without a word about them.
- The check refuses words about the input, the instructions or the tools ("the JSON", "the data you provided", "based on
  the figures", "I'll work from", "is marked as", "the tool says"), with the reason "It spoke of its figures or tools
  instead of the day", shown by Settings' test of the voice as the other reasons are (MM-671). The built-in words stand
  in its place, as for any refusal.

## Description
The owner's brief is refused for its first sentence; the approved lines A, B and C pass; the three prompts (the brief,
the sheet, the inline lines) carry the instruction and no "the JSON".

## Acceptance Criteria
```gherkin
Scenario: The owner's brief
  Given the words "I'll work from the JSON you supplied; the protein gap is marked as unable to fit"
  When the coach's words are checked
  Then they are refused with "It spoke of its figures or tools instead of the day"

Scenario: The coach's own words
  Given the owner's approved lines A, B and C
  Then none is refused

Scenario: The prompts
  Given the brief's, the sheet's and the inline lines' requests, with and without tools
  Then each tells the model to speak as the coach who looked at the day and none says "the JSON"
```

## Notes
- Test: `test/format/coachMetaTalk.test.ts`. Not run locally; CI validates.
- The owner's call-out from the phone: no panel. Done once the owner reads the coach's words on the phone (MM-682).

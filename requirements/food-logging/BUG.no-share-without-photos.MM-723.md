---
id: MM-723
status: in-progress
component: food-logging
related: [MM-586, MM-599, MM-602, MM-722]
---

# Bug: With no photos, the prompt could only be copied, and promised photos that were not coming

## Context
Found by the product owner on their Pixel on 2026-11-03: a meal told entirely in words, in "Anything else
that would help your assistant?" (MM-602), with no photos. The step offered only "Copy prompt"; "Send to
assistant" and the share sheet appeared only once a photo was added (MM-599's decision, from when photos were
the meal's only input). The owner: the share path should be there without pictures too. And the copied prompt
told the assistant "I will send my photos in my next message. Wait for them before you answer", when there were
none to send.

## Description
"Send to assistant" is offered whenever the phone can share, with or without photos: the prompt alone goes to
the share sheet the way the photos do (the Android chooser as plain text, the iOS sheet with the text alone),
and is copied too. "Copy prompt" stays beside it, second, for an assistant that keeps only what is pasted; on a
phone that cannot share it stands alone, as before. With no photos attached, the prompt says so, and that the
assistant should go by what it was told unless photos follow in the next message.

## Acceptance Criteria
```gherkin
Scenario: Sent without photos
  Given the meal has a name and no photos, and the phone can share
  When the person presses "Send to assistant"
  Then the share sheet is handed the prompt and no photos, and the prompt is on the clipboard too

Scenario: Copy stays
  Given the phone can share
  Then "Copy prompt" is offered as well, after "Send to assistant"

Scenario: The prompt tells the truth about photos
  Given no photos are attached
  Then the prompt says none are attached, and to go by the description unless photos follow

Scenario: A phone that cannot share
  Given the phone's share sheet is unavailable
  Then only "Copy prompt" is offered
```

## UI/UX
- AI meal analysis — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (AnalyzeMealStart now shows
  both buttons; AnalyzeMealSentWithoutPhotos is new). The owner dictated the change from the phone, so the panel
  pass is skipped (`apps/mobile/AGENTS.md`); the stories are updated.

## Notes
- Regression tests: `test/food/analyzeMeal.test.tsx` ("MM-723: with no photos, Send to assistant hands the
  prompt alone") and `test/format/mealAnalysisPromptWith.test.ts` ("MM-723: with no photos, says none are
  attached").
- Where: `AnalyzeMealStep.tsx` (the buttons), `format/mealAnalysisPromptWith.ts` (the sentence); the shells'
  `shareMeal` already send text with no files, unchanged. The change to the prompt is reviewed here, under MM-586.
- Supersedes MM-599's "With none, the step ends in Copy prompt" and "the prompt says the photos will follow".
- Owed on the owner's Pixel: the chooser opened with the prompt alone and Gemini taking it. Not run locally.

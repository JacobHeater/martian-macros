---
id: MM-599
status: in-progress
component: food-logging
related: [MM-586, MM-598, MM-594, MM-157, MM-262, MM-589]
---

# Story: Add the photos and answer the questions in the app, then send it all to my assistant at once

## Context
AI meal analysis (MM-586) takes two trips through the person's assistant before an answer comes back:
the prompt is pasted, the assistant asks its four questions (name, how much was eaten, brand or
restaurant, when), the person answers, and only then does it work. Photos are attached in the
assistant, so the app cannot send them along with the prompt.

Here the app asks the four questions itself, takes or picks the photos, and hands both to the
assistant through the phone's share sheet in one go. The assistant answers at once, with nothing to ask.

**This reverses MM-586's "the app never sees the photos", by the owner (2026-10-23), to this extent
only:** the app holds the photos while they are being sent, and keeps none of them. The owner set three
levels apart (never sees; holds only while sending; processes and saves) and chose the second. Saving a
meal's photos with the logged meal is not part of this, and would be its own ticket.

**Considered and turned down:** putting the photos into the prompt as base64 text. An assistant reads
pasted text as text, not as an image, and one photo is millions of characters, more than a chat box
takes.

## Decisions
Made with the product owner (2026-10-23):
- **The app asks the questions** before anything is sent: the meal's name (required), how much of what
  is shown was eaten, the brand or restaurant (optional), and when it was eaten.
- **The answers go into the prompt**, so the assistant is told them instead of asking. The prompt still
  holds nothing else about the person (no targets, diet or history).
- **The photos are held only while they are sent.** Nothing is written to the database, the backup or the
  health platform. Any file the phone needs in order to share is in the app's cache and is deleted once the
  share sheet closes, and again when the sheet that holds them closes. The answer pasted back is read as it
  is today (MM-586).

Choices I made without asking (say if any is wrong):
- **The answers are also the review's defaults.** When the assistant's answer leaves out the time, or
  gives an empty name, the person's own answers are used. When it gives them, they are read as today
  (MM-586, MM-594).
- **"When" uses the controls that are already there**: the slot chips and the time row (`MealChips`,
  `TimeEatenRow`), as Estimate does. Today's date goes into the prompt, so the prompt's "ask me for
  today's date" rule is no longer needed.
- **"How much was eaten"** is chips (All of it · Most · About half · A little) and an optional line for
  the rest ("everything except the fries").
- **Photos are optional and at most six.** With none, the step ends in "Copy prompt" as it does today, and
  the prompt says the photos will follow in the chat. With photos, it ends in "Send to assistant".
- **Photos come from the in-app camera** (MM-157's, which never touches the gallery) **or the phone's photo
  picker** (Android's Photo Picker and iOS's PHPicker, which need no library permission). The picker is
  the phone's own screen, which MM-262 allows only because the app cannot draw someone's library itself.
- **"Send to assistant" opens the share sheet with the photos and the prompt together, and also copies the
  prompt.** Some assistant apps keep only the images from a share, so the person can paste the prompt
  after them. The button says "Sent" with a check once the sheet closes (the owner's rule, 2026-10-22).
- **The share and the picker are methods of the app's `MmBackup` plugin** (`pickPhotos`, `shareMeal`,
  `clearMealShare`, as its clipboard is, MM-590: it is the plugin that hands things to the phone's other
  apps), behind two interfaces, `MealShare` and `PhotoLibrary`, each with an in-memory implementation for
  tests and stories. The web build uses the browser's share with files where it has it, and otherwise says
  to attach the photos in the assistant; it has no picker, only the camera.
- **iOS's share sheet does not offer "Save Image"**: a meal's photos never reach the gallery from the app,
  and saving would need a library permission the app does not ask for.

## Acceptance Criteria
```gherkin
Scenario: The questions come first
  Given AI meal analysis is opened from Add food
  Then it asks for the meal's name, how much was eaten, any brand or restaurant, and when

Scenario: A name is needed
  Given no name has been given
  Then the meal cannot be sent or copied, and the step says why

Scenario: The answers are in the prompt
  Given the name "Taco night", "Most" eaten, "Chipotle", lunch at 12:30 today
  When the prompt is copied
  Then the prompt gives those answers and today's date
  And it does not tell the assistant to ask them
  And it holds nothing else about the person

Scenario: Photos and prompt sent together
  Given two photos have been added
  When the person presses "Send to assistant"
  Then the share sheet is offered both photos and the prompt
  And the prompt is also on the clipboard

Scenario: Nothing is kept
  Given photos were sent
  When the sheet is closed
  Then no photo is in the app's storage, its cache or its backup

Scenario: No photos
  Given no photos have been added
  Then the step offers "Copy prompt", and the prompt says the photos will follow

Scenario: The answers are the review's defaults
  Given the person said lunch at 12:30 today
  And the assistant's answer has no "eaten_at"
  When the answer is pasted
  Then the review shows lunch at 12:30 today

Scenario: A phone that cannot share
  Given the phone's share sheet is unavailable
  Then the step copies the prompt and says to attach the photos in the assistant
```

## UI/UX
- AI meal analysis — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Stories: AnalyzeMealStart,
  AnalyzeMealNeedsName, AnalyzeMealPromptCopied, AnalyzeMealWithPhotos, AnalyzeMealSixPhotos,
  AnalyzeMealSent, AnalyzeMealShareFailed, AnalyzeMealCannotShare, AnalyzeMealCamera,
  AnalyzeMealCameraRefused). The owner dictated the flow and asked for it finished at once (2026-10-24),
  so the panel pass is skipped (`apps/mobile/AGENTS.md`). Siblings: Estimate's slot chips and time row,
  the review's day stepper, progress photos' thumbnails (`MmPhoto`) and their camera (`MmCameraPreview`).

## Notes
- Where: the questions and the share in `apps/mobile/src/food/meal/AnalyzeMealStep.tsx`; the prompt with
  answers in `apps/mobile/src/format/mealAnalysisPrompt.ts` (a change to it is reviewed in MM-586); the
  share behind `apps/mobile/src/domain/integration/` with its plugin in `apps/mobile/src/platform/` and the
  native code in the shells.
- Built in the owner's checkout on 2026-10-24, not yet run: tests are written for CI (owner's rule), and
  nothing native has been tried on a phone. The checks are on the phone checklist in the handoff.
- Tests: `test/food/analyzeMeal.test.tsx` (the scenarios above), `test/format/mealAnalysisPromptWith.test.ts`,
  `test/ios/mealShareOnIos.test.ts` (both shells have the methods; iOS never offers Save Image).
- Owed on a phone: which assistant apps (ChatGPT, Claude, Gemini) keep both the images and the text from a
  share on Android and iOS, and that the cache files are gone afterwards.
- Out of scope: saving photos with a meal, and the app calling an AI itself.

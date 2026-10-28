---
id: MM-673
status: done
component: design-system
related: [MM-665, MM-666, MM-667, MM-670, MM-672, MM-334]
---

# Story: a wait on the network is shown as a wait

## Context
The owner (2026-10-28), on the Coach tab with a BYOK coach set up: "the coach tab starts with the default
deterministic text and then suddenly shifts into ai generated content when it loads in. this is a shit user
experience … loading indicators are going to be required at all times where network requests are involved. even
if the default text is available, we don't show that, we need to show loading indicators when the ai model is
loading, and then only show default text when the request fails or ai is unavailable." And: "this same behavior is
involved in coach breakdown on the food tab", and the pattern is to be recorded for every network request.

## Decisions
- The rule, in `apps/mobile/AGENTS.md` (Design): wherever a screen asks a service over the network it shows a
  loading indicator from the first draw, in the place the answer will stand, until the answer is in. It never shows
  a provisional answer and swaps the real one over it. The built-in or cached words appear only once the request
  failed, or at once when the service is off, and then nothing is asked.
- `MmBusyLine` (design system): the dense spinner (`MmSpinner dense`, 20 px) beside the words that say what is
  waited for, in a line of body text, as a status. "The coach is writing…" is the coach's.
- `useCoachNarration` (`src/app/`) is the one way the screens ask the narrator: `text` undefined and `waiting` while
  the model writes; the model's words once it answers; the fallback only on a failed ask (`CoachNarrator.probe`
  tells which, answering from the cache unless `fresh`), or at once with no provider or key (`coachAiConfig`),
  with no ask. The Executive summary (MM-667), every finding of "Coach's feedback" and the Dashboard's insight
  (MM-672), and Food's meal breakdown (MM-666) go through it.
- The waiting state is drawn: `writingCoach`, a story device with a provider saved and a narrator that never
  answers, on Coach, Today and Food's breakdown.

## Description
With a BYOK coach set up, the Coach tab's summary and findings, the Dashboard's insight and Food's meal breakdown
show "The coach is writing…" with a small spinner where the words will stand, then the model's words. The built-in
words show only when the model could not answer, and at once, with no wait, when no model is set up.

## Acceptance Criteria
```gherkin
Scenario: Writing
  Given a provider and key saved
  When the Coach tab, the Dashboard's insight or a meal breakdown draws
  Then "The coach is writing…" stands where the words will, and the built-in words are not shown

Scenario: Answered
  When the model answers
  Then its words replace the wait

Scenario: Failed
  When the ask fails
  Then the built-in words appear, and only then

Scenario: Off
  Given no provider or key
  Then the built-in words show at once, with no wait and no request
```

## UI/UX
- CoachWriting — apps/mobile/src/gallery/screens/Coach.stories.tsx; InsightWriting — Today.stories.tsx;
  MealCoachBreakdownWriting — Food.stories.tsx. The wait in each place the words will stand.

## Notes
- Tests: `test/coach/coachNarrationWait.test.tsx` (the four scenarios on the summary; the wait on Food's breakdown),
  `test/coach/narratedFindings.test.tsx` (the wait under a finding's title), `test/format/httpCoachNarrator.test.ts`
  (probe answers from the cache unless fresh).
- The owner's call-out: no panel. Not run locally; CI validates. Not yet seen on a phone.

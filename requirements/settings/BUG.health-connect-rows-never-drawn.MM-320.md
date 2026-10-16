---
id: MM-320
status: done
component: settings
related: [MM-68, MM-259, MM-237, MM-293, MM-318, MM-321]
---

# Bug: the Health Connect rows of Settings were never drawn in Storybook, and their note sits inside the card

## Context
The owner, 2026-10-14, with a screenshot of the phone: the Data section's Health Connect rows end in a
paragraph ("The app only reads…") crammed inside the card under a hairline, at the card's edge while the
rows' words start past their icons, with "Stored only on this device" below it. "Where is this in
Storybook? Had it been in there this atrocity of padding would surely have been caught."

It was not in Storybook. The stories' health platform has nothing in it, so the app reads it as absent and
the Settings story draws one row, "Health Connect is not on this phone". The rows for each kind of reading,
the note, "Read from Health Connect now" and the "Allowed" rows were only ever in the screen tests, which
draw nothing to look at. MM-259's panel reviewed Settings without them. The register's check
(`stories.test.tsx`) passed because Settings has a story; it never asked which parts of it a story draws
(MM-321).

The note also breaks rule 9 of `design/screen-direction.md`: Reminders, on the same screen, puts its note
under its card as a caption; Health Connect put its note, and its button, inside the card.

## Description
- A story can bring the phone's health platform (`screenStory`'s `device`), as the tests do.
- Stories for every state of the Health Connect rows: not on the phone, none allowed, some allowed with
  readings and "Read from Health Connect now", the menstruation row for a woman, a refusal, and a read that
  failed.
- Drawn, looked at in three palettes, and reviewed by the panel's product designer and UX guard against
  Reminders before the layout is changed.
- Health Connect its own section, laid out as Reminders (both reviewers): a card of rows with an icon for
  each kind, "Read from Health Connect now" its last row ("Reading…" while it reads, a snack when done),
  the note a caption under the card. Allowing a kind says so. Data keeps Food database and "Stored only on
  this device".

## Acceptance Criteria
```gherkin
Scenario: Every state is in the register
  Then Screens/Settings has a story for each Health Connect state above

Scenario: The note is placed like its sibling's
  Given Health Connect is on the phone
  Then Health Connect is its own section
  And "The app only reads…" is a caption below its card, as Reminders' note is, not inside it
  And "Read from Health Connect now" is a row of the card
```

## UI/UX
- Settings — apps/mobile/src/gallery/screens/Settings.stories.tsx (Stories: Health Connect Absent, Health
  Connect None Allowed, Health Connect Some Allowed, Health Connect Nothing Yet, Health Connect All Allowed,
  Health Connect Woman, Health Connect Allowing, Health Connect Refused, Health Connect Read Done, Health
  Connect Read Failed), reviewed in `docs/agent-runs/mm320-health-connect/`.

## Notes
Regression: the check of MM-321 fails while these rows are drawn by no story.

## Progress
Built 2026-10-14: `screenStory`'s `device` and `healthPlatform` for the stories; ten Health Connect stories;
`HealthConnectSection` rebuilt as its own section; `healthDataTypeIcon`. The panel's product designer and UX
guard reviewed the renders against Reminders: fail, rebuilt, pass (`docs/agent-runs/mm320-health-connect/`).
Found with it: MM-322 (hairlines), MM-323 (lock-out), MM-324 (two text columns). Tested in
`test/settings/healthConnect.test.tsx` ("laid out as Reminders is").

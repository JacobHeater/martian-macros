---
id: MM-603
status: in-progress
component: design-system
related: [MM-602, MM-261, MM-262, MM-279]
---

# Story: A text field for longer text, of several lines

## Context
Every text field in the app was one line. MM-602 asks the person for a free note to their assistant, which
may run to sentences. The owner (2026-10-24): now is the time for the design system to have a multi-line
text input.

## Decisions
Made with the product owner (2026-10-24):
- **The design system gets a multi-line text field**, first used by MM-602's note.

Choices I made without asking (say if any is wrong):
- **It is `MmTextField` with `lines`**, not a new component: the same label, box, focus ring, hint, helper,
  error and name (MM-279), so a screen asks for longer text with one prop. One line stays the default.
- **A `<textarea>`, whose one home is `MmTextField`** (MM-261's control homes, enforced by the architecture
  test).
- **It grows with what is typed**, from the lines asked for up to eight, then scrolls. The engine's drag
  handle is never drawn (`resize: none`, MM-262).
- **Enter starts a new line**; a multi-line field has no keyboard "Done" action, so `onSubmit` is not used.
- **12 px inside the box all round**, the field's own horizontal padding, so the lines sit as a one-line
  field's text does.

## Acceptance Criteria
```gherkin
Scenario: Several lines
  Given a text field asked for 3 lines
  Then it is a text area 3 lines tall, named by its label
  And no drag handle is drawn

Scenario: Enter is a new line
  When the person types a line, Enter, and another
  Then the value holds both lines and nothing is submitted

Scenario: Errors as before
  Given a value with an error
  Then the field is marked invalid and the error is said, as a one-line field's is

Scenario: One line by default
  Given a text field asked for no lines
  Then it is a one-line input
```

## UI/UX
- apps/mobile/src/gallery/FieldsCatalog.tsx (the multi-line example), and MM-602's field in
  apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx. Dictated by the owner, so the panel pass is skipped
  (`apps/mobile/AGENTS.md`). Recorded in `design/design-system-implementation.md`.

## Notes
- Where: `apps/mobile/src/ui/MmTextField.tsx`, `apps/mobile/src/ui/ui.css`, `apps/mobile/test/architecture.test.ts`
  (the textarea's home).
- Tests: `test/ui/textFieldLines.test.tsx`. Written for CI; not run locally (owner's rule). How it grows is
  layout, which jsdom does not do: owed on a phone.

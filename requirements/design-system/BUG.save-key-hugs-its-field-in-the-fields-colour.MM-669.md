---
id: MM-669
status: done
component: design-system
related: [MM-665, MM-301, MM-297, MM-554]
---

# Bug: "Save key" hugs its field, outlined in the field's own colour

## Context
The owner, on a phone (2026-10-28), Settings > Coach with a provider chosen: "look at the save key button here.
color scheme is fucked and it hugs the textbox."

Two causes. MM-665 placed the field and the button in a `div` of class names (`number-entry`,
`number-entry__field`) that no stylesheet defines, so they stacked with no gap, unlike every other field with a
Save (`NumberEntry`, MM-301: field and button in one row, 12 px apart). And a secondary button's outline was
`--outline-strong`, the same violet as a field's edge (MM-554: violet is the frame), at the same radius, so the
button read as a second, empty field.

## Description
The key's field runs across the row; "Save key" stands 12 px under it, beside "Test AI coach" (MM-671). A
secondary button is outlined in the secondary text colour, in every palette, so it is never the same frame as a
field; disabled it stays the faint 16 % outline of MM-297.

## Acceptance Criteria
```gherkin
Scenario: The API key row
  Given a coaching provider chosen
  Then "Save key" stands 12 px under the key field, beside "Test AI coach"
  And "Save key" is outlined in the text colour, the field in violet

Scenario: Every secondary button
  Then its outline is the secondary text colour, not the field's
```

## UI/UX
- CoachAiProviderConfigured and CoachAiProviderConfiguredSmallPhone — apps/mobile/src/gallery/screens/Settings.stories.tsx.
  The row at 360 px with a long key, so the field and the button share the width.

## Notes
- Fix: `CoachSettingsSection` stacks the field (`app-stack-item`) over its actions (`app-row`); `.mm-button-secondary`
  takes `var(--text2)` as its outline in `ui.css`.
- Test: `test/ui/saveKeyEntry.test.ts`.
- An owner's phone call-out: no panel. Not run locally; CI validates. Not yet seen on a phone.

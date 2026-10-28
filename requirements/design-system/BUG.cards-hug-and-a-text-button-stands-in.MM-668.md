---
id: MM-668
status: done
component: design-system
related: [MM-402, MM-579, MM-610, MM-253]
---

# Bug: cards hug each other, and "Open on Coach" stands in from its words

## Context
The owner, on a phone (2026-10-28): "once again, we have margin and spacing issues. look at these cards hugging each
other. also the Open on Coach button is aligned indented for no reason." Two screenshots: the Dashboard's insight
card sat on the rows under it with no gap, and on Coach the Executive summary sat on "Today's weigh-in".

The cause: a section (`.mm-section`) carries a top margin of 12 px and no bottom one; a surface and a list group
carry a bottom margin of 12 px and no top one. The body's column has no gap of its own (`.app-body { gap: 0 }`), so
a section followed by a card touched it, while a card followed by a framed section would stand 24 px off. MM-402's rhythm
covered sections and disclosures only.

"Open on Coach" (MM-610) follows the insight's "The numbers behind this" disclosure. The rule that pulls a text
button's padding out of a section body matched only a first child or one after a paragraph, so this one kept its
12 px padding and its label stood in from the words above it.

## Description
Cards on a screen stand 12 px apart whichever comes first: a section before a surface or a list group, or a surface
or a list group before a framed section. A text button directly in a section body lines its label up with the
section's words wherever it stands.

## Acceptance Criteria
```gherkin
Scenario: The Dashboard's insight and its rows
  Given an insight shows on the Dashboard
  Then its card stands 12 px above the weight, waist and water rows

Scenario: Coach's summary and the weigh-in
  Then the Executive summary card stands 12 px above "Today's weigh-in"

Scenario: Open on Coach
  Then its label starts where the insight's words start
```

## Notes
- Fix in `ui.css`: `.mm-section + .mm-surface` and `.mm-section + .mm-list-group` take the 12 px top margin; a
  framed section after a surface or a list group drops its own, so the card's 12 px is the gap. The text-button rule
  becomes `.mm-section-body > .mm-button-text:not(.mm-button-expand)`.
- Test: `test/ui/cardsApart.test.ts` (the stylesheet's rules; no layout engine under the tests). The dashboard test in
  `test/coach/insightCard.test.tsx` checks that "Open on Coach" is a direct child of the section body, where the rule
  reaches it.
- Not run locally; CI validates. Not yet seen on a phone.

---
id: MM-104
status: done
component: design-system
related: [MM-101, MM-102, MM-103, MM-105, MM-106, MM-98]
---

# Task: The components every screen is made of

## Context
See MM-101. Five shared widgets exist in `apps/mobile/lib/src/widgets.dart`: `SectionLabel`, `ChoiceCard`, `Notice`, `InfoCard` and
`StatRow`. Others that should be shared are private to one screen: the one-number entry card (weigh-in, waist) in the Progress screen, the
macro bar and the summary figure in the Today screen, the settings section header.

## Decisions
Choices I made without asking (say if any is wrong):
- **The library**, by what each is for:

| component | for | exists as |
|---|---|---|
| Card | a titled group of content, optionally with a trailing action | `InfoCard` |
| Summary card | a card that summarizes and opens a screen when tapped (the dashboard's cards) | new |
| Figure | one large number with its unit and an optional comparison ("of 2,473 kcal") | private, Today |
| Progress bar | a labelled bar of a value against a target | private, Today |
| Stat row | a name and a value | `StatRow` |
| Notice | an inline message with an icon, in `info`, `caution` or `positive` | `Notice` (one style only) |
| Choice card | one of several mutually exclusive choices, with detail and a badge | `ChoiceCard` |
| Number entry | one number with a unit and a save action | private, Progress |
| Section label | a heading above a group | `SectionLabel`, and a private twin in Settings |
| Empty state | what a card or screen says when it has nothing to show, and what to do about it | new |
| Entry row | a logged item: name, detail line, trailing figure, swipe actions | private, Today |

- **Each component takes meaning, not styling**: a notice is told it is a `caution`, never handed a color.
- **Each has every state defined**: normal, disabled, loading where it loads, empty, and error where it can fail.
- **They live in their own package**, `packages/ui`, so they can be previewed and tested without the app (MM-105).
- **Buttons, chips, fields, sheets and dialogs stay Material's own**, themed. They are not rewrapped.

## Description
Move the shared widgets into the package, promote the private ones, add the new ones, and change the screens to use them.

## Acceptance Criteria
```gherkin
Scenario: No private twins
  Then the weigh-in card and the waist card are the same component, and Settings uses the shared section label

Scenario: Meaning in, style out
  Then no screen passes a color, a text style or a padding to a library component

Scenario: Every state
  Then each component has an example of each of its states in the gallery

Scenario: Screens changed over
  Then every existing screen is built from library components, and looks the same or better than before in both themes
```

## Notes
- Do this before the dashboard (MM-98), which needs Summary card, Figure and Empty state, or the dashboard will grow its own private
  versions.

## Notes (built and verified)
- The component library is `apps/mobile/lib/src/ui/` (35 files; see MM-163) and `charts/`. Every existing screen was migrated onto it and split one declaration per file. It is a folder in the app,
  not yet a `packages/ui` package; that move is not needed until a second app or tool shares it.

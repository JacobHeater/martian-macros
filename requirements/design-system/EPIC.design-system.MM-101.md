---
id: MM-101
status: proposed
component: design-system
related: [MM-102, MM-103, MM-104, MM-105, MM-106, MM-107, MM-108, MM-109, MM-89, MM-91, MM-97]
---

# Epic: The design system

## Context
The app looks the way it does by accumulation: stock Material 3, one rust accent color (#C1440E) from which Material generates a palette,
and five small shared widgets written as screens needed them (`SectionLabel`, `ChoiceCard`, `Notice`, `InfoCard`, `StatRow`). Spacing,
text sizes and colors are chosen screen by screen. The dark theme has never been looked at (MM-91).

That is fine for five screens and gets worse with each one added. The dashboard (MM-97), the training log and the food search are all
about to be built; they should be built from parts that already agree with each other.

## Decisions (made with the product owner)
- **I propose a design system**, starting from what exists, for the product owner to adjust.

## Narrative
The design system is a small set of decisions written down once and used everywhere:

- **Tokens**: colors with meanings, for light and dark (MM-102); a type scale and a spacing scale (MM-103).
- **Components**: the cards, notices, fields, buttons and rows every screen is made of (MM-104), which can be seen and tested on their
  own in a gallery (MM-105).
- **Rules**: accessibility requirements every screen meets (MM-106); how charts and numbers with uncertainty are drawn (MM-107); and how
  the app speaks (MM-108).
- **Identity**: the app icon and name treatment (MM-109).

It stays Material 3. The aim is consistency and a recognizable character, not a custom widget toolkit.

## Acceptance Criteria (narrative)
The Epic is done when a new screen can be built without choosing a color, a text size or a gap by hand; when every existing screen uses the
tokens and components; when both themes meet the accessibility rules; and when a change to a token or a component shows up as a visible
difference in a screenshot test before it reaches a user.

## Notes
- **What I would not decide alone**: the character of the product. "Martian" suggests a warm, rust-and-dust palette and a slightly
  technical, instrument-panel feel (this is an app about measurement). MM-102 and MM-109 propose that direction; it is the part most worth
  the product owner's opinion.

---
id: MM-103
status: proposed
component: design-system
related: [MM-101, MM-104, MM-106]
---

# Task: A type scale and a spacing scale

## Context
See MM-101. Screens currently pick a Material text style and a padding number each time: 4, 6, 8, 12, 16, 24, 28 and 96 all appear as
gaps, and the same kind of number (a headline figure) is `displaySmall` in one place and `headlineMedium` in another.

## Decisions
Choices I made without asking (say if any is wrong):
- **Roles, not sizes.** A screen asks for a role and the system decides the style:

| role | used for | Material style |
|---|---|---|
| figure | the one big number on a card (calories, trend weight, expenditure) | `displaySmall` |
| figure unit | the unit or "of 2,473 kcal" beside a figure | `bodyLarge` |
| screen title | the top bar | `titleLarge` |
| card title | the heading of a card | `titleMedium` |
| label | field labels, small headings, stat names | `labelMedium` |
| body | sentences | `bodyMedium` |
| caption | explanations under a control or a chart | `bodySmall` |

- **Numbers that change or line up use tabular figures**, so digits do not shift sideways as values update.
- **The default typeface stays the platform's** (Roboto on Android, San Francisco on iOS). A brand typeface, if wanted, is for headings
  and figures only, and is a decision for the product owner (MM-109).
- **Spacing is a scale of 4**: 4, 8, 12, 16, 24, 32. Screen edge padding is 16; the gap between cards is 12; padding inside a card is 16.
  Nothing else is used.
- **Corner radius**: 12 for cards and notices, 8 for chips and badges, 4 for bars.
- **Text respects the system's text size**, up to the largest setting (MM-106).

## Description
Named text roles and spacing constants in the theme, with existing screens changed to use them.

## Acceptance Criteria
```gherkin
Scenario: The same role looks the same
  Then the headline figure on the Food, Progress and Coach screens uses the same style

Scenario: Only the scale
  Then no screen file contains a padding, gap or radius outside the scale

Scenario: Steady digits
  Given a calorie figure changing from 1,199 to 1,200
  Then the digits to its left do not move

Scenario: Large text
  Given the largest system text size
  Then every role scales and nothing is clipped
```

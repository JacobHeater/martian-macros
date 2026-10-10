---
id: MM-180
status: in-progress
component: food-logging
related: [MM-179, MM-125]
---

# Story: Give each meal its own card

## Decisions
The owner requests separate meal cards instead of one monolithic food-log
surface. Breakfast, lunch, dinner and snacks each retain their own entries,
subtotal, add control and edit/delete/copy interactions. Empty meals remain
visible as independent add targets. Shared design-system surfaces supply
spacing and clipping.

## Acceptance Criteria
```gherkin
Scenario: Empty food log
  Then breakfast, lunch, dinner and snacks each appear in a separate card
  And each card has an accessible add button for that meal

Scenario: A populated meal
  Given entries in lunch and dinner
  Then each entry appears only inside its meal's card
  And each card keeps its subtotal and Full-detail protein marker
  And editing, copying and deleting entries still work

Scenario: Separation
  Then cards have visible space between them rather than dividing one shared surface
  And the day's macro progress bars and pie chart remain above the meal cards
```

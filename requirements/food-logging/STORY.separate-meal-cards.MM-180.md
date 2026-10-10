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
Each meal is also an independent accordion. The owner chose expanded by
default; collapsing hides entry rows but leaves name, subtotal, protein marker,
copy and Add controls accessible. Expansion is retained while using the screen
and scoped to the selected date/meal, not persisted as profile data.
The header uses a crisp title, 16 dp horizontal/12 dp vertical insets, and
right-aligned controls. Add is a 28 dp rounded-square action with a 48 dp
touch target, separate from the muted 16 dp disclosure chevron. Both icons
are vector paths in 24-unit coordinates, with round 2-unit strokes, not
text characters or font glyphs. Add uses a 15% Ember tint, becoming solid on
hover/focus with the accessible on-Ember foreground. Its accessible name is
"Add food to {meal}". Cards use
12 dp corners and a subtle outline rather than pill-shaped containers.

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

Scenario: Independent meal accordions
  Given populated meal cards start expanded
  When lunch is collapsed
  Then lunch entries are hidden while the lunch header and Add control remain
  And the other meal cards keep their own expansion state
  When lunch is expanded again
  Then its entries and edit/delete interactions are available again

Scenario: Add is not a disclosure toggle
  Given a meal is expanded or collapsed
  When its Add button is pressed
  Then food entry opens for that meal
  And closing food entry leaves the meal's expansion state unchanged
  And the Add action is visually distinct from the muted disclosure chevron

Scenario: Crisp vector controls
  Then Add and the chevron use centered 16 dp stroked vector paths
  And Add has a 28 dp rounded-square background and a minimum 48 dp touch target
  And Add is labeled "Add food to" followed by the meal name
  When Add is hovered or keyboard-focused
  Then its background becomes solid Ember with a contrasting foreground
```

## Progress
Separate meal cards and expanded-by-default independent disclosures are
implemented. Tests verify independent collapse/reopen, correct meal passed
to food entry, unchanged expansion after Add, vector sizes, accessible
touch targets and hover colors. Existing edit/delete/portion flows retain
their assertions and scroll explicitly for the larger layout. Integrated
`mm check` passed; seeded cards were inspected on the Android emulator.

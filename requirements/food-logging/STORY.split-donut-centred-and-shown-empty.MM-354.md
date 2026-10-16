---
id: MM-354
status: done
component: food-logging
related: [MM-290, MM-331, MM-255]
---

# Story: the split is always a centred donut, grey until macros are logged

## Context
The product owner, 2026-10-16, with screenshots of the hero's "Split" view: with nothing logged, the view
is a sentence where the donut goes ("Log macro amounts to see your protein, carbs and fat split."), and with
food logged the donut sits to the left of its figures. "When the graph is empty because no food has been
logged, it should still show a graph, but a gray donut instead with a small subtext explaining what it
needs. Pie chart shall always be centered for split view, even when empty."

## Description
The split view draws its donut centred in every state. With no macro energy logged it is a whole ring in
the track grey, with a small line under it saying what it needs; never a "0 g · 100%" split (MM-331). With
macros logged the sectors are as before, and the three macros' figures sit beneath the donut.

## Acceptance Criteria
```gherkin
Scenario: Nothing logged
  Given no food with macros logged today
  When the hero shows "Split"
  Then a whole grey ring is drawn, centred
  And a small line under it says logging food with protein, carbs or fat shows the split

Scenario: Macros logged
  Given food with protein, carbs and fat logged
  When the hero shows "Split"
  Then the donut is centred, with each macro's grams and share beneath it

Scenario: A preview
  Given a food being added, with no macro amounts entered
  Then its preview is the same grey ring, saying macro amounts preview the split
```

## Notes
Guarded by `apps/mobile/test/charts/splitDonutCentred.test.tsx`, which failed before the change (story "Food Split
Empty"). Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16); their changes
were built: the line under the empty ring takes the figures' height, so the hero does not grow with the first food;
the figures wrap whole at a narrow width; the line says any of protein, carbs or fat is enough. The ring is `--track`,
which carries no data, so 3:1 graphic contrast does not apply; the line carries the meaning.

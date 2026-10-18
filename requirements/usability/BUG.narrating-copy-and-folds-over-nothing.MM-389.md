---
id: MM-389
status: done
component: usability
related: [MM-253, MM-340, MM-316, MM-310, MM-321, MM-390, MM-391, MM-392]
---

# Bug: lines that narrate the layout, and folds over nothing

## Context
The owner, looking at the empty Food screen on a phone (2026-10-18): "'Nothing logged yet. Start with
breakfast.' violates the anti-cruft policy. It's text that fills up white space and is indicative of AI
slop." The line was prescribed by `design/screen-direction.md`, so the direction was wrong too. The
product and UX roles then read the whole app for the same kind of cruft
(`design/anti-cruft-and-anti-slop.md` §3 and §6: "if this disappeared, would the user lose a useful
action, meaning, safety or confidence?").

## Description
Taken out or cut down, each one a line the layout already says or a control that does nothing:

| Where | Was | Now |
|---|---|---|
| Food, empty day | "Nothing logged yet. Start with breakfast." | nothing; the zero arc, the empty meals and Add food say it |
| Food, empty meal and Water sections | a fold arrow over an empty body, announced "expanded" | no fold until there is something in it; a fold left closed is forgotten, so a first food is never hidden |
| Food and Coach hero | the figure spoken twice, by the arc and by its text | the arc is spoken only where it stands in a press (Dashboard) |
| Welcome | the arc described as "A body travelling along a horizon" | decoration, not spoken |
| Train, no workouts | "Log your training here, set by set. …" | only the reason: strength is one of the three things watched |
| Workout, empty | "Add the first exercise. Each set is one tap once the first is in." | nothing; Add exercise is beneath |
| Coach, no weigh-in | "Log a weigh-in to get started." | "The coach starts from your first weigh-in." |
| Coach, Your targets | a "Next check-in" row repeating the hero's status | gone |
| Progress, no weigh-in | "Log a weigh-in to start your trend." | "No trend yet." |
| Day completeness row | "… Press to change." | the consequence only |
| Add food, Estimate | "Enter calories and macros for this food." over those fields | nothing |
| Settings, Data | "Encrypted backup is coming." | "Nothing is uploaded." alone |
| Settings, Food database | "for barcode scanning" | "for food search and barcode scanning" (it was also wrong) |
| Theme chooser | "Make it your planet." over a second headline; "A little color preview" | "Choose your theme"; "Preview" |
| Dashboard, workouts row | a "Training" subtitle under "N workouts this week" | gone |
| Food database | "It is stored on this phone…" on every pack card | said once, in the intro, which also names search |
| Coach, recent insights | "Each is listed here for 14 days." under a summary saying 14 days | gone |

`design/anti-cruft-and-anti-slop.md` gains a "No narration" limit and the screen direction's empty
states are rewritten to match.

## Acceptance Criteria
```gherkin
Scenario: An empty day
  When the Food screen shows a day with nothing logged
  Then no line says nothing is logged or names a meal to start with
  And no empty meal or the water section offers a fold
  And each keeps its heading and its add button

Scenario: The hero's figure
  When the Food screen is shown
  Then the calorie figure is spoken by its text and the arc is not spoken

Scenario: A fold left closed
  Given breakfast was folded on a day it had food
  When the Food screen shows a day with no breakfast and a food is added to it
  Then the food is shown
```

## Notes
Regression tests in `apps/mobile/test/food/emptyDayCruft.test.tsx`; they failed on main (6646354) and
pass with the fix. The reviews are `docs/agent-runs/mm389-anti-cruft/`. Decisions made for the owner
(say if any is wrong): Train keeps its one reason line rather than going bare; Progress says "No trend
yet." rather than nothing, since the trend slot would otherwise be blank; "Encrypted backup is coming"
goes as a roadmap promise in Settings.

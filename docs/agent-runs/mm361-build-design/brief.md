# Brief: the built inline insights, the snooze and the Settings list, as drawn (MM-362, MM-365, MM-367, MM-378)

## Question
Does the build of coaching insights inline, now drawing the lines the app works out, still pass the design gate
(MM-293)? The snooze (MM-378) and the Snoozed list in Settings > Coach are new since the design passed in
`docs/agent-runs/mm361-coaching-insights/`; the food and Dashboard lines changed their words at the panel's review of
the rules (`docs/agent-runs/mm365-food-rules/`, `mm367-body-water-rules/`).

## Inputs
- Renders, 412×915, Martian unless named, in
  `C:\Users\jacob\AppData\Local\Temp\claude\c--Users-jacob-dev-martian-macros\5768f982-f0cb-404d-8707-4c5ae277fee9\scratchpad\shots7\`
  (17 stories) and `shots7b\` (four stories in dark and light). Story ids are `designs-coaching-insights--<name>`:
  food-with-insights, food-two-insights-in-one-meal, food-insight-open, food-insight-snooze, food-insight-snooze-lengths,
  food-insight-snoozed, food-with-insights-eating-disorder, food-large-text, food-narrow, dashboard-with-insights,
  dashboard-waist-insight-open, dashboard-large-text, coach-settings-food-snoozed, coach-settings-food,
  coach-settings-training, workout-with-insights, coach-recent-insights.
- Source: `apps/mobile/src/coach/InlineInsight.tsx`, `SnoozeLength.ts`, `useItemInsightContent.ts`,
  `FoodEntryInsight.tsx`; `apps/mobile/src/settings/CoachAreaScreen.tsx`; `apps/mobile/src/coach/coach.css`,
  `apps/mobile/src/settings/settings.css`; `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`;
  `apps/mobile/src/format/itemInsightText.ts`.
- The earlier design review and its outcomes: `docs/agent-runs/mm361-coaching-insights/decision.md` and findings.
- The owner's rulings on the snooze: `requirements/coach-insights/STORY.snooze-an-inline-insight.MM-378.md` (inside the
  opened line; four lengths; Undo; a Snoozed list per area; "Until I turn it back on").

## Roles
- product-designer: does each new part look like its nearest siblings (the snooze choice like the rest-target chooser, the
  Snoozed list like the kinds list, the message like "Removed …" with Undo); hierarchy, colour and density of the lines now
  that they are the app's own words; the three palettes.
- ux-accessibility (the UX guard): task walkthroughs (open a line, snooze it for a week, undo; find a snooze in Settings and
  turn it back on), accessible names and roles of "Snooze…", the options and "Turn back on", focus after the sheet closes,
  targets, contrast, 200% text and 320 px, the eating-disorder state. PASS or BLOCK with the reasons.

Omitted: product, coaching, safety, nutrition, training, measurement (the rules and words were reviewed in their own runs),
react-capacitor.

## Output
`findings/<role>.md` using `agents/templates/findings/role.md`. Read-only: no edits.

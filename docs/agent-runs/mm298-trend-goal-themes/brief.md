# Run brief

- **Task ID and requested outcome:** `mm298-trend-goal-themes`. The owner
  (2026-10-14), answering the questions of `mm291-weigh-in`: small phones
  are out of scope (the 360 by 740 fold is not a goal); the weight row
  shows the last trend before the weigh-in and today's entry after it
  (MM-298); fix the disabled primary that reads as a field "on the themes"
  (MM-297); the goal is the first thing on Coach under the figures and the
  warnings (MM-299). Outcome: the three designs drawn in their stories,
  reviewed by the product-designer and UX-accessibility roles, every
  finding given an outcome, then built.
- **Audit mode:** `change`: the Dashboard weight row in both states, the
  Coach section order, and `.mm-button` disabled styles in the three
  palettes (every disabled primary and secondary in the app inherits it).
- **The proposals reviewed:** before the weigh-in, "Weigh-in" with "Last
  trend 189.6 lb" under it and the field below; after it, the trend as the
  figure with "Trend · Today 183.9 lb · 7 days −0.6 lb" (the longer
  "Trend weight · Today … · Last 7 days …" wrapped and was cut by the
  chair before review); a weighed day with no trend yet shows today's
  weight. Coach: safeguards, hero, target flags, then Goal, then the one
  thing to do. Disabled primary and secondary: no fill, a 1 px `--outline`
  border, label `--text3`; disabled text actions: no fill, no border.
- **Roles:** product-designer; ux-accessibility (the UX guard).
- **Omitted roles** (the reasons as recorded in `state.json`):
  - chair: The parent session chairs and owns the edits; its synthesis is decision.md, with no separate chair review.
  - training, nutrition, measurement, safety: Owner decisions on layout and wording of figures the app already shows, and a button style; no health rule, coaching message, measurement, data flow or engine changes.
  - coaching: Owner decisions on layout and wording of figures the app already shows, and a button style; no health rule, coaching message, measurement, data flow or engine changes. The owner answered the coaching question (trend before, today's entry after) himself.

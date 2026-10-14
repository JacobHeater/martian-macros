# Run brief

- **Task ID and requested outcome:** `mm291-weigh-in`. The owner, looking
  at the Dashboard on his phone (2026-10-14): the macro switch said
  "Share" where the word is "split" (MM-290); the weigh-in sat bare on the
  canvas with no padding and the next card touched its hint (MM-291); and
  Storybook did not show that state at all (MM-292). His rule (MM-293):
  every design goes into Storybook first, is inspected there, debated by
  the panel, and is built only if it passes the UX guard. Outcome: the
  state drawn in a story, a proposed design drawn in the same story, two
  independent reviews of it, an outcome for every finding, then the build.
- **Audit mode:** `change`: the Dashboard's weigh-in row and the hero's
  macro switch, with the components they compose (`NumberEntry`,
  `MmTextField`, `MmListRow`, `MmSegmented`) and the neighbouring tiers.
  Unreviewed: the Progress hero and welcome-back uses of `NumberEntry`
  (they inherit the component fixes), the Android shell, any device.
- **Existing facts (chair, before the review):** the Today stories all
  had a weigh-in saved for the story day, so no story drew the weigh-in;
  `Screens/Today/Not Weighed Today` was added first and reproduced the
  phone's layout in Storybook (the field indented under an `MmSection`
  heading, no surface, the waist card touching the hint).
- **The proposal reviewed:** the weigh-in as the first row of the
  Dashboard's list group (the slot the trend row takes once saved), the
  field and Save on the row's text column inside the row's padding; the
  switch reading "Grams | Split".
- **Roles:** product-designer (visual hierarchy, the design system) and
  ux-accessibility (the UX guard: the build waits on no open blocking
  finding of its).
- **Evidence given to the reviewers:** before and after captures of the
  story at 412 by 915 (after in Martian, Light and Dark), the demo
  Dashboard before, the tickets and the source paths.
- **Omitted roles** (the reasons as recorded in `state.json`):
  - chair: The parent session chairs and owns the edits; its synthesis is decision.md, with no separate chair review.
  - training, nutrition, measurement, safety: A layout, label and input change on the Dashboard; no health rule, coaching message, measurement, data flow or engine changes.
  - coaching: A layout, label and input change on the Dashboard; no health rule, coaching message, measurement, data flow or engine changes. The bounded question on the trend before and after the weigh-in is left open for this role.
